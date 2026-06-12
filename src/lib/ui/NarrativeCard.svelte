<script lang="ts">
	import type { ScoreResult } from '$lib/engine/score';
	import { fetchNarrative, type Narrative } from '$lib/narrative/client';

	let { result }: { result: ScoreResult } = $props();
	let narrative = $state<Narrative | null>(null);
	let loading = $state(false);

	async function generate() {
		loading = true;
		narrative = await fetchNarrative(result);
		loading = false;
	}
</script>

<div class="mt-5 rounded-lg p-3.5" style:background="var(--panel)" style:border="1px solid var(--line)">
	<div class="mb-1 flex items-center justify-between">
		<div class="text-[11px] tracking-[0.12em]" style:font-family="var(--font-mono)" style:color="var(--ink-dim)">
			IN PLAIN LANGUAGE
			{#if narrative?.source === 'ai'}<span class="ml-2" style:color="var(--sourced)">AI</span>{/if}
		</div>
		<button
			class="rounded-full border px-3 py-1 text-[11px]"
			style:font-family="var(--font-mono)"
			style:color="var(--ink-dim)"
			style:border-color="var(--line)"
			disabled={loading}
			onclick={generate}
		>{loading ? '…' : narrative ? 'regenerate' : 'tell me the story'}</button>
	</div>
	{#if narrative}
		<p class="text-[13.5px] leading-snug" style:color="var(--ink)">{narrative.text}</p>
		{#if narrative.source === 'local'}
			<p class="mt-1 text-[10px]" style:color="var(--ink-dim)">composed locally from the rulebook — the AI narrator wasn't needed or wasn't available</p>
		{/if}
	{:else}
		<p class="text-[12px] italic" style:color="var(--ink-dim)">A short narrative of what the numbers above are actually saying. Only rounded subtotals ever leave your device.</p>
	{/if}
</div>
