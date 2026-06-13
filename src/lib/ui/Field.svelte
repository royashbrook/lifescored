<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { FieldHelp } from '$lib/rulebook';
	import FieldHelpPopover from './FieldHelp.svelte';
	let { label, help, children }: { label: string; help?: FieldHelp; children: Snippet } = $props();
</script>

<label class="flex flex-col gap-1">
	<span class="flex items-center gap-1.5 text-[10px] tracking-[0.1em] uppercase" style:font-family="var(--font-mono)" style:color="var(--ink-dim)">
		{label}
		{#if help}<FieldHelpPopover entry={help} />{/if}
	</span>
	{@render children()}
</label>
