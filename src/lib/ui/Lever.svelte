<script lang="ts">
	let { active, label, delta, onclick }: { active: boolean; label: string; delta: number; onclick: () => void } = $props();
</script>

<button
	type="button"
	class="rounded-full border px-3 py-1.5 text-[0.8125rem] transition-all"
	style:font-family="var(--font-mono)"
	style:background={active ? 'rgba(217,164,65,0.16)' : 'transparent'}
	style:color={active ? 'var(--moves)' : 'var(--ink-dim)'}
	style:border-color={active ? 'rgba(217,164,65,0.5)' : 'var(--line)'}
	{onclick}
>{active ? '● ' : '○ '}{label} <span class="tabular-nums">+{delta}</span></button>
