import { json } from '@sveltejs/kit';
import { rulebookExport } from '$lib/rulebook/export';

// Static, prerendered, PII-free: the complete rulebook + the exact math, so any agent can
// compute a life score on its OWN side. No inputs are ever sent to this server.
export const prerender = true;

export function GET() {
	return json(rulebookExport(), {
		headers: { 'cache-control': 'public, max-age=3600' }
	});
}
