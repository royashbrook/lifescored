<script lang="ts">
	let { value, max, accent }: { value: number; max: number; accent: string } = $props();
	const pct = $derived(max > 0 ? Math.max(0, Math.min(100, (Math.abs(value) / max) * 100)) : 0);
</script>

<div class="h-1.5 w-full rounded-full" style:background="rgba(255,255,255,0.06)">
	<div
		class="h-1.5 rounded-full transition-all duration-500"
		style:width="{pct}%"
		style:background={value < 0 ? '#c0604d' : accent}
	></div>
</div>
