<script lang="ts">
	import { getContext } from 'svelte';
	import { IMPROVE, type ImproveArea } from '$lib/improve/resources';
	import { computeScore } from '$lib/engine/score';
	import { personalizedAreas } from '$lib/improve/personalize';
	import type { createProfileState } from '$lib/state/profile.svelte';

	const profile = getContext<ReturnType<typeof createProfileState>>('profile');

	const result = $derived(computeScore(profile.inputs, profile.overrides));
	const startHere = $derived(personalizedAreas(result, 3));

	// Preserve declaration order of groups while collecting their areas.
	const groups: { name: string; areas: ImproveArea[] }[] = [];
	for (const area of IMPROVE) {
		let g = groups.find((x) => x.name === area.group);
		if (!g) {
			g = { name: area.group, areas: [] };
			groups.push(g);
		}
		g.areas.push(area);
	}
</script>

<svelte:head>
	<title>improve · life. scored.</title>
</svelte:head>

{#snippet areaCard(area: ImproveArea)}
	<div class="rounded-lg p-3.5" style:background="var(--panel)" style:border="1px solid var(--line)">
		<div class="mb-1 text-[14px] font-semibold" style:font-family="var(--font-display)" style:color="var(--ink)">{area.label}</div>
		<div class="mb-2.5 text-[12.5px] leading-snug" style:color="var(--ink-dim)">{area.simple}</div>
		<ul class="space-y-1.5 pl-2.5" style:border-left="2px solid var(--sourced)">
			{#each area.free as r (r.url)}
				<li class="text-[11px] leading-snug">
					<a href={r.url} target="_blank" rel="noreferrer" class="underline" style:color="var(--sourced)">{r.name} ↗</a>
					<span style:color="var(--ink-dim)"> — {r.note}</span>
				</li>
			{/each}
		</ul>
	</div>
{/snippet}

<div class="mt-2 max-w-[620px] space-y-5 text-[13.5px] leading-relaxed" style:color="var(--ink)">
	<section>
		<h2 class="mb-1 text-[16px] font-semibold" style:font-family="var(--font-display)">Free ways to actually move these</h2>
		<p>
			The scores you can move are the <span style:color="var(--moves)">your moves</span> ones — the part that was
			ever up for grabs. For almost all of them, the honest first answer isn't a product or a subscription. It's
			free. So for each area you'll find two things: the most basic next step, in plain language, that's free to
			everyone — and then a few public links to the best free offerings we could find for it.
		</p>
		<p class="mt-2 text-[12px]" style:color="var(--ink-dim)">
			Everything linked is, as far as we can tell, a free and public resource — government sites, nonprofits, open
			courses. They're external, with their own policies; we don't track you and earn nothing if you click. No
			affiliate links, by design — just free help where we could find it.
		</p>
	</section>

	{#if startHere.length > 0}
		<section>
			<h2 class="mb-1 text-[16px] font-semibold" style:font-family="var(--font-display)">Start here — based on your score</h2>
			<p class="mb-2.5 text-[12.5px]" style:color="var(--ink-dim)">Your lowest controllable scores right now — the cheapest places to move the number.</p>
			<div class="space-y-2.5">
				{#each startHere as area (area.id)}
					{@render areaCard(area)}
				{/each}
			</div>
		</section>
	{/if}

	{#each groups as group (group.name)}
		<section>
			<h2 class="mb-2 text-[16px] font-semibold" style:font-family="var(--font-display)">{group.name}</h2>
			<div class="space-y-2.5">
				{#each group.areas as area (area.id)}
					{@render areaCard(area)}
				{/each}
			</div>
		</section>
	{/each}
</div>
