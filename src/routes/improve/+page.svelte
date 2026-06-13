<script lang="ts">
	import { IMPROVE, type ImproveArea } from '$lib/improve/resources';

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

<div class="mt-2 max-w-[620px] space-y-5 text-[13.5px] leading-relaxed" style:color="var(--ink)">
	<section>
		<h2 class="mb-1 text-[16px] font-semibold" style:font-family="var(--font-display)">Free ways to actually move these</h2>
		<p>
			The scores you can move are the <span style:color="var(--moves)">your moves</span> ones — the part that was
			ever up for grabs. For almost all of them, the honest first answer isn't a product or a subscription. It's
			free. Below is a plain directory: for each area, the simple truth, then the public resources worth starting
			with.
		</p>
		<p class="mt-2 text-[12px]" style:color="var(--ink-dim)">
			Every link here is a free, public resource. They open external sites with their own policies — we don't track
			you, and we get nothing if you click. No affiliate links, by design.
		</p>
	</section>

	{#each groups as group (group.name)}
		<section>
			<h2 class="mb-2 text-[16px] font-semibold" style:font-family="var(--font-display)">{group.name}</h2>
			<div class="space-y-2.5">
				{#each group.areas as area (area.id)}
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
				{/each}
			</div>
		</section>
	{/each}

	<section
		class="rounded-lg p-4"
		style:background="var(--panel)"
		style:border="1px solid rgba(217,164,65,0.35)"
	>
		<h2 class="mb-1 text-[15px] font-semibold" style:font-family="var(--font-display)" style:color="var(--moves)">Support life. scored.</h2>
		<p class="text-[12.5px] leading-snug" style:color="var(--ink)">
			It's free, open-source, and tracks nothing. If it helped you, you can chip in on GitHub Sponsors —
			entirely optional, and there's no paywall either way.
		</p>
		<a
			href="https://github.com/sponsors/royashbrook"
			target="_blank"
			rel="noreferrer"
			class="mt-2.5 inline-block rounded-full border px-3 py-1 text-[12px] transition-all"
			style:font-family="var(--font-mono)"
			style:color="var(--moves)"
			style:border-color="rgba(217,164,65,0.35)"
		>GitHub Sponsors ↗</a>
	</section>
</div>
