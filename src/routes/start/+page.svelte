<script lang="ts">
	import { getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import { computeScore } from '$lib/engine/score';
	import { FIELD_HELP, type Inputs } from '$lib/rulebook';
	import { activePacks } from '$lib/state/profile.svelte';
	import type { createProfileState } from '$lib/state/profile.svelte';
	import { WIZARD_STEPS } from '$lib/wizard/steps';

	const profile = getContext<ReturnType<typeof createProfileState>>('profile');

	let i = $state(0);
	const total = WIZARD_STEPS.length;
	const step = $derived(WIZARD_STEPS[i]);
	const result = $derived(computeScore(profile.inputs, profile.overrides, activePacks(profile)));

	function set(value: string | number | boolean) {
		profile.setInput(step.key, value as Inputs[typeof step.key]);
	}
</script>

<svelte:head><title>get started · life. scored.</title></svelte:head>

<div class="mx-auto mt-2 max-w-[28.75rem]">
	<div class="flex items-center justify-between text-[0.75rem] tracking-[0.14em]" style:font-family="var(--font-mono)" style:color="var(--ink-dim)">
		<span>GUIDED SETUP</span>
		<span class="tabular-nums">{i + 1} / {total}</span>
	</div>

	<!-- progress bar -->
	<div class="mt-2 h-[0.1875rem] w-full overflow-hidden rounded-full" style:background="rgba(255,255,255,0.08)">
		<div class="h-full rounded-full transition-all duration-300" style:background="var(--moves)" style:width="{((i + 1) / total) * 100}%"></div>
	</div>

	<!-- privacy reassurance: a step-through form feels like submitting; remind people it isn't -->
	<p class="mt-3 text-[0.75rem] leading-relaxed" style:font-family="var(--font-mono)" style:color="var(--ink-dim)">
		Nothing you enter is collected, sent, or stored on a server — it stays in your browser. The site is free, for
		information and perspective. <a href="/about" class="underline" style:color="var(--start)">more on the why page →</a>
	</p>

	<!-- question -->
	<h2 class="mt-7 text-[1.375rem] leading-snug" style:font-family="var(--font-display)" style:color="var(--ink)">
		{step.question}
	</h2>
	<p class="mt-1.5 text-[0.9375rem] leading-relaxed" style:color="var(--ink-dim)">
		{FIELD_HELP[step.key].help}
	</p>

	<!-- input area -->
	<div class="mt-6">
		{#if step.kind === 'options'}
			<div class="flex flex-col gap-2">
				{#each step.options ?? [] as opt (opt.value)}
					{@const active = profile.inputs[step.key] === opt.value}
					<button
						type="button"
						class="w-full rounded-lg border px-4 py-[0.8125rem] text-left text-[0.9375rem] transition-all"
						style:font-family="var(--font-body)"
						style:background={active ? 'rgba(217,164,65,0.12)' : 'transparent'}
						style:color={active ? 'var(--moves)' : 'var(--ink)'}
						style:border-color={active ? 'rgba(217,164,65,0.6)' : 'var(--line)'}
						onclick={() => set(opt.value)}
					>{opt.label}</button>
				{/each}
			</div>
		{:else}
			<div class="flex items-baseline gap-1 border-b pb-2" style:border-color="var(--line)">
				{#if step.prefix}<span class="text-[1.5rem]" style:font-family="var(--font-mono)" style:color="var(--ink-dim)">{step.prefix}</span>{/if}
				<input
					type="number"
					step={step.step ?? 1}
					value={profile.inputs[step.key]}
					oninput={(e) => set(Number(e.currentTarget.value) || 0)}
					class="w-full bg-transparent text-[1.5rem] tabular-nums outline-none"
					style:font-family="var(--font-mono)"
					style:color="var(--ink)"
				/>
			</div>
		{/if}
	</div>

	<!-- footer -->
	<div class="mt-8 flex items-center justify-between text-[0.8125rem]" style:font-family="var(--font-mono)">
		{#if i > 0}
			<button type="button" class="transition-colors" style:color="var(--ink-dim)" onclick={() => (i -= 1)}>‹ back</button>
		{:else}
			<span></span>
		{/if}

		<span class="text-[0.75rem]" style:color="var(--ink-dim)">
			score so far · <span class="tabular-nums" style:color="var(--ink)">{result.composite.toLocaleString('en-US')}</span>
		</span>

		{#if i < total - 1}
			<button type="button" style:color="var(--moves)" onclick={() => (i += 1)}>next ›</button>
		{:else}
			<button type="button" style:color="var(--moves)" onclick={() => goto('/')}>see your full score ›</button>
		{/if}
	</div>

	<!-- escape hatch -->
	<div class="mt-10 text-center">
		<button
			type="button"
			class="text-[0.75rem] underline"
			style:font-family="var(--font-mono)"
			style:color="var(--ink-dim)"
			onclick={() => goto('/')}
		>prefer the full form? fill it all at once →</button>
	</div>
</div>
