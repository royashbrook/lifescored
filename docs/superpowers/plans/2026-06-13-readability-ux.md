# Readability & UX Batch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Score page legible to first-time testers — per-field definition popovers, a "what's moving your score" strip, onboarding presets, and proper mobile sharing (native share sheet + a client-rendered score image) — without altering the dark Fraunces aesthetic.

**Architecture:** Pure helpers (`help.ts`, `presets.ts`, `highlights.ts`) hold content/logic and are unit-tested; thin Svelte 5 components render them. Field help reuses the existing `Field` slot. Sharing precomputes URL + image reactively so the click handler dispatches synchronously (preserves the user-gesture the clipboard/Web Share APIs require).

**Tech Stack:** unchanged (Svelte 5 runes, SvelteKit, TypeScript, Vitest). No new deps.

**Out of scope:** the 100-element expansion (GitHub issue #1). This batch adds zero rules.

**Aesthetic invariants:** dark `--bg`/`--panel`, `--ink`/`--ink-dim`, accents `--start` (blue) / `--moves` (gold) / `--sourced` (green) / `--spec`; fonts `--font-display` (Fraunces), `--font-body` (Newsreader), `--font-mono` (JetBrains Mono). Sentence-case, no new colors.

---

## File structure (changes only)

```
src/lib/rulebook/help.ts        # NEW: FIELD_HELP — per-input one-line definition + ruleId
src/lib/rulebook/presets.ts     # NEW: PRESETS — 5 named full-Inputs scenarios
src/lib/engine/highlights.ts    # NEW: topMovers(result) — biggest lifts / weakest rows
src/lib/state/profile.svelte.ts # add setInputs(inputs) (preset apply keeps overrides)
src/lib/ui/FieldHelp.svelte      # NEW: ? button + popover, looks rule up by id
src/lib/ui/Field.svelte          # accept optional help entry → renders FieldHelp
src/lib/ui/InputsPanel.svelte    # pass FIELD_HELP[key] to every Field
src/lib/ui/TopMovers.svelte      # NEW: the "what's moving your score" strip
src/lib/ui/PresetBar.svelte      # NEW: preset chips
src/lib/share/score-image.ts     # NEW: renderScoreImage() → PNG Blob (browser only)
src/lib/ui/ShareButton.svelte    # Web Share API + precomputed image, clipboard fallback
src/routes/+page.svelte          # mount PresetBar + TopMovers; pass score numbers to ShareButton
```

Conventions: commit after each task; `npm test` + `npm run check` green after every task; browser-verify UI tasks with the preview tool on a free port.

---

### Task 1: Field-help content map

**Files:**
- Create: `src/lib/rulebook/help.ts`
- Test: `src/lib/rulebook/help.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/rulebook/help.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { FIELD_HELP } from './help';
import { DEFAULT_INPUTS } from './inputs';
import { RULES } from './index';

describe('FIELD_HELP', () => {
	it('covers every input field exactly', () => {
		const inputKeys = Object.keys(DEFAULT_INPUTS).sort();
		expect(Object.keys(FIELD_HELP).sort()).toEqual(inputKeys);
	});

	it('every entry has a non-trivial help sentence and a real rule id', () => {
		const ruleIds = new Set(RULES.map((r) => r.id));
		for (const [key, entry] of Object.entries(FIELD_HELP)) {
			expect(entry.help.length, `${key} help`).toBeGreaterThan(20);
			expect(ruleIds.has(entry.ruleId), `${key} → ${entry.ruleId} is a real rule`).toBe(true);
		}
	});
});
```

- [ ] **Step 2: Run** `npm test -- src/lib/rulebook/help.test.ts` — Expected: FAIL (cannot resolve `./help`).

- [ ] **Step 3: Implement `src/lib/rulebook/help.ts`**

```ts
import type { InputKey } from './types';

export interface FieldHelp {
	help: string;
	ruleId: string;
}

/** One plain-language sentence per input, plus the rule it feeds (for the source link). */
export const FIELD_HELP: Record<InputKey, FieldHelp> = {
	country: { ruleId: 'country', help: 'Where you live now — sets a baseline from its World Bank income tier.' },
	familySupport: { ruleId: 'generational', help: "Money you could fall back on in a crisis — a parent who'd cover a month's rent, a loan you wouldn't have to beg for. Not your income; the cushion behind it." },
	parentsDegree: { ruleId: 'parental-education', help: 'Whether a parent holds a college degree — first-generation students face measurably steeper odds.' },
	neighborhood: { ruleId: 'neighborhood', help: 'The opportunity level of the area you grew up in — the census-tract effect on adult income.' },
	age: { ruleId: 'life-table', help: 'Your age — an insurer reads it straight off the life table; younger means more runway.' },
	sex: { ruleId: 'life-table', help: 'Used only for the actuarial life-table baseline; women outlive men by about five years on average.' },
	smoker: { ruleId: 'smoking', help: 'Your smoking status — the single largest behavioral factor insurers price.' },
	exerciseMins: { ruleId: 'exercise', help: 'Minutes of moderate exercise per week; the guideline is 150.' },
	alcohol: { ruleId: 'alcohol', help: 'Your typical alcohol use.' },
	sleepHours: { ruleId: 'sleep', help: 'Hours of sleep per night; 7 to 9 is the guideline band.' },
	insured: { ruleId: 'insurance', help: 'Whether you have health insurance — being uninsured is a leading path to catastrophic debt.' },
	bmiBand: { ruleId: 'bmi', help: "Your BMI band — included because underwriters price it, not because it's a good measure of a person." },
	income: { ruleId: 'income', help: 'Your annual income before tax.' },
	netWorth: { ruleId: 'networth', help: 'Everything you own minus everything you owe.' },
	debt: { ruleId: 'dti', help: 'Total debt you owe — scored as a ratio to your income, not a raw dollar amount.' },
	latePayments: { ruleId: 'payment-history', help: 'Late payments in the last 24 months — the heaviest single input in a credit score.' },
	creditUtil: { ruleId: 'utilization', help: "Share of your available credit you're using; under about 10% is ideal." },
	emergencyMonths: { ruleId: 'emergency-fund', help: 'Months of expenses your savings could cover; the 3-month line is the resilience test.' },
	homeowner: { ruleId: 'homeownership', help: 'Whether you own your home — the main US wealth-building escalator.' },
	education: { ruleId: 'education', help: "Highest level of school you've completed." },
	employment: { ruleId: 'employment', help: 'Your current employment status.' },
	outlook: { ruleId: 'outlook', help: 'Whether your field is projected to grow or shrink over the next decade.' },
	socialConnection: { ruleId: 'connection', help: "How often you see people you're close to — isolation rivals smoking in the mortality data." },
	partnered: { ruleId: 'partnership', help: 'Whether you have a partner or spouse.' },
	volunteers: { ruleId: 'volunteering', help: 'Whether you volunteer in your community regularly.' },
	drivingIncidents: { ruleId: 'driving', help: 'At-fault accidents and moving violations in the last 3 years — priced by every auto insurer.' },
	digitalFootprint: { ruleId: 'digital', help: 'How your public online presence reads to an employer or landlord screening you.' },
	housing: { ruleId: 'housing-stability', help: 'How stable your housing is — stable, insecure, or unhoused.' },
	banking: { ruleId: 'banked', help: 'Whether you have a bank account; without one, basic transactions carry check-cashing fees.' },
	criminalRecord: { ruleId: 'criminal-record', help: 'Whether you have a criminal record — it roughly halves employer callbacks in audit studies.' },
	voterRegistered: { ruleId: 'voting', help: 'Whether you are registered to vote — it appears in civic data used by campaigns and some screens.' }
};
```

- [ ] **Step 4: Run** `npm test -- src/lib/rulebook/help.test.ts` — Expected: PASS (2 tests). Then `npm run check` → 0 errors.
- [ ] **Step 5: Commit** `git add src/lib/rulebook/help.* && git commit -m "feat: per-field help content map"`

---

### Task 2: FieldHelp component + Field integration

**Files:**
- Create: `src/lib/ui/FieldHelp.svelte`
- Modify: `src/lib/ui/Field.svelte`

- [ ] **Step 1: Implement `src/lib/ui/FieldHelp.svelte`**

A `?` button that toggles a popover. It looks the rule up by id for the evidence tag + source, and links to the rulebook for the full rationale. Closes on outside-click and Escape.

```svelte
<script lang="ts">
	import { RULES, type FieldHelp } from '$lib/rulebook';
	import Tag from './Tag.svelte';

	let { entry }: { entry: FieldHelp } = $props();
	let open = $state(false);
	const rule = $derived(RULES.find((r) => r.id === entry.ruleId));

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape') open = false;
	}
</script>

<svelte:window onkeydown={onKey} />

<span class="relative inline-flex">
	<button
		type="button"
		class="inline-flex h-[15px] w-[15px] items-center justify-center rounded-full border text-[9px]"
		style:font-family="var(--font-mono)"
		style:color={open ? 'var(--start)' : 'var(--ink-dim)'}
		style:border-color={open ? 'var(--start)' : 'rgba(255,255,255,0.25)'}
		aria-label="What does this mean?"
		aria-expanded={open}
		onclick={(e) => {
			e.preventDefault();
			open = !open;
		}}
	>?</button>

	{#if open}
		<!-- click-catcher closes the popover; sits behind it -->
		<button
			type="button"
			class="fixed inset-0 z-40 cursor-default"
			aria-label="Close"
			tabindex="-1"
			onclick={() => (open = false)}
		></button>
		<div
			class="absolute top-[20px] left-0 z-50 w-[250px] rounded-lg p-3 text-left"
			style:background="#20242c"
			style:border="1px solid rgba(124,147,184,0.4)"
		>
			<div class="mb-1 flex items-center justify-between gap-2">
				<span class="text-[13px] font-semibold" style:font-family="var(--font-display)" style:color="var(--ink)">{rule?.label}</span>
				{#if rule}<Tag kind={rule.evidence} />{/if}
			</div>
			<div class="text-[12px] leading-snug" style:color="var(--ink)">{entry.help}</div>
			{#if rule}
				<div class="mt-2 pl-2 text-[10.5px] leading-snug" style:border-left="2px solid var(--start)" style:color="var(--ink-dim)">
					{rule.source.name}. <a href="/rulebook" class="underline" style:color="var(--start)">read the rule ↗</a>
				</div>
			{/if}
		</div>
	{/if}
</span>
```

- [ ] **Step 2: Modify `src/lib/ui/Field.svelte`** to optionally render the help

```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { FieldHelp } from '$lib/rulebook';
	import FieldHelpPopover from './FieldHelp.svelte';
	let { label, help, children }: { label: string; help?: FieldHelp; children: Snippet } = $props();
</script>

<label class="flex flex-col gap-1">
	<span class="flex items-center gap-1.5 text-[10px] tracking-[0.1em] uppercase" style:font-family="var(--font-mono)" style:color="var(--ink-dim)">
		{label}
		{#if help}<FieldHelpPopover entry={help} />{/if}
	</span>
	{@render children()}
</label>
```

Note: `FieldHelp` is exported as a type from `$lib/rulebook` (it lives in `help.ts`, re-exported via the rulebook index — verify `index.ts` has `export * from './help'`; if not, add it).

- [ ] **Step 3: Ensure the type is exported.** In `src/lib/rulebook/index.ts`, confirm or add: `export * from './help';` (alongside the existing `export * from './inputs'` / `./types`).

- [ ] **Step 4: Verify** `npm run check` → 0 errors; `npm run build` → clean. (Help isn't wired into any Field yet — that's Task 3 — so nothing renders differently; this task just compiles the plumbing. `?` clicking is verified in Task 3.)

- [ ] **Step 5: Commit** `git add src/lib/ui/FieldHelp.svelte src/lib/ui/Field.svelte src/lib/rulebook/index.ts && git commit -m "feat: FieldHelp popover and optional Field help slot"`

---

### Task 3: Wire help into every input

**Files:**
- Modify: `src/lib/ui/InputsPanel.svelte`

- [ ] **Step 1: Import the map and pass it to each Field.** Add to the script imports:
```ts
	import { COUNTRIES, FIELD_HELP } from '$lib/rulebook';
```
(replacing the existing `import { COUNTRIES } from '$lib/rulebook';`).

- [ ] **Step 2: Add `help={FIELD_HELP.<key>}` to every `<Field>`.** Each Field gets the entry matching its input. The full updated markup (both grids):

```svelte
	<div class="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
		<Field label="Country" help={FIELD_HELP.country}><SelectInput bind:value={f.country.value} opts={countryOpts} /></Field>
		<Field label="Age" help={FIELD_HELP.age}><NumInput bind:value={f.age.value} step={1} prefix="" /></Field>
		<Field label="Family support" help={FIELD_HELP.familySupport}><SelectInput bind:value={f.familySupport.value} opts={[[0, 'None'], [1, 'Some'], [2, 'Substantial']]} /></Field>
		<Field label="Income / yr" help={FIELD_HELP.income}><NumInput bind:value={f.income.value} /></Field>
		<Field label="Net worth" help={FIELD_HELP.netWorth}><NumInput bind:value={f.netWorth.value} /></Field>
		<Field label="Total debt" help={FIELD_HELP.debt}><NumInput bind:value={f.debt.value} /></Field>
		<Field label="Education" help={FIELD_HELP.education}><SelectInput bind:value={f.education.value} opts={[['none', 'No diploma'], ['hs', 'High school'], ['some', 'Some college'], ['bachelor', "Bachelor's"], ['graduate', 'Graduate']]} /></Field>
		<Field label="Smoker" help={FIELD_HELP.smoker}><SelectInput bind:value={f.smoker.value} opts={[['never', 'Never'], ['former', 'Former'], ['current', 'Current']]} /></Field>
	</div>
```
and in the expanded grid, add the matching `help={FIELD_HELP.<key>}` to each Field: `sex, parentsDegree, neighborhood, exerciseMins, alcohol, sleepHours, insured, bmiBand, latePayments, creditUtil, emergencyMonths, homeowner, employment, outlook, socialConnection, partnered, volunteers, drivingIncidents, digitalFootprint, housing, banking, criminalRecord, voterRegistered` — one per existing Field, leaving the existing `<SelectInput>`/`<NumInput>`/`<Toggle>` children unchanged.

- [ ] **Step 3: Verify** `npm run check` → 0 errors; `npm run build` → clean. Then browser-smoke: `npm run dev` on a free port, load `/`, click the `?` next to "Family support", confirm a popover shows the definition + "SPECULATIVE" tag + "read the rule ↗", and clicking elsewhere closes it. Kill the server.

- [ ] **Step 4: Commit** `git add src/lib/ui/InputsPanel.svelte && git commit -m "feat: definition popovers on every input field"`

---

### Task 4: topMovers helper

**Files:**
- Create: `src/lib/engine/highlights.ts`
- Test: `src/lib/engine/highlights.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/engine/highlights.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS } from '../rulebook';
import { computeScore } from './score';
import { topMovers } from './highlights';

describe('topMovers', () => {
	it('returns the biggest positive contributors and the weakest rows, enabled only', () => {
		const result = computeScore({ ...DEFAULT_INPUTS, netWorth: -40000, debt: 50000 });
		const { lifting, weakest } = topMovers(result, 3);
		expect(lifting.length).toBeLessThanOrEqual(3);
		expect(weakest.length).toBeLessThanOrEqual(3);
		// lifting sorted descending by value, all positive
		expect(lifting.every((r) => r.value > 0)).toBe(true);
		expect([...lifting].sort((a, b) => b.value - a.value)).toEqual(lifting);
		// weakest sorted ascending by value (most negative / lowest first)
		expect([...weakest].sort((a, b) => a.value - b.value)).toEqual(weakest);
		// a deeply negative rule (networth) must be in weakest, not lifting
		expect(weakest.some((r) => r.id === 'networth')).toBe(true);
		expect(lifting.some((r) => r.id === 'networth')).toBe(false);
	});

	it('excludes disabled rules from both lists', () => {
		const result = computeScore(DEFAULT_INPUTS, { country: { enabled: false } });
		const { lifting, weakest } = topMovers(result, 3);
		expect([...lifting, ...weakest].some((r) => r.id === 'country')).toBe(false);
	});

	it('lifting and weakest never share a rule', () => {
		const result = computeScore(DEFAULT_INPUTS);
		const { lifting, weakest } = topMovers(result, 3);
		const ids = new Set(lifting.map((r) => r.id));
		expect(weakest.every((r) => !ids.has(r.id))).toBe(true);
	});
});
```

- [ ] **Step 2: Run** `npm test -- src/lib/engine/highlights.test.ts` — Expected: FAIL (cannot resolve `./highlights`).

- [ ] **Step 3: Implement `src/lib/engine/highlights.ts`**

```ts
import type { RuleScore, ScoreResult } from './score';

export interface Highlights {
	lifting: RuleScore[];
	weakest: RuleScore[];
}

/**
 * The biggest positive contributors (lifting) and the lowest-scoring rows (weakest),
 * over enabled rules only. lifting and weakest are disjoint: weakest is drawn from the
 * rows not already shown as lifting.
 */
export function topMovers(result: ScoreResult, n = 3): Highlights {
	const enabled = result.perRule.filter((p) => p.enabled);
	const byValueDesc = [...enabled].sort((a, b) => b.value - a.value);
	const lifting = byValueDesc.filter((p) => p.value > 0).slice(0, n);
	const liftingIds = new Set(lifting.map((p) => p.id));
	const weakest = [...enabled]
		.filter((p) => !liftingIds.has(p.id))
		.sort((a, b) => a.value - b.value)
		.slice(0, n);
	return { lifting, weakest };
}
```

- [ ] **Step 4: Run** `npm test -- src/lib/engine/highlights.test.ts` — Expected: PASS (3 tests). `npm run check` → 0 errors.
- [ ] **Step 5: Commit** `git add src/lib/engine/highlights.* && git commit -m "feat: topMovers — biggest lifts and weakest rows"`

---

### Task 5: TopMovers strip on the score page

**Files:**
- Create: `src/lib/ui/TopMovers.svelte`
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Implement `src/lib/ui/TopMovers.svelte`**

```svelte
<script lang="ts">
	import type { ScoreResult } from '$lib/engine/score';
	import { topMovers } from '$lib/engine/highlights';

	let { result }: { result: ScoreResult } = $props();
	const movers = $derived(topMovers(result, 3));
	const sign = (v: number) => (v >= 0 ? '+' : '') + v.toLocaleString('en-US');
</script>

{#if movers.lifting.length > 0 || movers.weakest.length > 0}
	<div class="mb-5 rounded-lg p-3.5" style:background="var(--panel)" style:border="1px solid var(--line)">
		<div class="mb-2.5 text-[11px] tracking-[0.12em]" style:font-family="var(--font-mono)" style:color="var(--ink-dim)">
			WHAT'S MOVING YOUR SCORE MOST
		</div>
		<div class="flex flex-col gap-2">
			{#if movers.lifting.length > 0}
				<div class="flex flex-wrap items-center gap-2">
					<span class="w-[68px] shrink-0 text-[11px]" style:font-family="var(--font-mono)" style:color="var(--sourced)">LIFTING IT</span>
					{#each movers.lifting as r (r.id)}
						<span class="rounded-full px-2.5 py-1 text-[11px]" style:font-family="var(--font-mono)" style:color="var(--moves)" style:background="rgba(217,164,65,0.12)">
							{r.label} <b>{sign(r.value)}</b>
						</span>
					{/each}
				</div>
			{/if}
			{#if movers.weakest.length > 0}
				<div class="flex flex-wrap items-center gap-2">
					<span class="w-[68px] shrink-0 text-[11px]" style:font-family="var(--font-mono)" style:color="#c0604d">WEAKEST</span>
					{#each movers.weakest as r (r.id)}
						<span class="rounded-full px-2.5 py-1 text-[11px]" style:font-family="var(--font-mono)"
							style:color={r.value < 0 ? '#c0604d' : 'var(--ink-dim)'}
							style:background={r.value < 0 ? 'rgba(192,96,77,0.12)' : 'rgba(255,255,255,0.05)'}>
							{r.label} <b>{sign(r.value)}</b>
						</span>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}
```

- [ ] **Step 2: Mount it in `src/routes/+page.svelte`.** Add the import:
```ts
	import TopMovers from '$lib/ui/TopMovers.svelte';
```
and place it immediately AFTER `<InputsPanel {profile} />` and before the `{#each tierKeys ...}` block:
```svelte
<InputsPanel {profile} />

<TopMovers {result} />
```

- [ ] **Step 3: Verify** `npm run check` → 0 errors; `npm run build` → clean. Browser-smoke: `npm run dev`, load `/`, confirm a "WHAT'S MOVING YOUR SCORE MOST" panel shows gold "LIFTING IT" pills and the "WEAKEST" row; edit net worth to a large negative and confirm Net-worth position appears red in WEAKEST. Kill server.

- [ ] **Step 4: Commit** `git add src/lib/ui/TopMovers.svelte src/routes/+page.svelte && git commit -m "feat: what's-moving-your-score strip"`

---

### Task 6: Presets data + store method

**Files:**
- Create: `src/lib/rulebook/presets.ts`
- Modify: `src/lib/state/profile.svelte.ts`
- Test: `src/lib/rulebook/presets.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/rulebook/presets.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { clampInputs, DEFAULT_INPUTS } from './inputs';
import { PRESETS } from './presets';

describe('PRESETS', () => {
	it('has the five named scenarios with unique ids and labels', () => {
		expect(PRESETS.map((p) => p.id)).toEqual(['typical-us', 'global-median', 'born-ahead', 'started-behind', 'blank']);
		expect(new Set(PRESETS.map((p) => p.label)).size).toBe(5);
	});

	it('every preset is a complete, valid Inputs object (survives clamping unchanged)', () => {
		const keys = Object.keys(DEFAULT_INPUTS).sort();
		for (const p of PRESETS) {
			expect(Object.keys(p.inputs).sort()).toEqual(keys);
			expect(clampInputs(p.inputs)).toEqual(p.inputs);
		}
	});

	it('presets are meaningfully different from each other', () => {
		const serialized = PRESETS.map((p) => JSON.stringify(p.inputs));
		expect(new Set(serialized).size).toBe(PRESETS.length);
	});
});
```

- [ ] **Step 2: Run** `npm test -- src/lib/rulebook/presets.test.ts` — Expected: FAIL (cannot resolve `./presets`).

- [ ] **Step 3: Implement `src/lib/rulebook/presets.ts`**

```ts
import { DEFAULT_INPUTS } from './inputs';
import type { Inputs } from './types';

export interface Preset {
	id: string;
	label: string;
	inputs: Inputs;
}

/** Illustrative starting points. Numbers are rough, not census-exact — a place to begin, then tune. */
export const PRESETS: Preset[] = [
	{
		id: 'typical-us',
		label: 'Typical American',
		inputs: {
			...DEFAULT_INPUTS,
			country: 'us', age: 38, familySupport: 1, parentsDegree: false, neighborhood: 1, sex: 'm',
			smoker: 'never', exerciseMins: 60, alcohol: 'moderate', sleepHours: 7, insured: true, bmiBand: 'over',
			income: 60000, netWorth: 80000, debt: 30000, latePayments: 0, creditUtil: 30, emergencyMonths: 1, homeowner: true,
			education: 'hs', employment: 'employed', outlook: 'stable',
			socialConnection: 1, partnered: true, volunteers: false, drivingIncidents: 0, digitalFootprint: 1,
			housing: 'stable', banking: 'banked', criminalRecord: false, voterRegistered: true
		}
	},
	{
		id: 'global-median',
		label: 'Global median',
		inputs: {
			...DEFAULT_INPUTS,
			country: 'in', age: 30, familySupport: 0, parentsDegree: false, neighborhood: 1, sex: 'm',
			smoker: 'never', exerciseMins: 60, alcohol: 'none', sleepHours: 7, insured: false, bmiBand: 'normal',
			income: 5000, netWorth: 5000, debt: 0, latePayments: 0, creditUtil: 0, emergencyMonths: 0, homeowner: false,
			education: 'hs', employment: 'employed', outlook: 'stable',
			socialConnection: 2, partnered: true, volunteers: false, drivingIncidents: 0, digitalFootprint: 1,
			housing: 'stable', banking: 'underbanked', criminalRecord: false, voterRegistered: true
		}
	},
	{
		id: 'born-ahead',
		label: 'Born ahead',
		inputs: {
			...DEFAULT_INPUTS,
			country: 'nl', age: 30, familySupport: 2, parentsDegree: true, neighborhood: 2, sex: 'f',
			smoker: 'never', exerciseMins: 180, alcohol: 'none', sleepHours: 8, insured: true, bmiBand: 'normal',
			income: 120000, netWorth: 400000, debt: 0, latePayments: 0, creditUtil: 5, emergencyMonths: 12, homeowner: true,
			education: 'graduate', employment: 'self', outlook: 'growing',
			socialConnection: 2, partnered: true, volunteers: true, drivingIncidents: 0, digitalFootprint: 2,
			housing: 'stable', banking: 'banked', criminalRecord: false, voterRegistered: true
		}
	},
	{
		id: 'started-behind',
		label: 'Started behind',
		inputs: {
			...DEFAULT_INPUTS,
			country: 'ng', age: 24, familySupport: 0, parentsDegree: false, neighborhood: 0, sex: 'm',
			smoker: 'current', exerciseMins: 0, alcohol: 'heavy', sleepHours: 5, insured: false, bmiBand: 'obese',
			income: 8000, netWorth: -5000, debt: 15000, latePayments: 2, creditUtil: 95, emergencyMonths: 0, homeowner: false,
			education: 'none', employment: 'unemployed', outlook: 'declining',
			socialConnection: 0, partnered: false, volunteers: false, drivingIncidents: 2, digitalFootprint: 0,
			housing: 'insecure', banking: 'unbanked', criminalRecord: true, voterRegistered: false
		}
	},
	{
		id: 'blank',
		label: 'Blank slate',
		inputs: {
			...DEFAULT_INPUTS,
			country: 'us', age: 30, familySupport: 1, parentsDegree: false, neighborhood: 1, sex: 'f',
			smoker: 'never', exerciseMins: 75, alcohol: 'moderate', sleepHours: 7, insured: true, bmiBand: 'normal',
			income: 40000, netWorth: 20000, debt: 10000, latePayments: 0, creditUtil: 20, emergencyMonths: 2, homeowner: false,
			education: 'some', employment: 'employed', outlook: 'stable',
			socialConnection: 1, partnered: false, volunteers: false, drivingIncidents: 0, digitalFootprint: 1,
			housing: 'stable', banking: 'banked', criminalRecord: false, voterRegistered: true
		}
	}
];
```

Note: if any preset fails `clampInputs(p.inputs)).toEqual(p.inputs)`, an input value is out of an enum/clamp range — fix that value, do not loosen the test.

- [ ] **Step 4: Add `setInputs` to the store.** In `src/lib/state/profile.svelte.ts`, inside the returned object of `createProfileState`, add after `setInput`:
```ts
		setInputs(next: Profile['inputs']) {
			inputs = { ...next };
		},
```

- [ ] **Step 5: Run** `npm test -- src/lib/rulebook/presets.test.ts` — Expected: PASS (3 tests). Confirm `index.ts` re-exports presets: add `export * from './presets';` to `src/lib/rulebook/index.ts` if absent. `npm test` full suite green; `npm run check` → 0 errors.
- [ ] **Step 6: Commit** `git add src/lib/rulebook/presets.* src/lib/rulebook/index.ts src/lib/state/profile.svelte.ts && git commit -m "feat: preset scenarios and store.setInputs"`

---

### Task 7: PresetBar on the score page

**Files:**
- Create: `src/lib/ui/PresetBar.svelte`
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Implement `src/lib/ui/PresetBar.svelte`**

Chips that apply a preset's inputs (overrides preserved). The active chip is the one whose inputs deep-equal the current inputs.

```svelte
<script lang="ts">
	import { PRESETS } from '$lib/rulebook';
	import type { createProfileState } from '$lib/state/profile.svelte';

	let { profile }: { profile: ReturnType<typeof createProfileState> } = $props();
	const currentKey = $derived(JSON.stringify(profile.inputs));
	const activeId = $derived(PRESETS.find((p) => JSON.stringify(p.inputs) === currentKey)?.id ?? null);
</script>

<div class="mb-4">
	<div class="mb-2 text-[10px] tracking-[0.1em] uppercase" style:font-family="var(--font-mono)" style:color="var(--ink-dim)">
		Start from <span class="lowercase tracking-normal">— then change anything</span>
	</div>
	<div class="flex flex-wrap gap-2">
		{#each PRESETS as p (p.id)}
			<button
				type="button"
				class="rounded-full border px-3 py-1.5 text-[11px] transition-all"
				style:font-family="var(--font-mono)"
				style:background={activeId === p.id ? 'rgba(217,164,65,0.12)' : 'transparent'}
				style:color={activeId === p.id ? 'var(--moves)' : 'var(--ink-dim)'}
				style:border-color={activeId === p.id ? 'rgba(217,164,65,0.5)' : 'var(--line)'}
				onclick={() => profile.setInputs(p.inputs)}
			>{p.label}</button>
		{/each}
	</div>
</div>
```

- [ ] **Step 2: Mount in `src/routes/+page.svelte`.** Add the import:
```ts
	import PresetBar from '$lib/ui/PresetBar.svelte';
```
and place it immediately BEFORE `<InputsPanel {profile} />`:
```svelte
<PresetBar {profile} />

<InputsPanel {profile} />
```

- [ ] **Step 3: Verify** `npm run check` → 0 errors; `npm run build` → clean. Browser-smoke: `npm run dev`, load `/`, click "Born ahead" → confirm the composite jumps and the inputs change; the clicked chip highlights gold; editing any field clears the highlight (no chip active). Click "Global median" and confirm a much lower composite (the perspective contrast). Kill server.

- [ ] **Step 4: Commit** `git add src/lib/ui/PresetBar.svelte src/routes/+page.svelte && git commit -m "feat: preset bar for onboarding and the global-median contrast"`

---

### Task 8: Mobile Web Share + client-rendered score image

**Files:**
- Create: `src/lib/share/score-image.ts`
- Modify: `src/lib/ui/ShareButton.svelte`, `src/routes/+page.svelte`

Browser-only canvas code; no unit test (consistent with the project's no-component-harness stance). Verified by build + browser.

- [ ] **Step 1: Implement `src/lib/share/score-image.ts`**

Renders a 1080×1080 share image in the brand style and returns a PNG `File`. Returns `null` if canvas is unavailable.

```ts
export interface ScoreImageData {
	composite: number;
	startingPoint: number;
	yourMoves: number;
}

/** Render a square brand card with the composite number. Browser-only; null if unsupported. */
export async function renderScoreImage(data: ScoreImageData): Promise<File | null> {
	if (typeof document === 'undefined') return null;
	const size = 1080;
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d');
	if (!ctx) return null;

	// Best-effort: wait for the brand fonts so canvas text uses them, not a fallback.
	try {
		await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
	} catch {
		// fonts API unavailable — proceed with system fallbacks
	}

	ctx.fillStyle = '#14161a';
	ctx.fillRect(0, 0, size, size);

	ctx.textAlign = 'center';
	ctx.fillStyle = '#e7e4dc';
	ctx.font = '600 84px "Fraunces Variable", Georgia, serif';
	ctx.fillText('life. scored.', size / 2, 300);

	ctx.fillStyle = '#8b8f99';
	ctx.font = "500 30px 'JetBrains Mono Variable', monospace";
	ctx.fillText('MY COMPOSITE', size / 2, 470);

	ctx.fillStyle = '#e7e4dc';
	ctx.font = "700 300px 'JetBrains Mono Variable', monospace";
	ctx.fillText(Math.round(data.composite).toLocaleString('en-US'), size / 2, 720);

	// accent rule
	ctx.strokeStyle = '#d9a441';
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(size / 2 - 200, 800);
	ctx.lineTo(size / 2 + 200, 800);
	ctx.stroke();

	ctx.fillStyle = '#8b8f99';
	ctx.font = "400 30px 'JetBrains Mono Variable', monospace";
	ctx.fillText(
		`starting point ${Math.round(data.startingPoint)}  ·  my moves ${Math.round(data.yourMoves)}`,
		size / 2,
		870
	);

	ctx.fillStyle = '#7c93b8';
	ctx.font = "400 30px 'JetBrains Mono Variable', monospace";
	ctx.fillText('lifescored.com', size / 2, 980);

	const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
	if (!blob) return null;
	return new File([blob], 'life-scored.png', { type: 'image/png' });
}
```

- [ ] **Step 2: Rewrite `src/lib/ui/ShareButton.svelte`** to prefer the native share sheet (with the image when supported), falling back to clipboard.

```svelte
<script lang="ts">
	import { encodeProfile, type Profile } from '$lib/share/codec';
	import { renderScoreImage } from '$lib/share/score-image';

	let {
		profile,
		composite,
		startingPoint,
		yourMoves
	}: { profile: Profile; composite: number; startingPoint: number; yourMoves: number } = $props();

	let copied = $state(false);
	let failed = $state(false);
	let shareUrl = $state('');
	let imageFile = $state<File | null>(null);

	// Precompute the link so the click handler can call share/clipboard synchronously —
	// an await between the user's click and the API call drops user activation (Safari rejects it).
	$effect(() => {
		const snapshot = profile;
		let cancelled = false;
		encodeProfile(snapshot).then((encoded) => {
			if (!cancelled) shareUrl = `${location.origin}/#p=${encoded}`;
		});
		return () => {
			cancelled = true;
		};
	});

	// Precompute the share image when the headline numbers change.
	$effect(() => {
		const data = { composite, startingPoint, yourMoves };
		let cancelled = false;
		renderScoreImage(data).then((f) => {
			if (!cancelled) imageFile = f;
		});
		return () => {
			cancelled = true;
		};
	});

	function flash(which: 'copied' | 'failed') {
		copied = which === 'copied';
		failed = which === 'failed';
		setTimeout(() => {
			copied = false;
			if (which === 'copied') failed = false;
		}, 2000);
	}

	function copyFallback() {
		navigator.clipboard.writeText(shareUrl).then(
			() => flash('copied'),
			() => (failed = true)
		);
	}

	function share() {
		if (!shareUrl) return;
		const text = `My life, scored: ${Math.round(composite).toLocaleString('en-US')}`;
		const data: ShareData = { title: 'life. scored.', text, url: shareUrl };
		const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
		if (imageFile && nav.canShare?.({ files: [imageFile] })) {
			(data as ShareData & { files: File[] }).files = [imageFile];
		}
		if (nav.share) {
			nav.share(data).then(
				() => {},
				(e: DOMException) => {
					if (e?.name !== 'AbortError') copyFallback();
				}
			);
		} else {
			copyFallback();
		}
	}

	function selectAll(e: Event) {
		(e.currentTarget as HTMLInputElement).select();
	}
