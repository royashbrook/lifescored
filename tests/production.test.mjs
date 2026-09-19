import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Server } from '../.svelte-kit/output/server/index.js';
import { manifest } from '../.svelte-kit/output/server/manifest.js';

test('production SvelteKit rejects cross-site narrative bodies before cache or budget access', async () => {
  const server = new Server(manifest);
  await server.init({ env: {} });
  let reads = 0;
  const platform = { env: {
    NARRATIVE_KV: { get: async () => { reads++; return 'cached story'; } },
    NARRATIVE_BUDGET: { getByName: () => { throw new Error('must not reserve'); } }
  } };
  const body = JSON.stringify({
    v: 1, domains: { origin: 40, health: 35, finance: 30, education: 15, social: 20, civic: 10 },
    tiers: { starting_point: 55, your_moves: 95 }, levers: ['dti']
  });
  const post = (headers, bytes = new TextEncoder().encode(body)) => server.respond(
    new Request('https://lifescored.test/api/narrative', { method: 'POST', headers, body: bytes }),
    { platform, getClientAddress: () => '192.0.2.1' }
  );
  for (const origin of ['https://foreign.test', 'null']) {
    for (const contentType of ['', 'text/plain', 'application/x-www-form-urlencoded', 'application/json']) {
      const headers = { origin };
      if (contentType) headers['content-type'] = contentType;
      assert.equal((await post(headers)).status, 403);
    }
  }
  assert.equal((await post({})).status, 415);
  assert.equal((await post({ 'content-type': 'application/json' }, new TextEncoder().encode('x'.repeat(8193)))).status, 413);
  assert.equal(reads, 0);
  for (const headers of [{ origin: 'https://lifescored.test', 'content-type': 'application/json' }, { 'content-type': 'application/json' }]) {
    const response = await post(headers);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { text: 'cached story' });
  }
  assert.equal(reads, 2);
});
