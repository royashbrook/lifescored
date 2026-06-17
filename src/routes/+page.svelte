<script lang="ts">
	import { getContext } from 'svelte';
	import { computeScore } from '$lib/engine/score';
	import { RULES, TIERS, type Tier } from '$lib/rulebook';
	import { activePacks } from '$lib/state/profile.svelte';
	import type { createProfileState } from '$lib/state/profile.svelte';
	import Callout from '$lib/ui/Callout.svelte';
	import InputsPanel from '$lib/ui/InputsPanel.svelte';
	import Lever from '$lib/ui/Lever.svelte';
	import PackBar from '$lib/ui/PackBar.svelte';
	import PresetBar from '$lib/ui/PresetBar.svelte';
	import NarrativeCard from '$lib/ui/NarrativeCard.svelte';
	import ScoreRow from '$lib/ui/ScoreRow.svelte';
	import SectionHead from '$lib/ui/SectionHead.svelte';
	import ShareButton from '$lib/ui/ShareButton.svelte';
	import TopMovers from '$lib/ui/TopMovers.svelte';

	const profile = getContext<ReturnType<typeof createProfileState>>('profile');

	let activeLevers = $state<string[]>([]);

	const packs = $derived(activePacks(profile));
	const baseResult = $derived(computeScore(profile.inputs, profile.overrides, packs));

	// Effective inputs after applying active what-if levers (transforms live on RULES).
	const effective = $derived(
		RULES.filter((r) => r.whatIf && activeLevers.includes(r.id)).reduce(
			(inputs, r) => r.whatIf!.transform(inputs),
			profile.inputs
		)
	);
	const result = $derived(computeScore(effective, profile.overrides, packs));
	const moveDelta = $derived(result.composite - baseResult.composite);

	const tierKeys = Object.keys(TIERS) as Tier[];

	function toggleLever(id: string) {
		activeLevers = activeLevers.includes(id) ? activeLevers.filter((l) => l !== id) : [...activeLevers, id];
	}
</script>

<svelte:head>
	<title>life. scored. {result.composite.toLocaleString('en-US')}</title>
</svelte:head>

<div class="mt-2 mb-6 flex items-start justify-between gap-5">
	<p class="max-w-[33.75rem] text-[0.875rem] leading-relaxed" style:color="var(--ink-dim)">
		Not a verdict on your worth — a look at how existing systems would position you, every weight shown.
		The composite below is the least useful number here; the breakdown is the point.
	</p>
	<div class="text-right">
		<div class="text-[0.75rem] tracking-[0.14em]" style:font-family="var(--font-mono)" style:color="var(--ink-dim)">COMPOSITE</div>
		<div data-testid="composite" class="text-[1.625rem] font-bold tabular-nums" style:font-family="var(--font-mono)">{result.composite.toLocaleString('en-US')}</div>
	</div>
</div>

<a
	href="/start"
	class="mb-3 inline-block text-[0.75rem] underline"
	style:font-family="var(--font-mono)"
	style:color="var(--ink-dim)"
>new here? walk through it one question at a time →</a>

<PresetBar {profile} />

<PackBar {profile} />

<div class="mt-6 mb-5 border-t" style:border-color="var(--line)"></div>

<InputsPanel {profile} />

<TopMovers {result} />

{#each tierKeys as tierKey (tierKey)}
	<div class="mt-3">
		<SectionHead
			label={TIERS[tierKey].label}
			sub={TIERS[tierKey].sub}
			accent={TIERS[tierKey].accent}
			subtotal={result.tierSubtotals[tierKey]}
		/>
		{#each result.perRule.filter((p) => p.tier === tierKey) as row (row.id)}
			<ScoreRow {row} accent={TIERS[tierKey].accent} />
		{/each}
		{#if tierKey === 'starting_point'}
			<div class="py-3 text-[0.75rem] italic" style:color="var(--ink-dim)">
				Timing &amp; luck (a recession at graduation, a boom, an illness) live here too — and we can't
				measure them, so they stay an unscored asterisk rather than a fake number.
			</div>
		{/if}
	</div>
{/each}

<Callout title="THE COMPARISON THAT ACTUALLY HELPS">
	Your starting point contributed {result.tierSubtotals.starting_point} of these points before you made a
	single move. The {result.tierSubtotals.your_moves} from your moves is the part that was ever up for grabs —
	measure yourself against that line, not against people running a different starting tier.
</Callout>

{#if baseResult.whatIfs.length > 0}
	<div class="mt-5">
		<div class="mb-2 text-[0.75rem] tracking-[0.12em]" style:font-family="var(--font-mono)" style:color="var(--ink-dim)">
			WHAT-IF · CONTROLLABLE LEVERS ONLY
		</div>
		<div class="flex flex-wrap gap-2">
			{#each baseResult.whatIfs as lever (lever.ruleId)}
				<Lever
					active={activeLevers.includes(lever.ruleId)}
					label={lever.label}
					delta={lever.delta}
					onclick={() => toggleLever(lever.ruleId)}
				/>
			{/each}
		</div>
		{#if moveDelta !== 0}
			<div class="mt-2 text-[0.8125rem]" style:color="var(--moves)">
				These moves shift the part you control by
				<b style:font-family="var(--font-mono)">{moveDelta > 0 ? '+' : ''}{moveDelta}</b> — a delta, not a destiny.
			</div>
		{/if}
		<a
			href="/improve"
			class="mt-2 inline-block text-[0.75rem] underline"
			style:font-family="var(--font-mono)"
			style:color="var(--ink-dim)"
		>→ free ways to actually move these (no affiliate links)</a>
	</div>
{/if}

<NarrativeCard {result} />

<div class="mt-6 flex flex-col gap-5 border-t pt-4 sm:flex-row sm:items-start sm:justify-between" style:border-color="var(--line)">
	<div class="text-[0.75rem] leading-relaxed sm:max-w-[42%]" style:color="var(--ink-dim)">
		<b style:color="var(--ink)">Deliberately left out:</b> the traits that change how <i>other people</i> score you —
		race, identity, otherness. Real, but not something we put a number on.
		<a href="/about#left-out" class="underline" style:color="var(--start)">here's why →</a>
	</div>
	<div class="sm:w-1/2 sm:shrink-0">
		<ShareButton
			profile={profile.snapshot()}
			composite={result.composite}
			{result}
		/>
	</div>
</div>
