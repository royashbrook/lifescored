import type { NarrativePayload } from '../engine/quantize';

export interface KVLike {
	get(key: string): Promise<string | null>;
	put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
}

export interface NarrativeDeps {
	kv: KVLike;
	apiKey: string | undefined;
	fetchFn: typeof fetch;
	today(): string; // 'YYYY-MM-DD' — injected so tests control the clock
}

export type NarrativeResponse = { text: string } | { fallback: true };

const CACHE_TTL = 60 * 60 * 24 * 30; // 30 days
const COUNTER_TTL = 60 * 60 * 48;
const IP_DAILY_LIMIT = 10;
const GLOBAL_DAILY_BUDGET = 200; // Gemini calls/day — well under free tier
const GEMINI_URL =
	'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

const DOMAIN_ORDER = ['origin', 'health', 'finance', 'education', 'social', 'civic'] as const;

function validate(body: unknown): NarrativePayload | null {
	const b = body as NarrativePayload;
	if (!b || b.v !== 1 || !b.domains || !b.tiers || !Array.isArray(b.levers)) return null;
	const nums = [...DOMAIN_ORDER.map((d) => b.domains[d]), b.tiers.starting_point, b.tiers.your_moves];
	if (!nums.every((n) => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= 10_000_000)) return null;
	if (b.levers.length > 20 || !b.levers.every((l) => typeof l === 'string' && l.length < 40)) return null;
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
	const cached = await deps.kv.get(cacheKey);
	if (cached) return { text: cached };

	if (!deps.apiKey) return { fallback: true };

	const day = deps.today();
	const ipKey = `rl:${ip}:${day}`;
	const budgetKey = `budget:${day}`;
	const ipCount = Number((await deps.kv.get(ipKey)) ?? '0');
	if (ipCount >= IP_DAILY_LIMIT) return { fallback: true };
	const budget = Number((await deps.kv.get(budgetKey)) ?? '0');
	if (budget >= GLOBAL_DAILY_BUDGET) return { fallback: true };

	// Count the attempt before calling: fail toward fallback, never toward unmetered calls.
	await deps.kv.put(ipKey, String(ipCount + 1), { expirationTtl: COUNTER_TTL });
	await deps.kv.put(budgetKey, String(budget + 1), { expirationTtl: COUNTER_TTL });

	try {
		const res = await deps.fetchFn(GEMINI_URL, {
			method: 'POST',
			headers: { 'content-type': 'application/json', 'x-goog-api-key': deps.apiKey },
			body: JSON.stringify({
				contents: [{ parts: [{ text: buildPrompt(payload) }] }],
				generationConfig: { temperature: 0.4, maxOutputTokens: 400 }
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
