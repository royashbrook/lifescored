<script lang="ts">
	let {
		value = $bindable(),
		step = 1000,
		prefix = '$',
		suffix = ''
	}: { value: number; step?: number; prefix?: string; suffix?: string } = $props();
</script>

<div class="flex items-center text-[0.875rem]" style:color="var(--ink)">
	{#if prefix}<span style:color="var(--ink-dim)">{prefix}</span>{/if}
	<input
		type="number"
		bind:value
		{step}
		class="ml-0.5 w-full bg-transparent tabular-nums outline-none"
		style:font-family="var(--font-mono)"
	/>
	{#if suffix}<span class="text-[0.6875rem]" style:color="var(--ink-dim)">{suffix}</span>{/if}
</div>
