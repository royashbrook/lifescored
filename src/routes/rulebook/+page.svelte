<script lang="ts">
	import { getContext } from 'svelte';
	import { DOMAINS, RULES, type Domain } from '$lib/rulebook';
	import type { createProfileState } from '$lib/state/profile.svelte';
	import RuleCard from '$lib/ui/RuleCard.svelte';

	const profile = getContext<ReturnType<typeof createProfileState>>('profile');
	const domainKeys = Object.keys(DOMAINS) as Domain[];
	const edited = $derived(Object.keys(profile.overrides).length > 0);
</script>

<svelte:head>
	<title>rulebook · life. scored.</title>
</svelte:head>

<p class="mt-1 mb-2 max-w-[560px] text-[13px] leading-snug" style:color="var(--ink-dim)">
	The whole pile of business rules, in one place. Each rule states its logic in plain English, declares whether
	it's <span style:color="var(--sourced)">sourced</span> or a flagged <span style:color="var(--spec)">guess</span>,
	and links the public evidence behind it. The weights are editorial — so edit them. Your weighting travels with
	your share link.
</p>

{#if edited}
	<button
		class="mb-3 rounded-full border px-3 py-1 text-[12px]"
		style:font-family="var(--font-mono)"
		style:color="var(--spec)"
		style:border-color="var(--line)"
		onclick={() => profile.resetOverrides()}
	>reset all weights to the cited defaults</button>
{/if}

{#each domainKeys as d (d)}
	<div class="mt-4 mb-1">
		<span class="text-[14px] font-semibold" style:font-family="var(--font-display)" style:color="var(--ink)">{DOMAINS[d].label}</span>
		<span class="ml-2 text-[12px]" style:color="var(--ink-dim)">{DOMAINS[d].blurb}</span>
	</div>
	{#each RULES.filter((r) => r.domain === d) as rule (rule.id)}
		<RuleCard
			{rule}
			override={profile.overrides[rule.id]}
			onOverride={(patch) => profile.setOverride(rule.id, patch)}
		/>
	{/each}
{/each}

<details class="mt-6 border-t pt-4" style:border-color="var(--line)">
	<summary class="cursor-pointer text-[13px]" style:font-family="var(--font-mono)" style:color="var(--ink-dim)">
		All sources — the raw citation list ({RULES.length})
	</summary>
	<ul class="mt-3 space-y-1 text-[12px] leading-snug" style:color="var(--ink-dim)">
		{#each RULES as rule (rule.id)}
			<li>
				<span style:color="var(--ink)">{rule.label}</span> —
				<a href={rule.source.url} target="_blank" rel="noreferrer" class="underline" style:color="var(--ink-dim)">{rule.source.name} ↗</a>
				{#if rule.evidence === 'SPECULATIVE'}<span style:color="var(--spec)"> (speculative)</span>{/if}
			</li>
		{/each}
	</ul>
</details>
