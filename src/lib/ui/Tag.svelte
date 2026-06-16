<script lang="ts">
	let { kind }: { kind: 'SOURCED' | 'SPECULATIVE' } = $props();
	const sourced = $derived(kind === 'SOURCED');
</script>

<span
	class="rounded-sm border px-1.5 py-0.5 text-[10px] font-bold tracking-[0.12em]"
	style:font-family="var(--font-mono)"
	style:background={sourced ? 'rgba(111,191,150,0.14)' : 'rgba(216,168,92,0.14)'}
	style:color={sourced ? 'var(--sourced)' : 'var(--spec)'}
	style:border-color={sourced ? 'rgba(111,191,150,0.35)' : 'rgba(216,168,92,0.35)'}
>{kind}</span>
