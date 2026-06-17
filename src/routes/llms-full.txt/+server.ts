import { llmsFullText } from '$lib/rulebook/export';

// Static, prerendered, PII-free: the full rulebook + methodology as one flat markdown document
// (the prose twin of rules.json), for the llms-full.txt convention. Built from the same source.
export const prerender = true;

export function GET() {
	return new Response(llmsFullText(), {
		headers: {
			'content-type': 'text/plain; charset=utf-8',
			'cache-control': 'public, max-age=3600'
		}
	});
}
