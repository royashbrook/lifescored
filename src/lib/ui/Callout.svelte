<script lang="ts">
	import type { Snippet } from 'svelte';
	let { title, children }: { title: string; children: Snippet } = $props();
</script>

<div class="mt-4 rounded-lg p-3.5" style:background="rgba(217,164,65,0.08)" style:border="1px solid rgba(217,164,65,0.25)">
	<div class="mb-1 text-[12px] tracking-[0.12em]" style:font-family="var(--font-mono)" style:color="var(--moves)">{title}</div>
	<div class="text-[15px] leading-snug" style:color="var(--ink)">{@render children()}</div>
</div>
