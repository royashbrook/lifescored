<script lang="ts">
	import { BASELINE_WEIGHT, MAX_WEIGHT, type RuleOverride } from '$lib/engine/score';
	import { TIERS, type Rule } from '$lib/rulebook';
	import Tag from './Tag.svelte';

	let {
		rule,
		override,
		onOverride
	}: {
		rule: Rule;
		override: RuleOverride | undefined;
		onOverride: (patch: RuleOverride) => void;
	} = $props();

	const accent = $derived(TIERS[rule.tier].accent);
	const weight = $derived(override?.weight ?? rule.defaultWeight);
	const enabled = $derived(override?.enabled !== false);
	const modified = $derived(weight !== rule.defaultWeight || !enabled);
	const lo = $derived(Math.round(rule.bounds[0] * weight));
	const hi = $derived(rule.bounds[1] === Infinity ? '∞' : String(Math.round(rule.bounds[1] * weight)));
</script>

<div class="mb-2 rounded-lg p-3.5" style:background="var(--panel)" style:border="1px solid var(--line)" style:opacity={enabled ? 1 : 0.55}>
	<div class="mb-1.5 flex items-center justify-between gap-2">
		<div class="flex flex-wrap items-center gap-2">
			<span class="text-[14px] font-semibold" style:font-family="var(--font-display)" style:color="var(--ink)">{rule.label}</span>
			<Tag kind={rule.evidence} />
			{#if rule.controllable}
				<span class="rounded-sm border px-1.5 py-0.5 text-[9px]" style:font-family="var(--font-mono)" style:color="var(--moves)" style:border-color="rgba(217,164,65,0.35)">CONTROLLABLE</span>
			{/if}
			{#if modified}
				<span class="text-[9px]" style:font-family="var(--font-mono)" style:color="var(--spec)">EDITED BY YOU</span>
			{/if}
		</div>
		<span class="shrink-0 text-[11px] tabular-nums" style:font-family="var(--font-mono)" style:color={accent}>
			×{(weight / BASELINE_WEIGHT).toFixed(1)} · {lo} to +{hi}
		</span>
	</div>

	<div class="mb-2 text-[12.5px] leading-snug" style:color="var(--ink)">{rule.logic}</div>

	{#if rule.caveat}
		<div class="mb-2 text-[11px] leading-snug italic" style:color="var(--spec)">Caveat: {rule.caveat}</div>
	{/if}

	<div class="mb-3 pl-2.5 text-[11px] leading-snug" style:border-left="2px solid {accent}" style:color="var(--ink-dim)">
		<span style:color="var(--ink)">{rule.source.name}.</span>
		{rule.source.finding}
		<a href={rule.source.url} target="_blank" rel="noreferrer" style:color={accent} class="underline">source ↗</a>
		<span class="ml-1">(accessed {rule.source.accessed})</span>
	</div>

	<div class="mb-3 text-[11px] leading-snug" style:color="var(--ink-dim)">
		<span style:color="var(--ink)">Why this weight:</span> {rule.weightRationale}
	</div>

	<div class="flex items-center gap-3">
		<input
			type="range"
			min="0"
			max={MAX_WEIGHT}
			value={weight}
			aria-label="weight for {rule.label}"
			class="h-1 w-40 accent-[var(--moves)]"
			oninput={(e) => onOverride({ weight: Number(e.currentTarget.value) })}
		/>
		<span class="text-[10px] tabular-nums" style:font-family="var(--font-mono)" style:color="var(--ink-dim)">weight {weight} (×{(weight / BASELINE_WEIGHT).toFixed(1)})</span>
		<button
			class="ml-auto text-[10px]"
			style:font-family="var(--font-mono)"
			style:color={enabled ? 'var(--ink-dim)' : 'var(--spec)'}
			onclick={() => onOverride({ enabled: !enabled })}
		>{enabled ? 'exclude from my score' : 'excluded — include again'}</button>
	</div>
</div>
