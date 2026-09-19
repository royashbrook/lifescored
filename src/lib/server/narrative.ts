import type { NarrativePayload } from '../engine/quantize';
import { RULES } from '../rulebook';

// Levers are echoed into the LLM prompt and into the cache key, so only real rule ids are allowed:
// keeps arbitrary strings out of the prompt (injection) and out of the cache key (budget entropy).
const RULE_IDS = new Set(RULES.map((r) => r.id));

export interface KVLike {
	get(key: string): Promise<string | null>;
	put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
}

export interface NarrativeDeps {
	kv: KVLike;
	apiKey: string | undefined;
	fetchFn: typeof fetch;
	today(): string; // 'YYYY-MM-DD' — injected so tests control the clock
	reserve(day: string, ipHash: string): Promise<boolean>;
}

export type NarrativeResponse = { text: string } | { fallback: true };

const CACHE_TTL = 60 * 60 * 24 * 30; // 30 days
const GEMINI_URL =
	'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const DOMAIN_ORDER = ['origin', 'health', 'finance', 'education', 'social', 'civic'] as const;

function validate(body: unknown): NarrativePayload | null {
	const b = body as NarrativePayload;
	if (!b || b.v !== 1 || !b.domains || !b.tiers || !Array.isArray(b.levers)) return null;
	const nums = [...DOMAIN_ORDER.map((d) => b.domains[d]), b.tiers.starting_point, b.tiers.your_moves];
	if (!nums.every((n) => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= 10_000_000)) return null;
	if (b.levers.length > 50 || !b.levers.every((l) => typeof l === 'string')) return null;
	// Drop anything that isn't a known rule id — unknown strings never reach the prompt or cache key.
	b.levers = b.levers.filter((l) => RULE_IDS.has(l));
	return b;
}

/** Canonical, key-order-independent serialization for hashing. */
function canonical(p: NarrativePayload): string {
	return JSON.stringify([
		p.v,
		DOMAIN_ORDER.map((d) => p.domains[d]),
		[p.tiers.starting_point, p.tiers.your_moves],
		[...p.levers].sort()
	]);
}

async function sha256(s: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// IPv6 privacy addresses share a /64 allowance. Normalize through the platform URL parser;
// IPv4-mapped IPv6 uses the same allowance as its IPv4 address.
function quotaAddress(ip: string): string {
	if (!ip.includes(':')) return ip;
	const normalized = new URL(`http://[${ip}]/`).hostname.slice(1, -1);
	const [left, right] = normalized.split('::');
	const start = left ? left.split(':') : [];
	const end = right ? right.split(':') : [];
	const words = (right === undefined ? start : [...start, ...Array(8 - start.length - end.length).fill('0'), ...end])
		.map((word) => parseInt(word, 16));
	if (words.slice(0, 5).every((word) => word === 0) && words[5] === 0xffff) {
		return [words[6] >> 8, words[6] & 255, words[7] >> 8, words[7] & 255].join('.');
	}
	return `${words.slice(0, 4).map((word) => word.toString(16)).join(':')}::/64`;
}

function buildPrompt(p: NarrativePayload): string {
	const domains = DOMAIN_ORDER.map((d) => `${d}: ${p.domains[d]}`).join(', ');
	return [
		'You are the narrator for "Life Score", an app that exposes how existing systems (credit scores, actuarial tables, audit studies) turn a life into a number — for transparency, never judgment.',
		'Write a plain-language narrative of at most 150 words for this anonymous score profile. No greetings, no headers, no bullet points, no advice-column tone. Address the reader as "you".',
		`Tier subtotals — starting point (luck of birth): ${p.tiers.starting_point}; your moves (things influenced): ${p.tiers.your_moves}.`,
		`Domain subtotals: ${domains}.`,
		p.levers.length
			? `Available improvement levers (rule ids): ${p.levers.join(', ')}. Mention the spirit of at most two.`
			: 'No improvement levers are currently available.',
		'Close with one sentence reminding the reader these weights are visible, editable, and arguable in the app.'
	].join('\n');
}

export async function handleNarrative(
	body: unknown,
	ip: string,
	deps: NarrativeDeps
): Promise<NarrativeResponse> {
	const payload = validate(body);
	if (!payload) return { fallback: true };

	const hash = await sha256(canonical(payload));
	const cacheKey = `narr:${hash}`;
	let cached: string | null;
	try { cached = await deps.kv.get(cacheKey); } catch { return { fallback: true }; }
	if (cached) return { text: cached };

	if (!deps.apiKey) return { fallback: true };

	const day = deps.today();
	try {
		// Count attempts before the upstream call, including failures. Never spend when reservation fails.
		if (!await deps.reserve(day, await sha256(`${day}:${quotaAddress(ip)}`))) return { fallback: true };
		const res = await deps.fetchFn(GEMINI_URL, {
			method: 'POST',
			// Bound the upstream call so a hung Gemini doesn't hold the worker open (and waste budget).
			// AbortError falls through to the catch -> { fallback: true }, like any other failure.
			signal: AbortSignal.timeout(8000),
			headers: { 'content-type': 'application/json', 'x-goog-api-key': deps.apiKey },
			body: JSON.stringify({
				contents: [{ parts: [{ text: buildPrompt(payload) }] }],
				// thinkingBudget 0 disables 2.5-flash's default reasoning pass, which would
				// otherwise consume the output budget and truncate the narrative to a fragment.
				generationConfig: {
					temperature: 0.4,
					maxOutputTokens: 600,
					thinkingConfig: { thinkingBudget: 0 }
				}
			})
		});
		if (!res.ok) return { fallback: true };
		const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
		const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
		if (!text) return { fallback: true };
		await deps.kv.put(cacheKey, text, { expirationTtl: CACHE_TTL });
		return { text };
	} catch {
		return { fallback: true };
	}
}
