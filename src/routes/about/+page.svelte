<script lang="ts">
	import { RULES } from '$lib/rulebook';
	import { BASELINE_WEIGHT } from '$lib/engine/score';
	const sourced = RULES.filter((r) => r.evidence === 'SOURCED').length;
	const speculative = RULES.length - sourced;
</script>

<svelte:head>
	<title>Why this exists — Life Score</title>
</svelte:head>

<div class="mt-2 max-w-[620px] space-y-5 text-[13.5px] leading-relaxed" style:color="var(--ink)">
	<section>
		<h2 class="mb-1 text-[16px] font-semibold" style:font-family="var(--font-display)">Why this exists</h2>
		<p>
			You are already a number. Several, actually: a credit score, an actuarial row, a debt-to-income ratio, a
			callback probability. Those numbers run your life and you never get to see the weights. This app rebuilds
			them in the open — {RULES.length} rules, {sourced} sourced to public evidence, {speculative} flagged as
			guesses — so the scoring can be inspected, argued with, and re-weighted by the person being scored.
			The goal is transparency, not judgment. If seeing the machinery makes some of it look indefensible,
			that's the point: things you can see, you can change.
		</p>
	</section>

	<section>
		<h2 class="mb-1 text-[16px] font-semibold" style:font-family="var(--font-display)">What's deliberately left out</h2>
		<p>
			Race, religion, and other protected characteristics. Once wealth, debt, neighborhood, and health behaviors
			are measured directly, a protected-class term adds no information — it only double-counts the real
			variables, which is exactly why lending law forbids it. We measure the targets, not the proxy. Pure luck —
			a recession at graduation, an illness, timing — is also excluded: it's real, we can't measure it honestly,
			so it stays an unscored asterisk instead of becoming a fake number.
		</p>
	</section>

	<section>
		<h2 class="mb-1 text-[16px] font-semibold" style:font-family="var(--font-display)">How the scoring works</h2>
		<p>
			Every rule is declarative: a plain-English statement, an evidence tag, a citation, and a pure function from
			your inputs to points. Rules are split between <span style:color="var(--start)">your starting point</span>
			(luck of where and to whom you were born) and <span style:color="var(--moves)">your moves</span> (the part
			you influence). Default weights are editorial — we say so out loud — and every one is editable on the
			Rulebook page. The composite total is deliberately the least interesting number on the screen.
		</p>
		<p class="mt-2">
			Every rule computes one formula: <b>points = position × weight</b>. The <i>position</i> (shown 0–10)
			is the measured fact — where the cited system places you on that dimension. The <i>weight</i> is the
			editorial multiplier — how much our composite says that dimension matters, expressed against a baseline
			of <b>1.0× = income</b>, the dimension existing systems price most legibly. Every weight states its own
			justification below, and every one is a slider on the Rulebook page.
		</p>
		<p class="mt-2">
			Two principles govern the shape of every rule. <b>Constrained-subtractive:</b> a rule may score negative
			only where the cited system itself subtracts (FICO delinquency, license points, underwater assets,
			eviction) — and never more than it can add, unless the cited system does exactly that. <b>Uncapped
			wealth:</b> the income and net-worth rules grow as the square root of your multiple of the median — a power law,
			matching how wealth itself distributes — with no upper limit, because the real world does not cap the advantage of money.
		</p>
	</section>

	<section>
		<h2 class="mb-1 text-[16px] font-semibold" style:font-family="var(--font-display)">Privacy</h2>
		<p>
			Your inputs never leave your device. Scores compute in your browser; profiles persist in your browser's
			local storage; share links carry the data in the URL fragment, which is never sent to any server. The one
			network feature — the AI narrative — sends only rounded subtotals, never your inputs, and falls back to a
			locally-composed narrative when unavailable.
		</p>
	</section>

	<section>
		<h2 class="mb-1 text-[16px] font-semibold" style:font-family="var(--font-display)">The weights, justified</h2>
		<ul class="space-y-1.5 text-[12px]" style:color="var(--ink-dim)">
			{#each RULES as rule (rule.id)}
				<li>
					<span style:color="var(--ink)">{rule.label}</span>
					<span class="tabular-nums" style:font-family="var(--font-mono)"> ×{(rule.defaultWeight / BASELINE_WEIGHT).toFixed(1)}</span>
					— {rule.weightRationale}
				</li>
			{/each}
		</ul>
	</section>

	<section>
		<h2 class="mb-1 text-[16px] font-semibold" style:font-family="var(--font-display)">Sources</h2>
		<ul class="list-inside list-disc space-y-1 text-[12px]" style:color="var(--ink-dim)">
			{#each RULES as rule (rule.id)}
				<li>
					<span style:color="var(--ink)">{rule.label}</span> —
					<a href={rule.source.url} target="_blank" rel="noreferrer" class="underline">{rule.source.name}</a>
					{#if rule.evidence === 'SPECULATIVE'}<span style:color="var(--spec)"> (speculative)</span>{/if}
				</li>
			{/each}
		</ul>
	</section>
</div>