</script>

<div class="flex flex-col items-end gap-1.5">
	<button
		class="rounded-full border px-3 py-1 text-[11px]"
		style:font-family="var(--font-mono)"
		style:color={copied ? 'var(--sourced)' : 'var(--ink-dim)'}
		style:border-color="var(--line)"
		disabled={!shareUrl}
		onclick={share}
	>{copied ? 'shared ✓' : 'share — inputs travel in the link, not to a server'}</button>

	{#if failed}
		<input
			readonly
			value={shareUrl}
			onfocus={selectAll}
			onclick={selectAll}
			class="w-full max-w-[420px] rounded border px-2 py-1 text-[10px]"
			style:font-family="var(--font-mono)"
			style:background="var(--panel)"
			style:color="var(--ink)"
			style:border-color="var(--line)"
			aria-label="Shareable link — select and copy"
		/>
		<span class="text-[10px]" style:color="var(--spec)">couldn't reach the clipboard — copy the link above</span>
	{/if}
</div>
```

- [ ] **Step 3: Pass the numbers from `src/routes/+page.svelte`.** Update the ShareButton usage at the bottom:
```svelte
	<ShareButton
		profile={profile.snapshot()}
		composite={result.composite}
		startingPoint={result.tierSubtotals.starting_point}
		yourMoves={result.tierSubtotals.your_moves}
	/>
```

- [ ] **Step 4: Verify** `npm run check` → 0 errors; `npm run build` → clean; `npm test` still green. Browser-smoke (desktop has no `navigator.share`, so it exercises the clipboard path): `npm run dev`, load `/`, click share → button reads "shared ✓" (clipboard copy succeeded) OR the manual-copy input appears with a valid `#p=` link. Kill server. (The native share sheet + image path is exercised on a real phone — note in the report that desktop verifies the fallback only.)

- [ ] **Step 5: Commit** `git add src/lib/share/score-image.ts src/lib/ui/ShareButton.svelte src/routes/+page.svelte && git commit -m "feat: native mobile share sheet with client-rendered score image"`

---

### Task 9: Full verification and deploy

**Files:** none (verification only)

- [ ] **Step 1: Full local gate** — `npm test && npm run check && npm run build` — all green, all three pages prerender.

- [ ] **Step 2: Integrated browser smoke** — `npm run dev`, then on `/`:
  - click a `?` → definition popover with source link, closes on outside click
  - "WHAT'S MOVING YOUR SCORE MOST" shows lifts + weakest
  - click "Global median" preset → low composite; "Born ahead" → high composite; chip highlights; editing clears highlight
  - share → "shared ✓" or manual-copy fallback with a valid link
  Kill the server.

- [ ] **Step 3: Push and deploy via CI** — `git push origin main`, then watch the deploy workflow to green:
```bash
rid=$(gh run list --repo royashbrook/lifescored --workflow deploy.yml --limit 1 --json databaseId | grep -o '[0-9]\{8,\}')
# poll until completed, expect conclusion success
```

- [ ] **Step 4: Production smoke** — confirm `https://lifescored.com/` returns 200 and the page contains "WHAT'S MOVING YOUR SCORE MOST" and "Start from".

---

## Plan self-review notes

- **Spec coverage:** (A) definitions → Tasks 1–3; (B) top-movers → Tasks 4–5; (C) presets → Tasks 6–7; (D) mobile Web Share + image → Task 8; verification/deploy → Task 9. 100-element expansion intentionally absent (issue #1).
- **Gesture-safety:** ShareButton precomputes both `shareUrl` and `imageFile`; `share()` and `copyFallback()` call the platform APIs synchronously — same fix class as the earlier Safari clipboard bug.
- **Type consistency:** `FieldHelp` (help.ts) consumed by Field/FieldHelp/InputsPanel; `Highlights`/`topMovers` (highlights.ts) by TopMovers; `Preset`/`PRESETS` (presets.ts) + `setInputs` (store) by PresetBar; `ScoreImageData`/`renderScoreImage` (score-image.ts) by ShareButton. All re-exported via `rulebook/index.ts` where imported from `$lib/rulebook`.
- **Aesthetic:** reuses existing CSS variables and the gold/blue/green accents; the one literal hex (`#c0604d`, negative red, and `#20242c` popover bg) already appear in the codebase (Bar.svelte negative, mockup). No new fonts, no layout overhaul.
- **No new rules, no engine/contract changes, no codec/migration changes** — additive UI + content only.
