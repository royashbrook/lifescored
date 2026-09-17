<script lang="ts">
	import { getContext } from 'svelte';
	const field = getContext<{ id: string; labelId: string }>('field');
	let {
		value = $bindable(),
		opts
	}: { value: string | number; opts: [string | number, string][] } = $props();
</script>

<select id={field?.id} bind:value class="min-w-0 w-full bg-transparent text-[0.875rem]" style:color="var(--ink)">
	{#each opts as [k, label] (k)}
		<option value={k} style:background="var(--panel)">{label}</option>
	{/each}
</select>
