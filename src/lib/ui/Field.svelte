<script lang="ts">
	import { setContext, type Snippet } from 'svelte';
	import type { FieldHelp } from '$lib/rulebook';
	import FieldHelpPopover from './FieldHelp.svelte';
	let { label, help, children }: { label: string; help?: FieldHelp; children: Snippet } = $props();
	const id = $props.id();
	setContext('field', { id, labelId: `${id}-label` });
</script>

<div class="flex flex-col gap-1">
	<span class="flex items-center gap-1.5 text-[0.75rem] tracking-[0.1em] uppercase" style:font-family="var(--font-mono)" style:color="var(--ink-dim)">
		<label for={id} id={`${id}-label`}>{label}</label>
		{#if help}<FieldHelpPopover entry={help} />{/if}
	</span>
	{@render children()}
</div>
