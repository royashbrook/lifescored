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
	<title>life. scored — {result.composite.toLocaleString('en-US')}</title>
</svelte:head>

<div class="mt-1 mb-4 flex items-start justify-between gap-4">
	<p class="max-w-[540px] text-[12.5px] leading-snug" style:color="var(--ink-dim)">
		Not a verdict on your worth — a look at how existing systems would position you, every weight shown.
		The composite below is the least useful number here; the breakdown is the point.
	</p>
	<div class="text-right">
		<div class="text-[10px] tracking-[0.14em]" style:font-family="var(--font-mono)" style:color="var(--ink-dim)">COMPOSITE</div>
		<div data-testid="composite" class="text-[26px] font-bold tabular-nums" style:font-family="var(--font-mono)">{result.composite.toLocaleString('en-US')}</div>
	</div>
</div>

<PresetBar {profile} />

<PackBar {profile} />

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
			<div class="py-3 text-[11px] italic" style:color="var(--ink-dim)">
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
		<div class="mb-2 text-[11px] tracking-[0.12em]" style:font-family="var(--font-mono)" style:color="var(--ink-dim)">
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
			<div class="mt-2 text-[12.5px]" style:color="var(--moves)">
				These moves shift the part you control by
				<b style:font-family="var(--font-mono)">{moveDelta > 0 ? '+' : ''}{moveDelta}</b> — a delta, not a destiny.
			</div>
		{/if}
	</div>
{/if}

<NarrativeCard {result} />

<div class="mt-6 flex items-center justify-between border-t pt-4" style:border-color="var(--line)">
	<div class="max-w-[440px] text-[11px] leading-relaxed" style:color="var(--ink-dim)">
		<b style:color="var(--ink)">Deliberately left out:</b> race and other protected characteristics. Once wealth,
		debt and neighborhood are measured directly, a race term adds no information — it just double-counts the real
		variables, which is exactly why lending law forbids it. We measure the targets, not the proxy.
	</div>
	<ShareButton
		profile={profile.snapshot()}
		composite={result.composite}
	/>
</div>
