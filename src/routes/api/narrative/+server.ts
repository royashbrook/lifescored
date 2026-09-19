import { json } from '@sveltejs/kit';
import { handleNarrative } from '$lib/server/narrative';
import { BodyTooLarge, readJson } from '$lib/server/read-json';
import type { RequestHandler } from './$types';

export const prerender = false;

export const POST: RequestHandler = async ({ request, url, platform, getClientAddress }) => {
	// JSON requires a browser preflight. Also reject explicit foreign/opaque origins.
	const origin = request.headers.get('origin');
	if (origin !== null && origin !== url.origin) return json({ fallback: true }, { status: 403 });
	if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
		return json({ fallback: true }, { status: 415 });
	}
	const env = platform?.env;
	if (!env?.NARRATIVE_KV || !env.NARRATIVE_BUDGET) return json({ fallback: true });
	let body: unknown;
	try {
		body = await readJson(request, 8 * 1024);
	} catch (error) {
		if (error instanceof BodyTooLarge) return json({ fallback: true }, { status: 413 });
		return json({ fallback: true });
	}
	const result = await handleNarrative(body, getClientAddress(), {
		kv: env.NARRATIVE_KV,
		apiKey: env.GEMINI_API_KEY,
		// Bind to globalThis: calling it as `deps.fetchFn(...)` would otherwise rebind
		// `this` to the deps object, which the Workers runtime rejects (Illegal invocation).
		fetchFn: fetch.bind(globalThis),
		reserve: (day, ipHash) => env.NARRATIVE_BUDGET.getByName('global').reserve(day, ipHash),
		today: () => new Date().toISOString().slice(0, 10)
	});
	return json(result);
};
