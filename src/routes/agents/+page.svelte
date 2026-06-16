<script lang="ts">
	import CopyButton from '$lib/ui/CopyButton.svelte';

	const MCP_URL = 'https://lifescored.com/mcp';
	const RULES_URL = 'https://lifescored.com/rules.json';
	const LLMS_URL = 'https://lifescored.com/llms.txt';

	const PROMPT = `Fetch https://lifescored.com/llms.txt and read it, then fetch https://lifescored.com/rules.json for the exact rules, weights, formulas, input schema, and engine constants. Compute my life score: ask me for the inputs in the schema (only the ones you can't infer), then for each rule compute points = round(clamp(position, bounds) × weight) using the formulas in the file, sum them for my composite, and show the breakdown by rule with the one-line reasoning. Do all the math yourself — do not send my answers to any server. Be ready to explain how any rule works and what's deliberately left out.`;

	const links = [
		{ url: MCP_URL, label: 'MCP endpoint', note: 'Streamable HTTP, no auth. Tools: get_rulebook, get_input_schema, get_methodology, how_to_give_feedback.' },
		{ url: RULES_URL, label: 'rules.json', note: 'The complete rulebook + math: every rule, weight, source, formula, plus the input schema and engine constants.' },
		{ url: LLMS_URL, label: 'llms.txt', note: 'The manifest — what this is and how to use it as a skill.' }
	];
</script>

<svelte:head>
	<title>use with AI · life. scored.</title>
</svelte:head>

<div class="mt-2 space-y-5 text-[15px] leading-relaxed" style:color="var(--ink)">
	<section>
		<h2 class="mb-1 text-[17px] font-semibold" style:font-family="var(--font-display)">Use this with an AI</h2>
		<p>
			life. scored. is just math over public rules — so any AI or agent can run it for you.
			Point your assistant at the resources below: it reads the rulebook, asks you for whatever it
			doesn't know, and computes your score <b>on its own side</b>. Your answers never reach us —
			the same promise as the website. We host the recipe, not the kitchen.
		</p>
	</section>

	<section>
		<h2 class="mb-2 text-[17px] font-semibold" style:font-family="var(--font-display)">Easiest: paste this prompt</h2>
		<p class="mb-2.5 text-[13px]" style:color="var(--ink-dim)">
			Drop this into any assistant that can fetch a URL (Claude, ChatGPT with browsing, Claude Code, …):
		</p>
		<div class="rounded-lg p-3.5" style:background="var(--panel)" style:border="1px solid var(--line)">
			<p class="text-[13px] leading-relaxed" style:color="var(--ink-dim)">{PROMPT}</p>
			<div class="mt-3"><CopyButton text={PROMPT} label="copy the prompt" /></div>
		</div>
	</section>

	<section>
		<h2 class="mb-2 text-[17px] font-semibold" style:font-family="var(--font-display)">Or connect it directly</h2>
		<div class="space-y-2.5">
			{#each links as l (l.url)}
				<div class="rounded-lg p-3.5" style:background="var(--panel)" style:border="1px solid var(--line)">
					<div class="flex items-center justify-between gap-3">
						<div class="min-w-0">
							<div class="text-[14px] font-semibold" style:color="var(--ink)">{l.label}</div>
							<a href={l.url} class="text-[12px] break-all underline" style:font-family="var(--font-mono)" style:color="var(--start)">{l.url}</a>
						</div>
						<CopyButton text={l.url} label="copy URL" />
					</div>
					<div class="mt-2 text-[13px] leading-snug" style:color="var(--ink-dim)">{l.note}</div>
				</div>
			{/each}
		</div>
		<p class="mt-2.5 text-[13px]" style:color="var(--ink-dim)">
			MCP-capable agents can add the endpoint as a tool server (e.g. <span style:font-family="var(--font-mono)">claude mcp add --transport http lifescored {MCP_URL}</span>),
			or test it with <span style:font-family="var(--font-mono)">npx @modelcontextprotocol/inspector</span>.
		</p>
	</section>

	<section>
		<h2 class="mb-1 text-[17px] font-semibold" style:font-family="var(--font-display)">Privacy</h2>
		<p>
			Nothing about a person should ever be sent to lifescored.com to get a score, and nothing is.
			The MCP server computes nothing and accepts no personal data — its tools only hand back the
			public rules. All scoring happens on your device, or in your agent.
		</p>
	</section>

	<section>
		<h2 class="mb-1 text-[17px] font-semibold" style:font-family="var(--font-display)">Make it better</h2>
		<p>
			The weights are editorial and the rules are arguable — that's the design. If your agent (or you)
			thinks a weight is off, a source is stale, or a rule is missing, that feedback is welcome and
			aggregated in the open:
			<a href="https://github.com/royashbrook/lifescored/issues" target="_blank" rel="noreferrer" class="underline" style:color="var(--start)">open an issue</a>
			or read the
			<a href="https://github.com/royashbrook/lifescored/blob/main/CONTRIBUTING.md" target="_blank" rel="noreferrer" class="underline" style:color="var(--start)">contributing guide</a>.
		</p>
	</section>
</div>
