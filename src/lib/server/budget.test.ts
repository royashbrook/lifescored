import { afterAll, expect, it } from 'vitest';
import { Miniflare } from 'miniflare';
import { resolve } from 'node:path';

const mf = new Miniflare({
	compatibilityDate: '2026-06-01',
	modules: [
		{ type: 'ESModule', path: resolve('worker/quota-test.js'), contents: `
			export { NarrativeBudget } from './budget.js';
			export default { async fetch(request, env) {
				const u = new URL(request.url);
				return Response.json(await env.NARRATIVE_BUDGET.getByName(u.searchParams.get('test')).reserve(u.searchParams.get('day'), u.searchParams.get('ip')));
			} };
		` },
		{ type: 'ESModule', path: resolve('worker/budget.js') }
	],
	durableObjects: { NARRATIVE_BUDGET: { className: 'NarrativeBudget', useSQLite: true } }
});
afterAll(() => mf.dispose());
const reserve = async (test: string, ip: string, day = '2026-09-17') =>
	(await mf.dispatchFetch(`https://test/?${new URLSearchParams({ test, ip, day })}`)).json();

it('atomically limits concurrent global reservations and resets on a new day', async () => {
	const results = await Promise.all(Array.from({ length: 220 }, (_, i) => reserve('global-cap', `hash-${i}`)));
	expect(results.filter(Boolean)).toHaveLength(200);
	expect(await reserve('global-cap', 'new-ip')).toBe(false);
	expect(await reserve('global-cap', 'new-ip', '2026-09-18')).toBe(true);
	expect(await reserve('global-cap', 'late-yesterday', '2026-09-17')).toBe(false);
}, 20_000);

it('concurrent per-IP failures do not consume the global budget', async () => {
	const sameIp = await Promise.all(Array.from({ length: 20 }, () => reserve('ip-cap', 'same-hash')));
	expect(sameIp.filter(Boolean)).toHaveLength(10);
	const others = await Promise.all(Array.from({ length: 195 }, (_, i) => reserve('ip-cap', `other-${i}`)));
	expect(others.filter(Boolean)).toHaveLength(190);
}, 20_000);
