import type { Overrides } from '../engine/score';
import type { Inputs } from '../rulebook';

export interface Profile {
	inputs: Inputs;
	overrides: Overrides;
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

export async function decodeProfile(encoded: string): Promise<Profile | null> {
	try {
		const dot = encoded.indexOf('.');
		if (dot < 0 || encoded.slice(0, dot) !== VERSION) return null;
		const bytes = fromB64url(encoded.slice(dot + 1));
		const inflated = await pipe(bytes, new DecompressionStream('deflate-raw'));
		const parsed = JSON.parse(new TextDecoder().decode(inflated));
		if (!parsed || !parsed.inputs || typeof parsed.inputs !== 'object' || !parsed.overrides || typeof parsed.overrides !== 'object') return null;
		return parsed as Profile;
	} catch {
		return null;
	}
}
