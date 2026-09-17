<script lang="ts">
	import type { ScoreResult } from '$lib/engine/score';
	import { fetchNarrative, type Narrative } from '$lib/narrative/client';

	let { result }: { result: ScoreResult } = $props();
	let narrative = $state<Narrative | null>(null);
	let loading = $state(false);
	let narrativeKey = $state('');
	const resultKey = $derived(JSON.stringify(result));
	const stale = $derived(narrative !== null && narrativeKey !== resultKey);

	async function generate() {
		loading = true;
		const key = resultKey;
		const next = await fetchNarrative(result);
		if (key === resultKey) {
			narrative = next;
			narrativeKey = key;
		}
		loading = false;
	}
</script>

<div class="mt-5 rounded-lg p-3.5" style:background="var(--panel)" style:border="1px solid var(--line)">
	<div class="mb-1 flex items-center justify-between">
		<div class="text-[0.75rem] tracking-[0.12em]" style:font-family="var(--font-mono)" style:color="var(--ink-dim)">
			IN PLAIN LANGUAGE
			{#if narrative?.source === 'ai'}<span class="ml-2" style:color="var(--sourced)">AI</span>{/if}
		</div>
		<button
			class="rounded-full border px-3 py-1 text-[0.75rem]"
			style:font-family="var(--font-mono)"
			style:color="var(--ink-dim)"
			style:border-color="var(--line)"
			disabled={loading}
			onclick={generate}
		>{loading ? '…' : narrative ? 'regenerate' : 'tell me the story'}</button>
	</div>
	{#if narrative}
		{#if stale}<p role="status" class="text-[0.8125rem]" style:color="var(--moves)">Your score changed. Regenerate to describe the current numbers.</p>{/if}
		<p class="text-[0.9375rem] leading-snug" style:color="var(--ink)">{narrative.text}</p>
		{#if narrative.source === 'local'}
			<p class="mt-1 text-[0.6875rem]" style:color="var(--ink-dim)">composed locally from the rulebook — the AI narrator wasn't needed or wasn't available</p>
		{/if}
	{:else}
		<p class="text-[0.8125rem] italic" style:color="var(--ink-dim)">A short narrative of what the numbers above are actually saying. Only rounded subtotals ever leave your device.</p>
	{/if}
</div>
