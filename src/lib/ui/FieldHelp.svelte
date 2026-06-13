<script lang="ts">
	import { RULES, type FieldHelp } from '$lib/rulebook';
	import Tag from './Tag.svelte';

	let { entry }: { entry: FieldHelp } = $props();
	let open = $state(false);
	const rule = $derived(RULES.find((r) => r.id === entry.ruleId));

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape') open = false;
	}
</script>

<svelte:window onkeydown={onKey} />

<span class="relative inline-flex">
	<button
		type="button"
		class="inline-flex h-[15px] w-[15px] items-center justify-center rounded-full border text-[9px]"
		style:font-family="var(--font-mono)"
		style:color={open ? 'var(--start)' : 'var(--ink-dim)'}
		style:border-color={open ? 'var(--start)' : 'rgba(255,255,255,0.25)'}
		aria-label="What does this mean?"
		aria-expanded={open}
		onclick={(e) => {
			e.preventDefault();
			open = !open;
		}}
	>?</button>

	{#if open}
		<!-- click-catcher closes the popover; sits behind it -->
		<button
			type="button"
			class="fixed inset-0 z-40 cursor-default"
			aria-label="Close"
			tabindex="-1"
			onclick={() => (open = false)}
		></button>
		<div
			class="absolute top-[20px] left-0 z-50 w-[250px] rounded-lg p-3 text-left"
			style:background="#20242c"
			style:border="1px solid rgba(124,147,184,0.4)"
		>
			<div class="mb-1 flex items-center justify-between gap-2">
				<span class="text-[13px] font-semibold" style:font-family="var(--font-display)" style:color="var(--ink)">{rule?.label}</span>
				{#if rule}<Tag kind={rule.evidence} />{/if}
			</div>
			<div class="text-[12px] leading-snug" style:color="var(--ink)">{entry.help}</div>
			{#if rule}
				<div class="mt-2 pl-2 text-[10.5px] leading-snug" style:border-left="2px solid var(--start)" style:color="var(--ink-dim)">
					{rule.source.name}. <a href="/rulebook" class="underline" style:color="var(--start)">read the rule ↗</a>
				</div>
			{/if}
		</div>
	{/if}
</span>
