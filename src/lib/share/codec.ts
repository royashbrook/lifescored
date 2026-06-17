import type { Overrides } from '../engine/score';
import { DEFAULT_INPUTS, migrateLegacyInputs, PACKS } from '../rulebook';
import type { Inputs } from '../rulebook';

export interface Profile {
	inputs: Inputs;
	overrides: Overrides;
	packs: Record<string, boolean>;
}

export function sanitizePacks(raw: unknown): Record<string, boolean> {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
	const result: Record<string, boolean> = {};
	for (const [id, val] of Object.entries(raw as Record<string, unknown>)) {
		if ((id in PACKS) && typeof val === 'boolean') {
			result[id] = val;
		}
	}
	return result;
}

const VERSION = '1';

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
	const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
	return new Uint8Array(await new Response(out).arrayBuffer());
}

const toB64url = (bytes: Uint8Array) =>
	btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');

function fromB64url(s: string): Uint8Array {
	const b64 = s.replaceAll('-', '+').replaceAll('_', '/');
	return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export async function encodeProfile(profile: Profile): Promise<string> {
	const json = new TextEncoder().encode(JSON.stringify(profile));
	const deflated = await pipe(json, new CompressionStream('deflate-raw'));
	return `${VERSION}.${toB64url(deflated)}`;
}

export function sanitizeOverrides(raw: unknown): Overrides {
	const overrides: Overrides = {};
	if (!raw || typeof raw !== 'object') return overrides;
	for (const [id, o] of Object.entries(raw as Record<string, unknown>)) {
		if (!o || typeof o !== 'object') continue;
		const { weight, enabled } = o as { weight?: unknown; enabled?: unknown };
		const clean: { weight?: number; enabled?: boolean } = {};
		if (typeof weight === 'number' && Number.isFinite(weight)) clean.weight = weight;
		if (typeof enabled === 'boolean') clean.enabled = enabled;
		if (Object.keys(clean).length > 0) overrides[id] = clean;
	}
	return overrides;
}

export async function decodeProfile(encoded: string): Promise<Profile | null> {
	try {
		const dot = encoded.indexOf('.');
		if (dot < 0 || encoded.slice(0, dot) !== VERSION) return null;
		const payload = encoded.slice(dot + 1);
		// A real profile encodes to a few hundred chars; reject absurd input and cap the inflated
		// size so a crafted deflate bomb can't blow up the tab on link-open.
		if (payload.length > 16384) return null;
		const bytes = fromB64url(payload);
		const inflated = await pipe(bytes, new DecompressionStream('deflate-raw'));
		if (inflated.length > 262144) return null;
		const parsed = JSON.parse(new TextDecoder().decode(inflated));
		if (!parsed || !parsed.inputs || typeof parsed.inputs !== 'object') return null;
		const migrated = migrateLegacyInputs(parsed.inputs as Record<string, unknown>);
		const inputs = Object.fromEntries(
			(Object.keys(DEFAULT_INPUTS) as (keyof typeof DEFAULT_INPUTS)[]).map((k) => [k, migrated[k] ?? DEFAULT_INPUTS[k]]) // Missing keys fill from defaults — deliberately generous for old links/profiles; do not "fix" to adverse assumptions.
		) as unknown as Profile['inputs'];
		return {
			inputs,
			overrides: sanitizeOverrides((parsed as { overrides?: unknown }).overrides),
			packs: sanitizePacks((parsed as { packs?: unknown }).packs)
		};
	} catch {
		return null;
	}
}
