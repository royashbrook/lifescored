<script lang="ts">
	import type { ScoreResult } from '$lib/engine/score';
	import { topMovers } from '$lib/engine/highlights';

	let { result }: { result: ScoreResult } = $props();
	const movers = $derived(topMovers(result, 3));
	const sign = (v: number) => (v >= 0 ? '+' : '') + v.toLocaleString('en-US');
</script>

{#if movers.lifting.length > 0 || movers.weakest.length > 0}
	<div class="mb-5 rounded-lg p-3.5" style:background="var(--panel)" style:border="1px solid var(--line)">
		<div class="mb-2.5 text-[11px] tracking-[0.12em]" style:font-family="var(--font-mono)" style:color="var(--ink-dim)">
			WHAT'S MOVING YOUR SCORE MOST
		</div>
		<div class="flex flex-col gap-2">
			{#if movers.lifting.length > 0}
				<div class="flex flex-wrap items-center gap-2">
					<span class="w-[68px] shrink-0 text-[11px]" style:font-family="var(--font-mono)" style:color="var(--sourced)">LIFTING IT</span>
					{#each movers.lifting as r (r.id)}
						<span class="rounded-full px-2.5 py-1 text-[11px]" style:font-family="var(--font-mono)" style:color="var(--moves)" style:background="rgba(217,164,65,0.12)">
							{r.label} <b>{sign(r.value)}</b>
						</span>
					{/each}
				</div>
			{/if}
			{#if movers.weakest.length > 0}
				<div class="flex flex-wrap items-center gap-2">
					<span class="w-[68px] shrink-0 text-[11px]" style:font-family="var(--font-mono)" style:color="#c0604d">WEAKEST</span>
					{#each movers.weakest as r (r.id)}
						<span class="rounded-full px-2.5 py-1 text-[11px]" style:font-family="var(--font-mono)"
							style:color={r.value < 0 ? '#c0604d' : 'var(--ink-dim)'}
							style:background={r.value < 0 ? 'rgba(192,96,77,0.12)' : 'rgba(255,255,255,0.05)'}>
							{r.label} <b>{sign(r.value)}</b>
						</span>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}
