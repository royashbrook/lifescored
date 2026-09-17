import { expect, it, vi } from 'vitest';
import { deflateRawSync } from 'node:zlib';
import { decodeProfile } from './codec';
import { computeScore } from '../engine/score';
import { DEFAULT_INPUTS, normalizeInputs } from '../rulebook/inputs';

it('normalizes malformed known fields and accepts only scorable profiles', async () => {
	const inputs = { age: { toString: null }, country: 'constructor', insured: 'false', assets: [], debt: null, smoker: 5 };
	const encoded = '1.' + deflateRawSync(JSON.stringify({ inputs })).toString('base64url');
	const decoded = await decodeProfile(encoded);
	expect(decoded?.inputs).toEqual(DEFAULT_INPUTS);
	expect(() => computeScore(decoded!.inputs)).not.toThrow();
	expect(normalizeInputs({ income: Infinity, age: NaN, partnered: false, degree: true }).education).toBe('bachelor');
	expect(normalizeInputs({ netWorth: { toString: null } }).assets).toBe(0);
});

it('cancels a decompression stream as soon as consumed output exceeds the cap', async () => {
	let cancelled = false;
	let produced = 0;
	vi.stubGlobal('DecompressionStream', class {
		writable = new WritableStream();
		readable = new ReadableStream({
			pull(controller) { produced += 65536; controller.enqueue(new Uint8Array(65536)); },
			cancel() { cancelled = true; }
		}, { highWaterMark: 0 });
	});
	try {
		expect(await decodeProfile('1.eA')).toBeNull();
		expect(cancelled).toBe(true);
		expect(produced).toBe(327680);
	} finally { vi.unstubAllGlobals(); }
});

it('rejects a real compressed 4 MiB payload below the encoded size limit', async () => {
	const encoded = deflateRawSync(Buffer.alloc(4 * 1024 * 1024, 32)).toString('base64url');
	expect(encoded.length).toBeLessThan(16384);
	expect(await decodeProfile('1.' + encoded)).toBeNull();
});
