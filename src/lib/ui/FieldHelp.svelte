<script lang="ts">
	import { RULES, type FieldHelp } from '$lib/rulebook';
	import Tag from './Tag.svelte';

	let { entry }: { entry: FieldHelp } = $props();
	let open = $state(false);
	let pos = $state({ left: 0, top: 0 });
	const rule = $derived(RULES.find((r) => r.id === entry.ruleId));

	function toggle(e: MouseEvent) {
		e.preventDefault();
		if (open) {
			open = false;
			return;
		}
		const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
		// Popover is 15.625rem wide; rem scales with the root font-size, so derive the actual
		// px width from it (not a fixed 250) or the right-edge clamp drifts on large screens.
		const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
		const W = 15.625 * rootPx;
		pos = {
			left: Math.min(Math.max(8, r.left), window.innerWidth - W - 8),
			top: r.bottom + 6
		};
		open = true;
	}
	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape') open = false;
	}
</script>

<svelte:window onkeydown={onKey} />

<button
	type="button"
	class="inline-flex h-[0.9375rem] w-[0.9375rem] items-center justify-center rounded-full border text-[0.625rem]"
	style:font-family="var(--font-mono)"
	style:color={open ? 'var(--start)' : 'var(--ink-dim)'}
	style:border-color={open ? 'var(--start)' : 'rgba(255,255,255,0.25)'}
	aria-label="What does this mean?"
	aria-expanded={open}
	onclick={toggle}
>?</button>

{#if open}
	<button
		type="button"
		class="fixed inset-0 z-40 cursor-default"
		aria-label="Close"
		tabindex="-1"
		onclick={() => (open = false)}
	></button>
	<div
		class="fixed z-50 w-[15.625rem] rounded-lg p-3 text-left"
		style:left="{pos.left}px"
		style:top="{pos.top}px"
		style:background="#20242c"
		style:border="1px solid rgba(124,147,184,0.4)"
	>
		<div class="mb-1 flex items-center justify-between gap-2">
			<span class="text-[0.875rem] font-semibold" style:font-family="var(--font-display)" style:color="var(--ink)">{rule?.label}</span>
			{#if rule}<Tag kind={rule.evidence} />{/if}
		</div>
		<div class="text-[0.8125rem] leading-snug" style:color="var(--ink)">{entry.help}</div>
		{#if rule}
			<div class="mt-2 pl-2 text-[0.6875rem] leading-snug" style:border-left="2px solid var(--start)" style:color="var(--ink-dim)">
				{rule.source.name}. <a href="/rulebook" class="underline" style:color="var(--start)">read the rule ↗</a>
			</div>
		{/if}
	</div>
{/if}
