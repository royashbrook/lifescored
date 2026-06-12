<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';
	import { setContext } from 'svelte';
	import { createProfileState, loadStoredProfile, storeProfile } from '$lib/state/profile.svelte';
	import { decodeProfile } from '$lib/share/codec';

	let { children } = $props();

	const profile = createProfileState(loadStoredProfile(browser ? localStorage : null));
	setContext('profile', profile);

	let shareNotice = $state<'ok' | 'bad' | null>(null);

	// Imported share links: #p=1.<payload>
	$effect(() => {
		if (!browser) return;
		const hash = location.hash;
		if (!hash.startsWith('#p=')) return;
		decodeProfile(hash.slice(3)).then((decoded) => {
			if (decoded) {
				profile.replace(decoded);
				shareNotice = 'ok';
			} else {
				shareNotice = 'bad';
			}
			replaceState(location.pathname, {});
		});
	});

	// Persist on every change.
	$effect(() => {
		storeProfile(browser ? localStorage : null, profile.snapshot());
	});

	const links = [
		['/', 'Score'],
		['/rulebook', 'Rulebook'],
		['/about', 'Why']
	];
</script>

<div class="mx-auto w-full max-w-[760px] px-5 pt-7 pb-10">
	<header class="mb-1 flex flex-wrap items-end justify-between gap-2">
		<h1 class="text-[30px] leading-none font-semibold tracking-[-0.01em]" style:font-family="var(--font-display)">
			Life Score
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
			Couldn't read that share link — showing defaults. dismiss ×
		</button>
	{/if}

	{@render children()}
</div>
