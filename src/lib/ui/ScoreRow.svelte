<script lang="ts">
	import type { RuleScore } from '$lib/engine/score';
	import Bar from './Bar.svelte';
	import Tag from './Tag.svelte';

	let { row, accent }: { row: RuleScore; accent: string } = $props();
</script>

<div class="border-b py-3" style:border-color="var(--line)" style:opacity={row.enabled ? 1 : 0.4}>
	<div class="mb-1.5 flex items-baseline justify-between gap-3">
		<div class="flex min-w-0 items-center gap-2">
			<span class="text-[13.5px]" style:color="var(--ink)">{row.label}</span>
			<Tag kind={row.evidence} />
			{#if !row.enabled}
				<span class="text-[9px]" style:font-family="var(--font-mono)" style:color="var(--ink-dim)">EXCLUDED BY YOU</span>
			{/if}
		</div>
		<span class="shrink-0 text-[13px] tabular-nums" style:font-family="var(--font-mono)" style:color={accent}>
			{row.value >= 0 ? '+' : ''}{row.value}
		</span>
	</div>
	<Bar value={row.value} max={row.max} {accent} />
	<div class="mt-1.5 text-[11px] leading-snug" style:color="var(--ink-dim)">{row.description}</div>
</div>
