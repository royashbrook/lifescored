<script lang="ts">
	import type { Snippet } from 'svelte';
	let { label, children }: { label: string; children: Snippet } = $props();
</script>

<label class="flex flex-col gap-1">
	<span class="text-[10px] tracking-[0.1em] uppercase" style:font-family="var(--font-mono)" style:color="var(--ink-dim)">{label}</span>
	{@render children()}
</label>
