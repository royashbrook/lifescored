import { describe, expect, it, vi } from 'vitest';
import type { NarrativePayload } from '../engine/quantize';
import { handleNarrative, type KVLike } from './narrative';

const PAYLOAD: NarrativePayload = {
	v: 1,
	domains: { origin: 40, health: 35, finance: 30, education: 15, social: 20, civic: 10 },
	tiers: { starting_point: 55, your_moves: 95 },
	levers: ['dti', 'emergency-fund']
};

function memKV(): KVLike & { store: Map<string, string> } {
	const store = new Map<string, string>();
	return {
		store,
		get: async (k) => store.get(k) ?? null,
		put: async (k, v) => void store.set(k, v)
	};
}

const geminiOk = (text: string) =>
	vi.fn(async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status: 200 }));

const deps = (kv: KVLike, fetchFn: typeof fetch) => ({
	kv, fetchFn, apiKey: 'test-key', today: () => '2026-06-11'
});

describe('handleNarrative', () => {
	it('rejects malformed payloads', async () => {
		const r = await handleNarrative({ nope: true }, '1.2.3.4', deps(memKV(), geminiOk('x')));
		expect(r).toEqual({ fallback: true });
	});

	it('cache miss calls Gemini once, stores, then hits cache without calling again', async () => {
		const kv = memKV();
		const fetchFn = geminiOk('Your score story.');
		const first = await handleNarrative(PAYLOAD, '1.2.3.4', deps(kv, fetchFn));
		expect(first).toEqual({ text: 'Your score story.' });
		expect(fetchFn).toHaveBeenCalledTimes(1);
		expect([...kv.store.keys()].some((k) => k.startsWith('narr:'))).toBe(true);

		const second = await handleNarrative(PAYLOAD, '5.6.7.8', deps(kv, fetchFn));
		expect(second).toEqual({ text: 'Your score story.' });
		expect(fetchFn).toHaveBeenCalledTimes(1); // cached
	});

	it('identical payloads hash identically regardless of key order', async () => {
		const kv = memKV();
		const fetchFn = geminiOk('once');
		await handleNarrative(PAYLOAD, '1.1.1.1', deps(kv, fetchFn));
		const reordered = JSON.parse(JSON.stringify(PAYLOAD));
		reordered.domains = Object.fromEntries(Object.entries(PAYLOAD.domains).reverse());
		await handleNarrative(reordered, '1.1.1.1', deps(kv, fetchFn));
		expect(fetchFn).toHaveBeenCalledTimes(1);
	});

	it('falls back on Gemini error and does not cache the failure', async () => {
		const kv = memKV();
		const bad = vi.fn(async () => new Response('quota', { status: 429 }));
		const r = await handleNarrative(PAYLOAD, '1.2.3.4', deps(kv, bad));
		expect(r).toEqual({ fallback: true });
		expect([...kv.store.keys()].some((k) => k.startsWith('narr:'))).toBe(false);
	});

	it('falls back when no API key is configured', async () => {
		const r = await handleNarrative(PAYLOAD, '1.2.3.4', { ...deps(memKV(), geminiOk('x')), apiKey: undefined });
		expect(r).toEqual({ fallback: true });
	});

	it('enforces the per-IP daily limit (10)', async () => {
		const kv = memKV();
		const fetchFn = geminiOk('hi');
		const d = deps(kv, fetchFn);
		for (let n = 0; n < 10; n++) {
			// vary payload so each request is a cache miss
			const p = { ...PAYLOAD, tiers: { ...PAYLOAD.tiers, your_moves: n * 5 } };
			expect('text' in (await handleNarrative(p, '9.9.9.9', d))).toBe(true);
		}
		const p11 = { ...PAYLOAD, tiers: { ...PAYLOAD.tiers, your_moves: 990 } };
		expect(await handleNarrative(p11, '9.9.9.9', d)).toEqual({ fallback: true });
	});

	it('enforces the global daily Gemini budget (200 calls)', async () => {
		const kv = memKV();
		kv.store.set('budget:2026-06-11', '200');
		const fetchFn = geminiOk('hi');
		const r = await handleNarrative(PAYLOAD, '1.2.3.4', deps(kv, fetchFn));
		expect(r).toEqual({ fallback: true });
		expect(fetchFn).not.toHaveBeenCalled();
	});

	it('budget guard still serves cache hits', async () => {
		const kv = memKV();
		const fetchFn = geminiOk('cached story');
		await handleNarrative(PAYLOAD, '1.2.3.4', deps(kv, fetchFn));
		kv.store.set('budget:2026-06-11', '200');
		const r = await handleNarrative(PAYLOAD, '5.5.5.5', deps(kv, fetchFn));
		expect(r).toEqual({ text: 'cached story' });
	});
});
