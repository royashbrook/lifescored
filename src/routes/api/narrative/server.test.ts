import { beforeEach, expect, it, vi } from 'vitest';
import { POST } from './+server';
import { handleNarrative } from '$lib/server/narrative';

vi.mock('$lib/server/narrative', () => ({ handleNarrative: vi.fn(async () => ({ text: 'story' })) }));
beforeEach(() => vi.clearAllMocks());
const post = (body: BodyInit, headers: HeadersInit) => POST({
	request: new Request('https://test/api/narrative', { method: 'POST', body, headers }),
	url: new URL('https://test/api/narrative'),
	platform: { env: { NARRATIVE_KV: {}, NARRATIVE_BUDGET: {} } },
	getClientAddress: () => '192.0.2.1'
} as unknown as Parameters<typeof POST>[0]);

it('rejects simple cross-site POSTs including JSON bytes with no Content-Type before using the budget', async () => {
	for (const origin of ['https://foreign.test', 'null']) {
		for (const contentType of ['', 'text/plain', 'application/json']) {
			const headers: Record<string, string> = { origin };
			if (contentType) headers['content-type'] = contentType;
			const response = await post(new TextEncoder().encode('{}'), headers);
			expect(response.status).toBe(403);
		}
	}
	expect((await post(new TextEncoder().encode('{}'), {})).status).toBe(415);
	expect((await post('{}', { 'content-type': 'text/plain' })).status).toBe(415);
	expect(handleNarrative).not.toHaveBeenCalled();
});

it('bounds bytes before parsing and retains fallback for malformed JSON', async () => {
	expect((await post(JSON.stringify({ padding: 'x'.repeat(8192) }), { 'content-type': 'application/json' })).status).toBe(413);
	expect(await (await post('{', { 'content-type': 'application/json' })).json()).toEqual({ fallback: true });
	expect(handleNarrative).not.toHaveBeenCalled();
});

it('accepts same-origin and non-browser JSON clients', async () => {
	const cases: HeadersInit[] = [{ origin: 'https://test', 'content-type': 'application/json; charset=utf-8' }, { 'content-type': 'application/json' }];
	for (const headers of cases) {
		expect(await (await post('{}', headers)).json()).toEqual({ text: 'story' });
	}
	expect(handleNarrative).toHaveBeenCalledTimes(2);
});
