import { test, expect } from '@playwright/test';

const rpc = (id: number | undefined, method: string, params?: object) => ({
	jsonrpc: '2.0',
	...(id === undefined ? {} : { id }),
	method,
	...(params ? { params } : {})
});

test('mcp initialize handshake returns server info and capabilities', async ({ request }) => {
	const res = await request.post('/mcp', {
		data: rpc(1, 'initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'e2e', version: '1' } })
	});
	expect(res.status()).toBe(200);
	const body = await res.json();
	expect(body.result.serverInfo.name).toBe('life-scored');
	expect(body.result.protocolVersion).toBe('2025-06-18');
	expect(body.result.capabilities.tools).toBeTruthy();
});

test('mcp lists relay tools and serves the rulebook (no compute, no PII args)', async ({ request }) => {
	const list = await (await request.post('/mcp', { data: rpc(2, 'tools/list') })).json();
	const names = list.result.tools.map((t: { name: string }) => t.name);
	expect(names).toContain('get_rulebook');
	expect(names).toContain('get_input_schema');
	expect(names).toContain('get_methodology');
	// every tool takes no arguments — the server never accepts personal data
	for (const t of list.result.tools) expect(t.inputSchema.properties).toEqual({});

	const call = await (await request.post('/mcp', { data: rpc(3, 'tools/call', { name: 'get_rulebook', arguments: {} }) })).json();
	const data = JSON.parse(call.result.content[0].text);
	expect(data.rulesCount).toBe(35);
	expect(data.inputs.length).toBeGreaterThan(0);
	expect(data.rules.some((r: { id: string }) => r.id === 'credit-score')).toBe(true);
});

test('mcp acks notifications with 202 and rejects GET with 405', async ({ request }) => {
	const notif = await request.post('/mcp', { data: rpc(undefined, 'notifications/initialized') });
	expect(notif.status()).toBe(202);

	const get = await request.get('/mcp');
	expect(get.status()).toBe(405);
});

test('mcp returns a JSON-RPC error for an unknown method', async ({ request }) => {
	const res = await (await request.post('/mcp', { data: rpc(9, 'does/notExist') })).json();
	expect(res.error.code).toBe(-32601);
});

test('mcp does not crash on null / [null] / empty-batch bodies', async ({ request }) => {
	// literal JSON null
	const nullRes = await request.post('/mcp', { headers: { 'content-type': 'application/json' }, data: 'null' });
	expect(nullRes.status()).toBe(200);
	expect((await nullRes.json()).error.code).toBe(-32600);

	// a batch containing a null member -> per-member error, no crash
	const batchNull = await request.post('/mcp', { data: [null] });
	expect(batchNull.status()).toBe(200);
	const bn = await batchNull.json();
	expect((Array.isArray(bn) ? bn[0] : bn).error.code).toBe(-32600);

	// empty batch -> single invalid-request error (not 202)
	const empty = await request.post('/mcp', { data: [] });
	expect((await empty.json()).error.code).toBe(-32600);
});
