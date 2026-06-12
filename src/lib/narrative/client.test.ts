import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_INPUTS } from '../rulebook';
import { computeScore } from '../engine/score';
import { fetchNarrative } from './client';

const result = computeScore(DEFAULT_INPUTS);

describe('fetchNarrative', () => {
	it('returns AI text when the endpoint responds with text', async () => {
		const fetchFn = vi.fn(async () => new Response(JSON.stringify({ text: 'ai says' }), { status: 200 }));
		expect(await fetchNarrative(result, fetchFn as typeof fetch)).toEqual({ text: 'ai says', source: 'ai' });
	});

	it('falls back locally on fallback flag, HTTP error, and network error', async () => {
		for (const fetchFn of [
			vi.fn(async () => new Response(JSON.stringify({ fallback: true }), { status: 200 })),
			vi.fn(async () => new Response('boom', { status: 500 })),
			vi.fn(async () => { throw new Error('offline'); })
		]) {
			const r = await fetchNarrative(result, fetchFn as unknown as typeof fetch);
			expect(r.source).toBe('local');
			expect(r.text.length).toBeGreaterThan(50);
		}
	});
});
