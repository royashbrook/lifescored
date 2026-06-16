<script lang="ts">
	import { BASELINE_WEIGHT, type RuleScore } from '$lib/engine/score';
	import Bar from './Bar.svelte';
	import Tag from './Tag.svelte';

	let { row, accent }: { row: RuleScore; accent: string } = $props();
</script>

<div class="border-b py-3.5" style:border-color="var(--line)" style:opacity={row.enabled ? 1 : 0.4}>
	<div class="mb-1.5 flex items-baseline justify-between gap-3">
		<div class="flex min-w-0 items-center gap-2">
			<span class="text-[0.9375rem]" style:color="var(--ink)">{row.label}</span>
			<Tag kind={row.evidence} />
			{#if !row.enabled}
				<span class="text-[0.625rem]" style:font-family="var(--font-mono)" style:color="var(--ink-dim)">EXCLUDED BY YOU</span>
			{/if}
		</div>
		<span class="shrink-0 text-[0.875rem] tabular-nums" style:font-family="var(--font-mono)" style:color={accent}>
			{row.value >= 0 ? '+' : ''}{row.value.toLocaleString('en-US')}
		</span>
	</div>
	<Bar value={row.value} max={row.max} {accent} />
	<div class="mt-1.5 text-[0.75rem] tabular-nums" style:font-family="var(--font-mono)" style:color="var(--ink-dim)">
		position {(row.position * 10).toFixed(1)} × weight {(row.max / BASELINE_WEIGHT).toFixed(1)}× = {row.value >= 0 ? '+' : ''}{row.value.toLocaleString('en-US')}
		{#if row.max > 0 && Math.abs(row.value) > row.max}
			<span style:color="var(--moves)">· ×{(Math.abs(row.value) / row.max).toFixed(1)} over scale</span>
		{/if}
	</div>
	<div class="mt-2 text-[0.8125rem] leading-normal" style:color="var(--ink-dim)">{row.description}</div>
</div>
