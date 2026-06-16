<script lang="ts">
	import { PACKS, TOGGLEABLE_PACKS } from '$lib/rulebook';
	import type { createProfileState } from '$lib/state/profile.svelte';
	let { profile }: { profile: ReturnType<typeof createProfileState> } = $props();
</script>

<div class="mb-4">
	<div class="mb-2.5 text-[0.75rem] tracking-[0.1em] uppercase" style:font-family="var(--font-mono)" style:color="var(--ink-dim)">
		Layers <span class="lowercase tracking-normal">— opt-in, off by default</span>
	</div>
	<div class="flex flex-wrap gap-2">
		{#each TOGGLEABLE_PACKS as id (id)}
			{@const on = profile.packs[id] === true}
			<button
				type="button"
				class="rounded-full border px-3 py-1.5 text-[0.75rem] transition-all"
				style:font-family="var(--font-mono)"
				style:background={on ? 'rgba(217,164,65,0.12)' : 'transparent'}
				style:color={on ? 'var(--moves)' : 'var(--ink-dim)'}
				style:border-color={on ? 'rgba(217,164,65,0.5)' : 'var(--line)'}
				title={PACKS[id].blurb}
				onclick={() => profile.setPack(id, !on)}
			>{on ? '● ' : '+ '}{PACKS[id].label}</button>
		{/each}
	</div>
	{#each TOGGLEABLE_PACKS as id (id)}
		{#if profile.packs[id] === true}
			<div class="mt-2 text-[0.75rem] leading-snug" style:color="var(--ink-dim)">{PACKS[id].blurb}</div>
		{/if}
	{/each}
</div>
