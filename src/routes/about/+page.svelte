<script lang="ts">
	import { RULES } from '$lib/rulebook';
	const sourced = RULES.filter((r) => r.evidence === 'SOURCED').length;
	const speculative = RULES.length - sourced;
</script>

<svelte:head>
	<title>why · life. scored.</title>
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

	<section id="left-out" style:scroll-margin-top="1rem">
		<h2 class="mb-1 text-[16px] font-semibold" style:font-family="var(--font-display)">What's deliberately left out</h2>
		<p>
			Some things about you — a few legally protected, others not — change how other people score you, and we
			put no number on any of them. Not because they don't matter; often they matter enormously. But this kind
			of scoring is subjective and invisible: if someone reads you as <i>other</i>, they'll quietly mark you
			down and never tell you how much or why — and if they see themselves in you, you get a just-as-silent
			bump. The weight is real, it swings wildly from one place and one person to the next, and we won't hand
			you a single fake number for it — much less dock you for who you are, which is the exact machinery this
			site exists to expose, not to run. So it stays an unscored asterisk that every single person carries.
		</p>
		<p class="mt-2">
			Pure luck sits under the same asterisk — a recession the year you graduated, an illness, plain timing.
			Real, unevenly handed out, and impossible to measure honestly, so it stays named rather than turned into
			a number. What we <i>do</i> score is the systemic weight you can at least see, and the part you can
			actually move.
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
			justification — and is a slider you can change — on the
			<a href="/rulebook" class="underline" style:color="var(--start)">rulebook</a>.
		</p>
		<p class="mt-2">
			Two principles govern the shape of every rule. <b>Constrained-subtractive:</b> a rule may score negative
			only where the cited system itself subtracts (FICO delinquency, license points, underwater assets,
			eviction) — and never more than it can add, unless the cited system does exactly that. <b>Uncapped
			wealth:</b> the income and net-worth rules grow as the square root of your multiple of the median — a power law,
			matching how wealth itself distributes — with no upper limit, because the real world does not cap the advantage of money.
		</p>
	</section>

	<section id="how-it-works" style:scroll-margin-top="1rem">
		<h2 class="mb-1 text-[16px] font-semibold" style:font-family="var(--font-display)">How this works — and what "no tracking" means</h2>
		<p>
			Everything runs in your browser. You type your answers in, the rules compute your score right there on
			your device, and the numbers are saved only to your browser's own local storage so they're still there
			next time. Nothing you enter is ever sent to a server — there is no account, no database of users, and no
			copy of your answers anywhere but your own machine.
		</p>
		<p class="mt-2">
			<b>"No tracking"</b> means exactly that: no cookies that follow you, no advertising or analytics scripts
			that build a profile of you, nothing sold or shared. We do keep a rough count of how many people visit,
			using Cloudflare Web Analytics — it's cookieless and aggregate, can't identify you, and never sees your
			answers (those don't leave your device anyway).
		</p>
		<p class="mt-2">
			Two things do leave your browser, and only because you ask for them. The optional AI narrative sends just
			your <i>rounded subtotals</i> — never the raw answers — and falls back to a locally-written one if it's
			unavailable. And if you use “share my exact answers,” those answers travel encoded inside the link you
			hand out — see the warning there before you send it.
		</p>
	</section>

	<section>
		<h2 class="mb-1 text-[16px] font-semibold" style:font-family="var(--font-display)">Keeping it free</h2>
		<p>
			There are no ads, no affiliate links, no data sales, and no paywall — and there's no plan to add the first
			three. The whole point falls apart the moment the thing scoring you has something to sell you. Hosting is
			nearly free, the code is open source, and if a paid course or service is genuinely what would move one of
			your scores, the <a href="/improve" class="underline" style:color="var(--start)">improve page</a> points you
			at the free options first. If it's useful to you and you'd like to help it stay free and independent, you can
			<a href="https://github.com/sponsors/royashbrook" target="_blank" rel="noreferrer" class="underline" style:color="var(--moves)">sponsor it on GitHub</a> — entirely optional, and nothing about the app changes either way.
		</p>
	</section>

	<section>
		<h2 class="mb-1 text-[16px] font-semibold" style:font-family="var(--font-display)">The receipts</h2>
		<p>
			Every rule shows its work — plain-English logic, an evidence tag, the public source behind it, and a weight
			you can move. Rather than reprint all {RULES.length} of them here, they live where you can actually use them:
			the <a href="/rulebook" class="underline" style:color="var(--start)">rulebook</a>, with every citation tunable
			and a full source list at the bottom.
		</p>
	</section>
</div>
