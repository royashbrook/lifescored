<script lang="ts">
	import { PRESETS } from '$lib/rulebook';
	import type { createProfileState } from '$lib/state/profile.svelte';

	let { profile }: { profile: ReturnType<typeof createProfileState> } = $props();
	const currentKey = $derived(JSON.stringify(profile.inputs));
	const activeId = $derived(PRESETS.find((p) => JSON.stringify(p.inputs) === currentKey)?.id ?? null);
</script>

<div class="mb-4">
	<div class="mb-2.5 text-[0.75rem] tracking-[0.1em] uppercase" style:font-family="var(--font-mono)" style:color="var(--ink-dim)">
		Start from <span class="lowercase tracking-normal">— then change anything</span>
	</div>
	<div class="flex flex-wrap gap-2">
		{#each PRESETS as p (p.id)}
			<button
				type="button"
				class="rounded-full border px-3 py-1.5 text-[0.75rem] transition-all"
				style:font-family="var(--font-mono)"
				style:background={activeId === p.id ? 'rgba(217,164,65,0.12)' : 'transparent'}
				style:color={activeId === p.id ? 'var(--moves)' : 'var(--ink-dim)'}
				style:border-color={activeId === p.id ? 'rgba(217,164,65,0.5)' : 'var(--line)'}
				onclick={() => profile.setInputs(p.inputs)}
			>{p.label}</button>
		{/each}
	</div>
</div>
