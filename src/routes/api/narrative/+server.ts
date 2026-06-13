import { json } from '@sveltejs/kit';
import { handleNarrative } from '$lib/server/narrative';
import type { RequestHandler } from './$types';

export const prerender = false;

export const POST: RequestHandler = async ({ request, platform, getClientAddress }) => {
	const env = platform?.env;
	if (!env?.NARRATIVE_KV) return json({ fallback: true });
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ fallback: true });
	}
	const result = await handleNarrative(body, getClientAddress(), {
		kv: env.NARRATIVE_KV,
		apiKey: env.GEMINI_API_KEY,
		// Bind to globalThis: calling it as `deps.fetchFn(...)` would otherwise rebind
		// `this` to the deps object, which the Workers runtime rejects (Illegal invocation).
		fetchFn: fetch.bind(globalThis),
		today: () => new Date().toISOString().slice(0, 10)
	});
	return json(result);
};
