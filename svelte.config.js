import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		// /rules.json is an unlinked endpoint, so name it explicitly for the prerenderer.
		prerender: { entries: ['*', '/rules.json'] }
	}
};
export default config;
