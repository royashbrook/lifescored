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

	// While someone is just *looking* at a shared link they haven't touched, this holds the
	// JSON of those imported answers. The persist effect below refuses to write to localStorage
	// while the current state still equals this — so opening a friend's link never silently
	// overwrites the answers you already saved. The moment you change anything, the snapshot
	// diverges, this guard stops matching, and your edits start saving as your own.
	let sharedBaseline: string | null = null;

	// Import a shared set of answers from the incoming #p=1.<payload> hash (runs once), then
	// strip the hash. We deliberately do NOT keep the URL fragment live: a fragment that
	// silently mirrored income/assets/debt would leak them through the browser's native share.
	// Sharing is explicit now — see ShareButton.
	$effect(() => {
		if (!browser) return;
		if (!initialHash.startsWith('#p=')) return;
		decodeProfile(initialHash.slice(3)).then((decoded) => {
			if (decoded) {
				profile.replace(decoded);
				sharedBaseline = JSON.stringify(decoded);
				shareNotice = 'ok';
			} else {
				shareNotice = 'bad';
			}
			replaceState(`${location.pathname}${location.search}`, {});
		});
	});

	// Persist on every change — except while viewing an untouched shared link (see above),
	// so a peek at someone else's answers doesn't clobber your own saved ones.
	$effect(() => {
		const snap = profile.snapshot();
		if (sharedBaseline !== null && JSON.stringify(snap) === sharedBaseline) return;
		storeProfile(browser ? localStorage : null, snap);
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
		<button class="mb-2 text-left text-[11px]" style:color="var(--sourced)" onclick={() => (shareNotice = null)}>
			Showing answers from a shared link. Your own saved answers are untouched — change anything here and it
			becomes yours. dismiss ×
		</button>
	{:else if shareNotice === 'bad'}
		<button class="mb-2 text-[11px]" style:color="var(--spec)" onclick={() => (shareNotice = null)}>
			Couldn't read that share link — your existing data is untouched. dismiss ×
		</button>
	{/if}

	{@render children()}

	<footer
		class="mt-10 flex items-center justify-between gap-x-1.5 border-t pt-4 text-[10px] whitespace-nowrap sm:gap-x-2 sm:text-[11px]"
		style:border-color="var(--line)"
		style:font-family="var(--font-mono)"
		style:color="var(--ink-dim)"
	>
		<div class="flex items-center gap-x-1 sm:gap-x-1.5">
			<span>life. scored.</span>
			<span aria-hidden="true" style:opacity="0.5">·</span>
			<a href="/about#how-it-works" class="underline" style:color="var(--ink-dim)">no tracking</a>
			<span aria-hidden="true" style:opacity="0.5">·</span>
			<a href="https://github.com/royashbrook/lifescored" target="_blank" rel="noreferrer" class="underline" style:color="var(--ink-dim)">open source</a>
		</div>
		<a
			href="https://github.com/sponsors/royashbrook"
			target="_blank"
			rel="noreferrer"
			class="shrink-0 rounded-full border px-1.5 py-1 sm:px-2.5"
			style:color="var(--moves)"
			style:border-color="rgba(217,164,65,0.35)"
		>sponsor ↗</a>
	</footer>
</div>
