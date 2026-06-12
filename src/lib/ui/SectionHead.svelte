<script lang="ts">
	let { label, sub, accent, subtotal }: { label: string; sub: string; accent: string; subtotal: number } = $props();
</script>

<div class="mt-1 mb-1 flex items-baseline justify-between gap-3">
	<div>
		<span class="text-[15px] font-semibold" style:font-family="var(--font-display)" style:color={accent}>{label}</span>
		<span class="ml-2 text-[11px]" style:color="var(--ink-dim)">{sub}</span>
	</div>
	<span class="shrink-0 text-[13px] tabular-nums" style:font-family="var(--font-mono)" style:color={accent}>
		{subtotal >= 0 ? '+' : ''}{subtotal.toLocaleString('en-US')}
	</span>
</div>
