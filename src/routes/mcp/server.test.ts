import { expect, it } from 'vitest';
import { POST } from './+server';

const post = (body: unknown) => POST({
	request: new Request('https://test/mcp', { method: 'POST', body: JSON.stringify(body) })
} as Parameters<typeof POST>[0]);

it('rejects oversized batches and bodies while keeping small batches and notifications', async () => {
	const message = { id: 1, method: 'tools/call', params: { name: 'get_rulebook' } };
	for (const count of [1, 15, 16]) {
		const response = await post(Array(count).fill(message));
		expect(response.status).toBe(200);
		expect(await response.json()).toHaveLength(count);
	}
	for (const body of [Array(17).fill(message), { ...message, padding: 'x'.repeat(65536) }]) {
		const response = await post(body);
		expect(response.status).toBe(413);
		expect(response.headers.get('access-control-allow-origin')).toBe('*');
		expect(await response.json()).toMatchObject({ error: { code: -32600 } });
	}
	expect((await post([{ method: 'notifications/initialized' }])).status).toBe(202);
});
