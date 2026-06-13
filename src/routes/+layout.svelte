<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';
	import { setContext } from 'svelte';
	import { createProfileState, loadStoredProfile, storeProfile } from '$lib/state/profile.svelte';
	import { decodeProfile } from '$lib/share/codec';

	let { children } = $props();

	// Capture the incoming hash synchronously, BEFORE any effect can overwrite it.
	const initialHash = browser ? location.hash : '';

	const profile = createProfileState(loadStoredProfile(browser ? localStorage : null));
	setContext('profile', profile);

	let shareNotice = $state<'ok' | 'bad' | null>(null);

	// Import a shared profile from the incoming #p=1.<payload> hash (runs once), then
	// strip the hash. We deliberately do NOT keep the URL fragment live: a fragment that
	// silently mirrored income/assets/debt would leak them through the browser's native
	// share. Sharing is explicit now — see ShareButton. The imported profile is persisted
	// to localStorage by the effect below, so dropping the hash loses nothing.
	$effect(() => {
		if (!browser) return;
		if (!initialHash.startsWith('#p=')) return;
		decodeProfile(initialHash.slice(3)).then((decoded) => {
			if (decoded) {
				profile.replace(decoded);
				shareNotice = 'ok';
			} else {
				shareNotice = 'bad';
			}
			replaceState(`${location.pathname}${location.search}`, {});
		});
	});

	// Persist on every change.
	$effect(() => {
		storeProfile(browser ? localStorage : null, profile.snapshot());
	});

	const links = [
		['/', 'Score'],
		['/rulebook', 'Rulebook'],
		['/improve', 'Improve'],
		['/about', 'Why']
	];
</script>

<div class="mx-auto w-full max-w-[760px] px-5 pt-7 pb-10">
	<header class="mb-1 flex flex-wrap items-end justify-between gap-2">
		<h1 class="text-[30px] leading-none font-semibold tracking-[-0.01em]" style:font-family="var(--font-display)">
			life. scored.
</h1>
		<nav class="flex gap-1">
			{#each links as [href, label] (href)}
				<a
					{href}
					class="rounded-full border px-3 py-1 text-[12px] transition-all"
					style:font-family="var(--font-mono)"
					style:background={page.url.pathname === href ? 'rgba(255,255,255,0.08)' : 'transparent'}
					style:color={page.url.pathname === href ? 'var(--ink)' : 'var(--ink-dim)'}
					style:border-color={page.url.pathname === href ? 'rgba(255,255,255,0.2)' : 'var(--line)'}
				>{label}</a>
			{/each}
		</nav>
	</header>

	{#if shareNotice === 'ok'}
		<button class="mb-2 text-[11px]" style:color="var(--sourced)" onclick={() => (shareNotice = null)}>
			Loaded a shared profile — it stays on this device. dismiss ×
		</button>
	{:else if shareNotice === 'bad'}
		<button class="mb-2 text-[11px]" style:color="var(--spec)" onclick={() => (shareNotice = null)}>
			Couldn't read that share link — your existing data is untouched. dismiss ×
		</button>
	{/if}

	{@render children()}

	<footer
		class="mt-10 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t pt-4 text-[11px]"
		style:border-color="var(--line)"
		style:font-family="var(--font-mono)"
		style:color="var(--ink-dim)"
	>
		<span>life. scored.</span>
		<span>· no tracking</span>
		<a href="https://github.com/royashbrook/lifescored" target="_blank" rel="noreferrer" class="underline" style:color="var(--ink-dim)">· open source ↗</a>
		<a
			href="https://github.com/sponsors/royashbrook"
			target="_blank"
			rel="noreferrer"
			class="ml-auto rounded-full border px-2.5 py-1"
			style:color="var(--moves)"
			style:border-color="rgba(217,164,65,0.35)"
		>sponsor ↗</a>
	</footer>
</div>
