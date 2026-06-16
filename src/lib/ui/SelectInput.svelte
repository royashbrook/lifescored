<script lang="ts">
	let {
		value = $bindable(),
		opts
	}: { value: string | number; opts: [string | number, string][] } = $props();
</script>

<select bind:value class="w-full bg-transparent text-[0.875rem] outline-none" style:color="var(--ink)">
	{#each opts as [k, label] (k)}
		<option value={k} style:background="var(--panel)">{label}</option>
	{/each}
</select>
