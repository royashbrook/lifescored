# Life Score Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Life Score transparency app — a cited, tunable, client-only scoring rulebook (29 rules / 6 domains) with a SvelteKit static frontend and one Cloudflare Worker endpoint serving cached Gemini narratives.

**Architecture:** All scoring is pure TypeScript driven by a declarative rulebook; the UI iterates it. Profile state lives in the browser (localStorage + compressed URL-fragment sharing). The only server code is `POST /api/narrative`, which quantizes → KV-caches → calls Gemini free tier with hard budget guards and a deterministic local fallback.

**Tech Stack:** Svelte 5 (runes), SvelteKit, TypeScript, Tailwind v4 (`@tailwindcss/vite`), `@sveltejs/adapter-cloudflare`, Workers KV, Gemini Flash REST API, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-11-lifescore-design.md` — read it first; its principles (composite de-emphasized, receipts on every rule, protected characteristics excluded, unscored luck asterisk) are binding.

---

## File structure

```
package.json / svelte.config.js / vite.config.ts / tsconfig.json / wrangler.jsonc
src/
  app.html  app.css                      # shell + theme (CSS vars, fonts)
  lib/
    rulebook/
      types.ts        # Domain/Tier/Evidence/Inputs/Rule interfaces, clamp()
      inputs.ts       # COUNTRIES table, DEFAULT_INPUTS, clamps, field metadata
      origin.ts health.ts finance.ts education.ts social.ts civic.ts   # rule defs
      index.ts        # RULES aggregate + DOMAINS/TIERS display metadata
    engine/
      score.ts        # computeScore(inputs, overrides) → ScoreResult
      quantize.ts     # ScoreResult → quantized narrative payload
    share/codec.ts    # profile ⇄ "1."+base64url(deflate-raw(JSON))
    state/profile.svelte.ts  # runes store + localStorage persistence
    narrative/
      local.ts        # deterministic fallback narrative
      client.ts       # POST wrapper, falls back to local
    server/narrative.ts      # handler with injected deps (kv, fetchFn, apiKey)
    ui/  Tag, Bar, ScoreRow, SectionHead, Field, NumInput, SelectInput,
         Toggle, Lever, RuleCard, NarrativeCard, ShareButton, InputsPanel,
         Callout  (.svelte)
  routes/
    +layout.svelte  +layout.ts          # prerender = true
    +page.svelte                        # Score view
    rulebook/+page.svelte               # Rulebook + weight editor
    about/+page.svelte                  # manifesto/methodology
    api/narrative/+server.ts            # thin Worker wrapper
```

Tests are colocated: `src/lib/**/<name>.test.ts`. Every numeric module is TDD'd; Svelte components are verified by `npm run check` + production build (no component-test harness in v1 — YAGNI).

Conventions used throughout:
- Every rule's `score(i, w)` computes a **fraction** then multiplies by the weight `w` and rounds, so user weight overrides flow through unchanged. Fractions are clamped so `|score| ≤ w` always.
- `accessed: '2026-06-11'` on every source.
- Commit after every task (commands given per task).

---

### Task 1: Scaffold the project

**Files:** Create: `package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `wrangler.jsonc`, `src/app.html`, `src/app.css`, `src/app.d.ts`, `src/routes/+layout.ts`, `.gitignore`

- [ ] **Step 1: Scaffold SvelteKit**

```bash
cd /Users/roy/gh/lifescore
npx sv create . --template minimal --types ts --no-add-ons --install npm
```

(If `sv` prompts about the non-empty directory — it contains only `docs/` and `.git` — confirm "continue".)

- [ ] **Step 2: Add dependencies**

```bash
npm i -D @sveltejs/adapter-cloudflare tailwindcss @tailwindcss/vite vitest wrangler
npm i @fontsource-variable/fraunces @fontsource-variable/jetbrains-mono @fontsource/newsreader
```

- [ ] **Step 3: Configure adapter, Tailwind, Vitest**

`svelte.config.js`:
```js
import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: { adapter: adapter() }
};
export default config;
```

`vite.config.ts`:
```ts
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: { include: ['src/**/*.test.ts'], environment: 'node' }
});
```

`wrangler.jsonc`:
```jsonc
{
	"name": "lifescore",
	"compatibility_date": "2026-06-01",
	"main": ".svelte-kit/cloudflare/_worker.js",
	"assets": { "binding": "ASSETS", "directory": ".svelte-kit/cloudflare" },
	"kv_namespaces": [{ "binding": "NARRATIVE_KV", "id": "TO_BE_CREATED_AT_DEPLOY" }]
	// GEMINI_API_KEY is a secret: `wrangler secret put GEMINI_API_KEY`
}
```

`src/app.d.ts` (platform types):
```ts
declare global {
	namespace App {
		interface Platform {
			env: {
				NARRATIVE_KV: {
					get(key: string): Promise<string | null>;
					put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
				};
				GEMINI_API_KEY?: string;
			};
		}
	}
}
export {};
```

`src/routes/+layout.ts`:
```ts
export const prerender = true;
```

`src/app.css` — theme variables (the spike's palette) + fonts:
```css
@import 'tailwindcss';
@import '@fontsource-variable/fraunces';
@import '@fontsource-variable/jetbrains-mono';
@import '@fontsource/newsreader';

:root {
	--bg: #14161a;
	--panel: #191c22;
	--ink: #e7e4dc;
	--ink-dim: #8b8f99;
	--start: #7c93b8;
	--moves: #d9a441;
	--sourced: #6fbf96;
	--spec: #d8a85c;
	--line: rgba(255, 255, 255, 0.08);
	--font-display: 'Fraunces Variable', serif;
	--font-body: 'Newsreader', Georgia, serif;
	--font-mono: 'JetBrains Mono Variable', monospace;
}

body {
	background: var(--bg);
	color: var(--ink);
	font-family: var(--font-body);
}
```

Add to `package.json` scripts: `"test": "vitest run"`, `"deploy": "npm run build && wrangler deploy"`.

- [ ] **Step 4: Verify dev build works**

Run: `npm run check && npm run build`
Expected: svelte-check passes; build emits `.svelte-kit/cloudflare/` output without errors.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: scaffold SvelteKit + CF adapter + Tailwind + Vitest"
```

---

### Task 2: Rulebook types + input schema

**Files:**
- Create: `src/lib/rulebook/types.ts`, `src/lib/rulebook/inputs.ts`
- Test: `src/lib/rulebook/inputs.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/rulebook/inputs.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { clampInputs, COUNTRIES, DEFAULT_INPUTS, NUMERIC_CLAMPS } from './inputs';

describe('inputs', () => {
	it('defaults are already within clamps (round-trips unchanged)', () => {
		expect(clampInputs(DEFAULT_INPUTS)).toEqual(DEFAULT_INPUTS);
	});

	it('clamps out-of-range numerics to their bounds', () => {
		const wild = { ...DEFAULT_INPUTS, age: 900, debt: -5, creditUtil: 400 };
		const c = clampInputs(wild);
		expect(c.age).toBe(NUMERIC_CLAMPS.age[1]);
		expect(c.debt).toBe(0);
		expect(c.creditUtil).toBe(100);
	});

	it('every country has a name, income tier, base fraction and henley band', () => {
		for (const c of Object.values(COUNTRIES)) {
			expect(c.name.length).toBeGreaterThan(0);
			expect(c.baseFrac).toBeGreaterThanOrEqual(0);
			expect(c.baseFrac).toBeLessThanOrEqual(1);
			expect([0, 1, 2]).toContain(c.henleyBand);
		}
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/rulebook/inputs.test.ts`
Expected: FAIL — cannot resolve `./inputs`.

- [ ] **Step 3: Write types.ts and inputs.ts**

`src/lib/rulebook/types.ts`:
```ts
export type Domain = 'origin' | 'health' | 'finance' | 'education' | 'social' | 'civic';
export type Tier = 'starting_point' | 'your_moves';
export type Evidence = 'SOURCED' | 'SPECULATIVE';

export interface Source {
	name: string;
	finding: string;
	url: string;
	accessed: string;
}

export type CountryCode = 'us' | 'nl' | 'de' | 'jp' | 'br' | 'mx' | 'in' | 'ng' | 'af';

export interface Inputs {
	// origin
	country: CountryCode;
	familySupport: 0 | 1 | 2;
	parentsDegree: boolean;
	neighborhood: 0 | 1 | 2; // low / average / high opportunity area
	// health
	age: number;
	sex: 'f' | 'm';
	smoker: 'never' | 'former' | 'current';
	exerciseMins: number; // per week
	alcohol: 'none' | 'moderate' | 'heavy';
	sleepHours: number;
	insured: boolean;
	bmiBand: 'under' | 'normal' | 'over' | 'obese';
	// finance
	income: number;
	netWorth: number;
	debt: number;
	latePayments: 0 | 1 | 2; // none in 24mo / one / multiple
	creditUtil: number; // percent of available revolving credit used
	emergencyMonths: number;
	homeowner: boolean;
	// education / work
	degree: boolean;
	employment: 'employed' | 'self' | 'unemployed' | 'student' | 'retired';
	outlook: 'declining' | 'stable' | 'growing';
	// social
	socialConnection: 0 | 1 | 2; // rarely / sometimes / regularly see people you're close to
	partnered: boolean;
	volunteers: boolean;
	drivingIncidents: number; // at-fault accidents + moving violations, last 3y
	digitalFootprint: 0 | 1 | 2; // risky / neutral / curated public footprint
	// civic
	criminalRecord: boolean;
	voterRegistered: boolean;
}

export type InputKey = keyof Inputs;

export interface WhatIf {
	label: string;
	applicable(i: Inputs): boolean;
	transform(i: Inputs): Inputs;
}

export interface Rule {
	id: string;
	domain: Domain;
	tier: Tier;
	label: string;
	controllable: boolean;
	defaultWeight: number;
	logic: string;
	evidence: Evidence;
	source: Source;
	inputs: InputKey[];
	score(i: Inputs, weight: number): number;
	describe(i: Inputs): string;
	whatIf?: WhatIf;
	caveat?: string; // known criticisms of the measure, shown in-app
}

export const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
export const usd = (n: number) => '$' + Math.round(n).toLocaleString('en-US');
```

`src/lib/rulebook/inputs.ts`:
```ts
import { clamp, type CountryCode, type Inputs } from './types';

export interface CountryMeta {
	name: string;
	tier: 'high' | 'upper-middle' | 'lower-middle' | 'low';
	baseFrac: number; // fraction of the country rule's weight
	henleyBand: 0 | 1 | 2; // weak / mid / strong passport
	note: string;
}

// baseFrac is editorial within each World Bank income tier; the tier itself is sourced.
export const COUNTRIES: Record<CountryCode, CountryMeta> = {
	us: { name: 'United States', tier: 'high', baseFrac: 0.75, henleyBand: 2, note: 'high-income economy, weaker safety net' },
	nl: { name: 'Netherlands', tier: 'high', baseFrac: 0.92, henleyBand: 2, note: 'high-income economy, strong safety net' },
	de: { name: 'Germany', tier: 'high', baseFrac: 0.9, henleyBand: 2, note: 'high-income economy, strong safety net' },
	jp: { name: 'Japan', tier: 'high', baseFrac: 0.85, henleyBand: 2, note: 'high-income economy, aging demographics' },
	br: { name: 'Brazil', tier: 'upper-middle', baseFrac: 0.45, henleyBand: 1, note: 'upper-middle-income, high inequality' },
	mx: { name: 'Mexico', tier: 'upper-middle', baseFrac: 0.45, henleyBand: 1, note: 'upper-middle-income economy' },
	in: { name: 'India', tier: 'lower-middle', baseFrac: 0.3, henleyBand: 0, note: 'lower-middle-income, fast-growing' },
	ng: { name: 'Nigeria', tier: 'lower-middle', baseFrac: 0.25, henleyBand: 0, note: 'lower-middle-income, young population' },
	af: { name: 'Afghanistan', tier: 'low', baseFrac: 0.15, henleyBand: 0, note: 'low-income, conflict-affected' }
};

// The spike's "son" scenario, extended across all domains.
export const DEFAULT_INPUTS: Inputs = {
	country: 'us',
	familySupport: 1,
	parentsDegree: false,
	neighborhood: 1,
	age: 27,
	sex: 'm',
	smoker: 'never',
	exerciseMins: 90,
	alcohol: 'moderate',
	sleepHours: 7,
	insured: true,
	bmiBand: 'normal',
	income: 46000,
	netWorth: 6000,
	debt: 0,
	latePayments: 0,
	creditUtil: 12,
	emergencyMonths: 1,
	homeowner: false,
	degree: false,
	employment: 'employed',
	outlook: 'stable',
	socialConnection: 1,
	partnered: false,
	volunteers: false,
	drivingIncidents: 0,
	digitalFootprint: 1,
	criminalRecord: false,
	voterRegistered: true
};

type NumericKey = 'age' | 'exerciseMins' | 'sleepHours' | 'income' | 'netWorth' | 'debt' | 'creditUtil' | 'emergencyMonths' | 'drivingIncidents';

export const NUMERIC_CLAMPS: Record<NumericKey, [number, number]> = {
	age: [16, 100],
	exerciseMins: [0, 2000],
	sleepHours: [3, 12],
	income: [0, 10_000_000],
	netWorth: [-5_000_000, 100_000_000],
	debt: [0, 100_000_000],
	creditUtil: [0, 100],
	emergencyMonths: [0, 60],
	drivingIncidents: [0, 10]
};

export function clampInputs(i: Inputs): Inputs {
	const out = { ...i };
	for (const [key, [lo, hi]] of Object.entries(NUMERIC_CLAMPS) as [NumericKey, [number, number]][]) {
		const v = Number(out[key]);
		out[key] = clamp(Number.isFinite(v) ? v : lo, lo, hi);
	}
	if (!COUNTRIES[out.country]) out.country = 'us';
	return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/rulebook/inputs.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/rulebook && git commit -m "feat: rulebook types and input schema with clamping"
```

---

### Task 3: Shared rule-test helper + origin domain rules

**Files:**
- Create: `src/lib/rulebook/rule-test-utils.ts`, `src/lib/rulebook/origin.ts`
- Test: `src/lib/rulebook/origin.test.ts`

- [ ] **Step 1: Write the shared invariant helper (used by every domain's tests)**

`src/lib/rulebook/rule-test-utils.ts`:
```ts
import { expect } from 'vitest';
import { COUNTRIES, DEFAULT_INPUTS } from './inputs';
import type { Inputs, Rule } from './types';

// A spread of profiles that exercises extremes of every input.
export const SAMPLE_INPUTS: Inputs[] = [
	DEFAULT_INPUTS,
	{
		...DEFAULT_INPUTS, country: 'af', familySupport: 0, parentsDegree: false, neighborhood: 0,
		age: 72, sex: 'f', smoker: 'current', exerciseMins: 0, alcohol: 'heavy', sleepHours: 4,
		insured: false, bmiBand: 'obese', income: 0, netWorth: -40000, debt: 90000,
		latePayments: 2, creditUtil: 95, emergencyMonths: 0, homeowner: false, degree: false,
		employment: 'unemployed', outlook: 'declining', socialConnection: 0, partnered: false,
		volunteers: false, drivingIncidents: 4, digitalFootprint: 0, criminalRecord: true,
		voterRegistered: false
	},
	{
		...DEFAULT_INPUTS, country: 'nl', familySupport: 2, parentsDegree: true, neighborhood: 2,
		age: 35, sex: 'f', smoker: 'never', exerciseMins: 300, alcohol: 'none', sleepHours: 8,
		insured: true, bmiBand: 'normal', income: 250000, netWorth: 900000, debt: 0,
		latePayments: 0, creditUtil: 3, emergencyMonths: 12, homeowner: true, degree: true,
		employment: 'self', outlook: 'growing', socialConnection: 2, partnered: true,
		volunteers: true, drivingIncidents: 0, digitalFootprint: 2, criminalRecord: false,
		voterRegistered: true
	}
];

/** Universal invariants every rule must satisfy. */
export function expectRuleInvariants(rule: Rule) {
	for (const i of SAMPLE_INPUTS) {
		for (const w of [rule.defaultWeight, 1, 40]) {
			const v = rule.score(i, w);
			expect(Number.isInteger(v), `${rule.id} returns integers`).toBe(true);
			expect(Math.abs(v), `${rule.id} |score| ≤ weight ${w}`).toBeLessThanOrEqual(w);
		}
		expect(rule.score(i, 0), `${rule.id} zero weight → zero`).toBe(0);
		expect(rule.describe(i).length, `${rule.id} describes every profile`).toBeGreaterThan(0);
	}
	expect(rule.source.url).toMatch(/^https:\/\//);
	expect(rule.source.accessed).toBe('2026-06-11');
	if (rule.whatIf) {
		expect(rule.controllable, `${rule.id}: only controllable rules get levers`).toBe(true);
	}
}

export { COUNTRIES, DEFAULT_INPUTS };
```

- [ ] **Step 2: Write the failing origin test**

`src/lib/rulebook/origin.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { ORIGIN_RULES } from './origin';
import { DEFAULT_INPUTS, expectRuleInvariants } from './rule-test-utils';

const byId = (id: string) => ORIGIN_RULES.find((r) => r.id === id)!;

describe('origin rules', () => {
	it('satisfy universal invariants', () => {
		expect(ORIGIN_RULES).toHaveLength(5);
		for (const r of ORIGIN_RULES) {
			expectRuleInvariants(r);
			expect(r.domain).toBe('origin');
			expect(r.tier).toBe('starting_point');
			expect(r.controllable).toBe(false);
		}
	});

	it('country: higher income tier scores higher', () => {
		const r = byId('country');
		const nl = r.score({ ...DEFAULT_INPUTS, country: 'nl' }, r.defaultWeight);
		const br = r.score({ ...DEFAULT_INPUTS, country: 'br' }, r.defaultWeight);
		const af = r.score({ ...DEFAULT_INPUTS, country: 'af' }, r.defaultWeight);
		expect(nl).toBeGreaterThan(br);
		expect(br).toBeGreaterThan(af);
	});

	it('generational support is monotonic and flagged speculative', () => {
		const r = byId('generational');
		expect(r.evidence).toBe('SPECULATIVE');
		const s = [0, 1, 2].map((f) => r.score({ ...DEFAULT_INPUTS, familySupport: f as 0 | 1 | 2 }, r.defaultWeight));
		expect(s[0]).toBeLessThan(s[1]);
		expect(s[1]).toBeLessThan(s[2]);
	});

	it('passport strength follows the country henley band', () => {
		const r = byId('passport');
		expect(r.score({ ...DEFAULT_INPUTS, country: 'us' }, 6)).toBeGreaterThan(
			r.score({ ...DEFAULT_INPUTS, country: 'in' }, 6)
		);
	});
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- src/lib/rulebook/origin.test.ts`
Expected: FAIL — cannot resolve `./origin`.

- [ ] **Step 4: Implement origin.ts**

`src/lib/rulebook/origin.ts`:
```ts
import { COUNTRIES } from './inputs';
import type { Rule } from './types';

const ACCESSED = '2026-06-11';

export const ORIGIN_RULES: Rule[] = [
	{
		id: 'country',
		domain: 'origin',
		tier: 'starting_point',
		label: 'Country of residence',
		controllable: false,
		defaultWeight: 24,
		logic: 'Residence sets a baseline from its World Bank income tier. High-income country → high base; low-income or conflict-affected → low base.',
		evidence: 'SOURCED',
		source: {
			name: 'World Bank — country income classifications',
			finding: 'Economies grouped high / upper-middle / lower-middle / low income by GNI per capita; used here as the baseline tier.',
			url: 'https://datahelpdesk.worldbank.org/knowledgebase/articles/906519',
			accessed: ACCESSED
		},
		inputs: ['country'],
		score: (i, w) => Math.round(COUNTRIES[i.country].baseFrac * w),
		describe: (i) => COUNTRIES[i.country].note
	},
	{
		id: 'generational',
		domain: 'origin',
		tier: 'starting_point',
		label: 'Generational support',
		controllable: false,
		defaultWeight: 16,
		logic: 'A family financial floor raises your position. No clean public dataset maps this to an individual, so the weight is a flagged guess, not a measurement.',
		evidence: 'SPECULATIVE',
		source: {
			name: 'Opportunity Insights (Chetty et al.) — intergenerational mobility',
			finding: 'Documents how parental resources shape adult outcomes — real at population scale, but NOT directly operationalizable into a personal number. Hence speculative.',
			url: 'https://opportunityinsights.org/',
			accessed: ACCESSED
		},
		inputs: ['familySupport'],
		score: (i, w) => Math.round([0, 0.4, 0.9][i.familySupport] * w),
		describe: (i) => ['no family floor', 'some family support', 'substantial family backing'][i.familySupport]
	},
	{
		id: 'parental-education',
		domain: 'origin',
		tier: 'starting_point',
		label: 'Parental education',
		controllable: false,
		defaultWeight: 8,
		logic: "Children of degree-holding parents are far likelier to earn degrees themselves and start with more navigational capital. You didn't choose this.",
		evidence: 'SOURCED',
		source: {
			name: 'NCES — First-Generation Students',
			finding: 'College enrollment and completion rates are substantially higher for students whose parents hold bachelor’s degrees than for first-generation students.',
			url: 'https://nces.ed.gov/pubs2018/2018421.pdf',
			accessed: ACCESSED
		},
		inputs: ['parentsDegree'],
		score: (i, w) => Math.round((i.parentsDegree ? 1 : 0.3) * w),
		describe: (i) => (i.parentsDegree ? 'a parent holds a degree — inherited navigational capital' : 'first-generation territory — every form is unfamiliar the first time')
	},
	{
		id: 'passport',
		domain: 'origin',
		tier: 'starting_point',
		label: 'Passport strength',
		controllable: false,
		defaultWeight: 6,
		logic: 'Your passport determines visa-free access to work, study, and flee. Derived from your country of residence in this model.',
		evidence: 'SOURCED',
		source: {
			name: 'Henley Passport Index',
			finding: 'Ranks passports by visa-free destination count; the gap between the strongest and weakest passports exceeds 160 destinations.',
			url: 'https://www.henleyglobal.com/passport-index',
			accessed: ACCESSED
		},
		inputs: ['country'],
		score: (i, w) => Math.round([0.2, 0.6, 1][COUNTRIES[i.country].henleyBand] * w),
		describe: (i) => ['weak passport — much of the world needs a visa application', 'mid-tier passport', 'strong passport — most borders open on arrival'][COUNTRIES[i.country].henleyBand]
	},
	{
		id: 'neighborhood',
		domain: 'origin',
		tier: 'starting_point',
		label: 'Neighborhood opportunity',
		controllable: false,
		defaultWeight: 8,
		logic: 'The census tract you grew up in measurably shifts adult income. Self-assessed band here (low / average / high opportunity area).',
		evidence: 'SOURCED',
		source: {
			name: 'Opportunity Atlas (Chetty, Friedman, Hendren)',
			finding: 'Children who grow up in high-upward-mobility tracts earn substantially more as adults, holding parental income constant.',
			url: 'https://www.opportunityatlas.org/',
			accessed: ACCESSED
		},
		inputs: ['neighborhood'],
		score: (i, w) => Math.round([0.1, 0.5, 1][i.neighborhood] * w),
		describe: (i) => ['low-opportunity area — the Atlas says this drag is real', 'average-opportunity area', 'high-opportunity area — an invisible tailwind'][i.neighborhood]
	}
];
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/lib/rulebook/origin.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/rulebook && git commit -m "feat: origin domain rules with shared rule invariant test helper"
```

---

### Task 4: Health domain rules

**Files:**
- Create: `src/lib/rulebook/health.ts`
- Test: `src/lib/rulebook/health.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/rulebook/health.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { HEALTH_RULES } from './health';
import { DEFAULT_INPUTS, expectRuleInvariants } from './rule-test-utils';

const byId = (id: string) => HEALTH_RULES.find((r) => r.id === id)!;

describe('health rules', () => {
	it('satisfy universal invariants', () => {
		expect(HEALTH_RULES).toHaveLength(7);
		for (const r of HEALTH_RULES) {
			expectRuleInvariants(r);
			expect(r.domain).toBe('health');
		}
	});

	it('life-table is starting_point; behaviors are your_moves', () => {
		expect(byId('life-table').tier).toBe('starting_point');
		for (const id of ['smoking', 'exercise', 'alcohol', 'sleep', 'insurance']) {
			expect(byId(id).tier).toBe('your_moves');
		}
	});

	it('life-table: younger scores higher; women slightly higher at same age', () => {
		const r = byId('life-table');
		const young = r.score({ ...DEFAULT_INPUTS, age: 25 }, r.defaultWeight);
		const old = r.score({ ...DEFAULT_INPUTS, age: 70 }, r.defaultWeight);
		expect(young).toBeGreaterThan(old);
		const f = r.score({ ...DEFAULT_INPUTS, age: 50, sex: 'f' }, r.defaultWeight);
		const m = r.score({ ...DEFAULT_INPUTS, age: 50, sex: 'm' }, r.defaultWeight);
		expect(f).toBeGreaterThanOrEqual(m);
	});

	it('smoking: never > former > current; quit lever applies only to current smokers', () => {
		const r = byId('smoking');
		const s = (smoker: 'never' | 'former' | 'current') => r.score({ ...DEFAULT_INPUTS, smoker }, r.defaultWeight);
		expect(s('never')).toBeGreaterThan(s('former'));
		expect(s('former')).toBeGreaterThan(s('current'));
		expect(r.whatIf!.applicable({ ...DEFAULT_INPUTS, smoker: 'current' })).toBe(true);
		expect(r.whatIf!.applicable({ ...DEFAULT_INPUTS, smoker: 'never' })).toBe(false);
		expect(r.whatIf!.transform({ ...DEFAULT_INPUTS, smoker: 'current' }).smoker).toBe('former');
	});

	it('exercise: more minutes never lowers the score; saturates at guideline', () => {
		const r = byId('exercise');
		const s = (m: number) => r.score({ ...DEFAULT_INPUTS, exerciseMins: m }, r.defaultWeight);
		expect(s(0)).toBeLessThan(s(75));
		expect(s(75)).toBeLessThan(s(150));
		expect(s(150)).toBe(s(600));
	});

	it('sleep: 7–9h band scores best', () => {
		const r = byId('sleep');
		const s = (h: number) => r.score({ ...DEFAULT_INPUTS, sleepHours: h }, r.defaultWeight);
		expect(s(8)).toBeGreaterThan(s(6));
		expect(s(6)).toBeGreaterThan(s(4));
		expect(s(8)).toBeGreaterThan(s(11));
	});

	it('bmi carries a caveat about the measure itself', () => {
		expect(byId('bmi').caveat).toBeTruthy();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/rulebook/health.test.ts`
Expected: FAIL — cannot resolve `./health`.

- [ ] **Step 3: Implement health.ts**

`src/lib/rulebook/health.ts`:
```ts
import { clamp, type Rule } from './types';

const ACCESSED = '2026-06-11';

export const HEALTH_RULES: Rule[] = [
	{
		id: 'life-table',
		domain: 'health',
		tier: 'starting_point',
		label: 'Age & sex vs. the life table',
		controllable: false,
		defaultWeight: 10,
		logic: 'Insurers price you off remaining life expectancy: younger means more runway, and women outlive men by ~5 years on average. Pure actuarial position — no virtue involved.',
		evidence: 'SOURCED',
		source: {
			name: 'Social Security Administration — Actuarial Life Table',
			finding: 'Period life tables give remaining life expectancy by exact age and sex; US female life expectancy at birth runs ~5 years above male.',
			url: 'https://www.ssa.gov/oact/STATS/table4c6.html',
			accessed: ACCESSED
		},
		inputs: ['age', 'sex'],
		score: (i, w) => Math.round(clamp(((i.sex === 'f' ? 81 : 76) - i.age) / 60, 0, 1) * w),
		describe: (i) => `age ${i.age}, ${i.sex === 'f' ? 'female' : 'male'} — this is literally how a life insurer opens your file`
	},
	{
		id: 'smoking',
		domain: 'health',
		tier: 'your_moves',
		label: 'Smoking status',
		controllable: true,
		defaultWeight: 10,
		logic: 'The single largest behavioral mortality factor insurers price. Never-smokers score full; former smokers recover most of it; current smokers score zero here.',
		evidence: 'SOURCED',
		source: {
			name: 'CDC — Tobacco-Related Mortality',
			finding: 'Cigarette smoking reduces life expectancy by at least 10 years; quitting before 40 recovers nearly all of it.',
			url: 'https://www.cdc.gov/tobacco/data_statistics/fact_sheets/health_effects/tobacco_related_mortality/index.htm',
			accessed: ACCESSED
		},
		inputs: ['smoker'],
		score: (i, w) => Math.round({ never: 1, former: 0.6, current: 0 }[i.smoker] * w),
		describe: (i) => ({ never: 'never smoked — the cheapest points on the board', former: 'former smoker — most of the actuarial penalty fades with years quit', current: 'current smoker — the largest single behavioral penalty in any actuarial table' })[i.smoker],
		whatIf: {
			label: 'Quit smoking',
			applicable: (i) => i.smoker === 'current',
			transform: (i) => ({ ...i, smoker: 'former' })
		}
	},
	{
		id: 'exercise',
		domain: 'health',
		tier: 'your_moves',
		label: 'Physical activity',
		controllable: true,
		defaultWeight: 8,
		logic: 'Scored against the 150-minutes-per-week guideline; saturates there — this model gives no extra credit for marathon volume.',
		evidence: 'SOURCED',
		source: {
			name: 'WHO — Physical Activity Guidelines',
			finding: 'Adults should do 150–300 minutes of moderate aerobic activity weekly; meeting it is associated with 20–30% reduced all-cause mortality.',
			url: 'https://www.who.int/news-room/fact-sheets/detail/physical-activity',
			accessed: ACCESSED
		},
		inputs: ['exerciseMins'],
		score: (i, w) => Math.round(clamp(i.exerciseMins / 150, 0, 1) * w),
		describe: (i) => (i.exerciseMins >= 150 ? `${i.exerciseMins} min/week — meets the WHO guideline` : `${i.exerciseMins} min/week — guideline is 150; the gap is the cheapest health points available`),
		whatIf: {
			label: 'Hit 150 min/week',
			applicable: (i) => i.exerciseMins < 150,
			transform: (i) => ({ ...i, exerciseMins: 150 })
		}
	},
	{
		id: 'alcohol',
		domain: 'health',
		tier: 'your_moves',
		label: 'Alcohol use',
		controllable: true,
		defaultWeight: 6,
		logic: 'Heavy drinking carries large measured mortality and financial costs; moderate use a smaller penalty; none scores full.',
		evidence: 'SOURCED',
		source: {
			name: 'NIAAA — Alcohol Facts and Statistics',
			finding: 'Excessive alcohol use is a leading preventable cause of death in the US, responsible for roughly 178,000 deaths per year.',
			url: 'https://www.niaaa.nih.gov/alcohols-effects-health/alcohol-topics/alcohol-facts-and-statistics',
			accessed: ACCESSED
		},
		inputs: ['alcohol'],
		score: (i, w) => Math.round({ none: 1, moderate: 0.7, heavy: 0 }[i.alcohol] * w),
		describe: (i) => ({ none: 'no alcohol — full marks on a measure most people assume is binary', moderate: 'moderate use — a small penalty current research no longer waves away', heavy: 'heavy use — a leading preventable mortality factor' })[i.alcohol]
	},
	{
		id: 'sleep',
		domain: 'health',
		tier: 'your_moves',
		label: 'Sleep duration',
		controllable: true,
		defaultWeight: 6,
		logic: '7–9 hours scores full; 6 or 10 hours partial; outside that, the short-sleep mortality association bites.',
		evidence: 'SOURCED',
		source: {
			name: 'CDC / AASM — How Much Sleep Do I Need?',
			finding: 'Adults need 7 or more hours per night; short sleep is associated with obesity, diabetes, and cardiovascular disease.',
			url: 'https://www.cdc.gov/sleep/about/index.html',
			accessed: ACCESSED
		},
		inputs: ['sleepHours'],
		score: (i, w) => {
			const h = i.sleepHours;
			const frac = h >= 7 && h <= 9 ? 1 : h >= 6 && h <= 10 ? 0.6 : 0.2;
			return Math.round(frac * w);
		},
		describe: (i) => (i.sleepHours >= 7 && i.sleepHours <= 9 ? `${i.sleepHours}h — inside the guideline band` : `${i.sleepHours}h — outside the 7–9h band the research keeps converging on`)
	},
	{
		id: 'insurance',
		domain: 'health',
		tier: 'your_moves',
		label: 'Health insurance coverage',
		controllable: true,
		defaultWeight: 8,
		logic: 'Being uninsured is both a health risk and the most common path to catastrophic financial shock. Controllable only to the degree coverage is affordable where you live — flagged in the description.',
		evidence: 'SOURCED',
		source: {
			name: 'KFF — Key Facts about the Uninsured Population',
			finding: 'Uninsured adults are far more likely to delay or forgo care and to carry medical debt; medical debt is a leading driver of US bankruptcy.',
			url: 'https://www.kff.org/uninsured/issue-brief/key-facts-about-the-uninsured-population/',
			accessed: ACCESSED
		},
		inputs: ['insured'],
		score: (i, w) => Math.round((i.insured ? 1 : 0) * w),
		describe: (i) => (i.insured ? 'covered — one uncapped downside risk removed' : 'uninsured — one ER visit can rewrite the whole financial section of this scorecard'),
		whatIf: {
			label: 'Get covered',
			applicable: (i) => !i.insured,
			transform: (i) => ({ ...i, insured: true })
		}
	},
	{
		id: 'bmi',
		domain: 'health',
		tier: 'your_moves',
		label: 'BMI band',
		controllable: true,
		defaultWeight: 6,
		logic: 'Insurers still price by BMI band, so it appears here — scored as they score it, not as an endorsement of the measure.',
		evidence: 'SOURCED',
		caveat: 'BMI is a blunt population statistic: it misclassifies muscular builds and ignores fat distribution. It is included because underwriters use it, not because it is good.',
		source: {
			name: 'CDC — About Adult BMI',
			finding: 'BMI bands (under 18.5 / 18.5–24.9 / 25–29.9 / 30+) correlate with metabolic-disease risk at population scale; CDC notes it is a screening tool, not a diagnostic.',
			url: 'https://www.cdc.gov/bmi/about/index.html',
			accessed: ACCESSED
		},
		inputs: ['bmiBand'],
		score: (i, w) => Math.round({ under: 0.5, normal: 1, over: 0.6, obese: 0.2 }[i.bmiBand] * w),
		describe: (i) => ({ under: 'underweight band — priced as risk by underwriters', normal: 'the band underwriters price cheapest', over: 'overweight band — a modest underwriting penalty', obese: 'obese band — a significant underwriting penalty' })[i.bmiBand]
	}
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/rulebook/health.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/rulebook && git commit -m "feat: health/actuarial domain rules"
```

---

### Task 5: Finance domain rules

**Files:**
- Create: `src/lib/rulebook/finance.ts`
- Test: `src/lib/rulebook/finance.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/rulebook/finance.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { FINANCE_RULES, medianNetWorthForAge } from './finance';
import { DEFAULT_INPUTS, expectRuleInvariants } from './rule-test-utils';

const byId = (id: string) => FINANCE_RULES.find((r) => r.id === id)!;

describe('finance rules', () => {
	it('satisfy universal invariants', () => {
		expect(FINANCE_RULES).toHaveLength(7);
		for (const r of FINANCE_RULES) {
			expectRuleInvariants(r);
			expect(r.domain).toBe('finance');
			expect(r.tier).toBe('your_moves');
		}
	});

	it('net worth medians are age-banded and increasing toward retirement', () => {
		expect(medianNetWorthForAge(27)).toBe(39000);
		expect(medianNetWorthForAge(50)).toBeGreaterThan(medianNetWorthForAge(30));
	});

	it('networth: above the age median scores positive, far below scores negative', () => {
		const r = byId('networth');
		expect(r.score({ ...DEFAULT_INPUTS, age: 27, netWorth: 100000 }, r.defaultWeight)).toBeGreaterThan(0);
		expect(r.score({ ...DEFAULT_INPUTS, age: 27, netWorth: -40000 }, r.defaultWeight)).toBeLessThan(0);
	});

	it('dti: more debt never raises the score; zero debt scores max', () => {
		const r = byId('dti');
		const s = (debt: number) => r.score({ ...DEFAULT_INPUTS, debt }, r.defaultWeight);
		expect(s(0)).toBe(r.defaultWeight);
		expect(s(10000)).toBeLessThan(s(0));
		expect(s(60000)).toBeLessThan(s(10000));
		expect(s(500000)).toBe(-r.defaultWeight); // clamped at -weight
	});

	it('dti handles zero income without dividing by zero', () => {
		const r = byId('dti');
		const v = r.score({ ...DEFAULT_INPUTS, income: 0, debt: 50000 }, r.defaultWeight);
		expect(Number.isFinite(v)).toBe(true);
		expect(v).toBe(-r.defaultWeight);
	});

	it('utilization: lower is better, very high goes negative', () => {
		const r = byId('utilization');
		const s = (u: number) => r.score({ ...DEFAULT_INPUTS, creditUtil: u }, r.defaultWeight);
		expect(s(5)).toBeGreaterThan(s(40));
		expect(s(95)).toBeLessThan(0);
	});

	it('emergency fund saturates at 3 months and has a lever', () => {
		const r = byId('emergency-fund');
		const s = (m: number) => r.score({ ...DEFAULT_INPUTS, emergencyMonths: m }, r.defaultWeight);
		expect(s(0)).toBe(0);
		expect(s(3)).toBe(r.defaultWeight);
		expect(s(12)).toBe(s(3));
		expect(r.whatIf!.applicable({ ...DEFAULT_INPUTS, emergencyMonths: 1 })).toBe(true);
		expect(r.whatIf!.transform({ ...DEFAULT_INPUTS, emergencyMonths: 1 }).emergencyMonths).toBe(3);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/rulebook/finance.test.ts`
Expected: FAIL — cannot resolve `./finance`.

- [ ] **Step 3: Implement finance.ts**

`src/lib/rulebook/finance.ts`:
```ts
import { clamp, usd, type Rule } from './types';

const ACCESSED = '2026-06-11';
const DTI_BENCHMARK = 0.43; // CFPB Qualified Mortgage affordability line
const MEDIAN_INCOME = 60000; // ≈ BLS median full-time earnings, annualized

// Fed SCF 2022: median household net worth by age band. [ageBelow, median]
const NW_MEDIANS: [number, number][] = [
	[35, 39000], [45, 135600], [55, 247200], [65, 364500], [75, 409900], [Infinity, 335600]
];

export const medianNetWorthForAge = (age: number): number =>
	NW_MEDIANS.find(([below]) => age < below)![1];

export const FINANCE_RULES: Rule[] = [
	{
		id: 'networth',
		domain: 'finance',
		tier: 'your_moves',
		label: 'Net-worth position',
		controllable: false, // your number now is partly past luck; the levers below move it
		defaultWeight: 16,
		logic: 'Net worth measured against the median for your age band, not in a vacuum. Above the age-median scores up; far below scores down.',
		evidence: 'SOURCED',
		source: {
			name: 'Federal Reserve — Survey of Consumer Finances (2022)',
			finding: 'Median net worth runs ~$39k for households under 35, rising to ~$410k for 65–74 — comparing a 27-year-old to a 60-year-old is meaningless.',
			url: 'https://www.federalreserve.gov/econres/scfindex.htm',
			accessed: ACCESSED
		},
		inputs: ['netWorth', 'age'],
		score: (i, w) => {
			const median = medianNetWorthForAge(i.age);
			return Math.round(clamp((i.netWorth - median) / (2 * median), -0.5, 1) * w);
		},
		describe: (i) => {
			const median = medianNetWorthForAge(i.age);
			const d = i.netWorth - median;
			return d >= 0
				? `${usd(i.netWorth)} — about ${usd(d)} above your age-band median (${usd(median)})`
				: `${usd(i.netWorth)} — ${usd(-d)} below your age-band median (${usd(median)})`;
		}
	},
	{
		id: 'dti',
		domain: 'finance',
		tier: 'your_moves',
		label: 'Debt load (DTI, not raw $)',
		controllable: true,
		defaultWeight: 14,
		logic: "Debt scored as leverage against income, benchmarked to the lending world's ~43% affordability line. Zero debt scores best; the same asset bought on a loan drags here.",
		evidence: 'SOURCED',
		source: {
			name: 'CFPB — Ability-to-Repay / Qualified Mortgage rule',
			finding: 'The long-standing affordability benchmark caps total debt-to-income at 43%. Lenders judge the ratio, not the sticker price of what you bought.',
			url: 'https://www.consumerfinance.gov/about-us/blog/qualified-mortgages-what-are-they-and-what-do-they-mean-for-you/',
			accessed: ACCESSED
		},
		inputs: ['debt', 'income'],
		score: (i, w) => {
			const ratio = i.income > 0 ? i.debt / i.income : i.debt > 0 ? Infinity : 0;
			return Math.round(clamp((DTI_BENCHMARK - ratio) / DTI_BENCHMARK, -1, 1) * w);
		},
		describe: (i) => {
			if (i.debt === 0) return 'no debt — a quiet advantage that never shows up on a paycheck';
			const ratio = i.income > 0 ? (i.debt / i.income).toFixed(2) : '∞';
			return `${usd(i.debt)} against ${usd(i.income)} income (ratio ${ratio}) — scored like a lender would`;
		},
		whatIf: {
			label: 'Clear the debt',
			applicable: (i) => i.debt > 0,
			transform: (i) => ({ ...i, debt: 0 })
		}
	},
	{
		id: 'payment-history',
		domain: 'finance',
		tier: 'your_moves',
		label: 'Payment history',
		controllable: true,
		defaultWeight: 12,
		logic: "The single heaviest input in FICO's published model (35%). One late payment costs most of it; multiple zero it out.",
		evidence: 'SOURCED',
		source: {
			name: 'myFICO — What’s in my FICO Scores?',
			finding: 'Payment history accounts for about 35% of a FICO score — the largest single component.',
			url: 'https://www.myfico.com/credit-education/whats-in-your-credit-score',
			accessed: ACCESSED
		},
		inputs: ['latePayments'],
		score: (i, w) => Math.round([1, 0.4, 0][i.latePayments] * w),
		describe: (i) => ['clean 24 months — the heaviest FICO input, fully banked', 'one recent late payment — FICO forgives slowly', 'multiple recent lates — the heaviest FICO input, zeroed'][i.latePayments]
	},
	{
		id: 'utilization',
		domain: 'finance',
		tier: 'your_moves',
		label: 'Credit utilization',
		controllable: true,
		defaultWeight: 10,
		logic: 'Share of available revolving credit in use — 30% of FICO. Under ~10% is ideal; over 30% starts costing; near-maxed goes negative.',
		evidence: 'SOURCED',
		source: {
			name: 'myFICO / Experian — credit utilization guidance',
			finding: 'Amounts owed are ~30% of a FICO score; commonly cited guidance keeps utilization below 30%, with top scorers in single digits.',
			url: 'https://www.experian.com/blogs/ask-experian/credit-education/score-basics/credit-utilization-rate/',
			accessed: ACCESSED
		},
		inputs: ['creditUtil'],
		score: (i, w) => {
			const u = i.creditUtil;
			const frac = u <= 9 ? 1 : u <= 30 ? 0.8 : u <= 50 ? 0.4 : u <= 80 ? 0.1 : -0.3;
			return Math.round(frac * w);
		},
		describe: (i) => `${i.creditUtil}% of available revolving credit in use — bureaus reprice this monthly`
	},
	{
		id: 'emergency-fund',
		domain: 'finance',
		tier: 'your_moves',
		label: 'Emergency fund',
		controllable: true,
		defaultWeight: 10,
		logic: "Months of expenses covered by liquid savings, scored against the standard 3-month test. Saturates at 3 — this measures shock absorption, not hoarding.",
		evidence: 'SOURCED',
		source: {
			name: 'Federal Reserve — Survey of Household Economics and Decisionmaking (SHED)',
			finding: 'A large share of US adults could not cover three months of expenses with savings; many could not cover a $400 emergency in cash.',
			url: 'https://www.federalreserve.gov/consumerscommunities/shed.htm',
			accessed: ACCESSED
		},
		inputs: ['emergencyMonths'],
		score: (i, w) => Math.round(clamp(i.emergencyMonths / 3, 0, 1) * w),
		describe: (i) => (i.emergencyMonths >= 3 ? `${i.emergencyMonths} months covered — the Fed's resilience test, passed` : `${i.emergencyMonths} month(s) covered — the 3-month line is the difference between a setback and a spiral`),
		whatIf: {
			label: 'Save a 3-month fund',
			applicable: (i) => i.emergencyMonths < 3,
			transform: (i) => ({ ...i, emergencyMonths: 3 })
		}
	},
	{
		id: 'income',
		domain: 'finance',
		tier: 'your_moves',
		label: 'Income vs. median',
		controllable: true,
		defaultWeight: 10,
		logic: 'Annual income against the US full-time median (~$60k). Saturates at 2× median — beyond that, income stops differentiating life outcomes in this model.',
		evidence: 'SOURCED',
		source: {
			name: 'BLS — Usual Weekly Earnings of Wage and Salary Workers',
			finding: 'Median usual weekly earnings of full-time workers, annualized, run near $60,000.',
			url: 'https://www.bls.gov/news.release/wkyeng.toc.htm',
			accessed: ACCESSED
		},
		inputs: ['income'],
		score: (i, w) => Math.round(clamp(i.income / (2 * MEDIAN_INCOME), 0, 1) * w),
		describe: (i) => `${usd(i.income)}/yr vs. the ~${usd(MEDIAN_INCOME)} full-time median`
	},
	{
		id: 'homeownership',
		domain: 'finance',
		tier: 'your_moves',
		label: 'Homeownership',
		controllable: true,
		defaultWeight: 6,
		logic: 'Owning is the dominant US wealth-building vehicle — and gatekept by everything above. Renters get partial credit; this measures system position, not virtue.',
		evidence: 'SOURCED',
		source: {
			name: 'Federal Reserve SCF — homeowner vs. renter net worth',
			finding: 'Median homeowner net worth (~$400k) is roughly 40× median renter net worth (~$10k) in the 2022 SCF.',
			url: 'https://www.federalreserve.gov/econres/scfindex.htm',
			accessed: ACCESSED
		},
		inputs: ['homeowner'],
		score: (i, w) => Math.round((i.homeowner ? 1 : 0.3) * w),
		describe: (i) => (i.homeowner ? 'owner — riding the main US wealth escalator' : 'renting — the 40× median-wealth gap is the system, not a verdict')
	}
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/rulebook/finance.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/rulebook && git commit -m "feat: finance/credit domain rules"
```

---

### Task 6: Education, social, and civic domain rules

**Files:**
- Create: `src/lib/rulebook/education.ts`, `src/lib/rulebook/social.ts`, `src/lib/rulebook/civic.ts`
- Test: `src/lib/rulebook/remaining-domains.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/rulebook/remaining-domains.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { CIVIC_RULES } from './civic';
import { EDUCATION_RULES } from './education';
import { DEFAULT_INPUTS, expectRuleInvariants } from './rule-test-utils';
import { SOCIAL_RULES } from './social';

const all = [...EDUCATION_RULES, ...SOCIAL_RULES, ...CIVIC_RULES];
const byId = (id: string) => all.find((r) => r.id === id)!;

describe('education / social / civic rules', () => {
	it('satisfy universal invariants and counts (3 + 5 + 2)', () => {
		expect(EDUCATION_RULES).toHaveLength(3);
		expect(SOCIAL_RULES).toHaveLength(5);
		expect(CIVIC_RULES).toHaveLength(2);
		for (const r of all) expectRuleInvariants(r);
	});

	it('degree: holding one scores higher; lever only when missing', () => {
		const r = byId('degree');
		const w = r.defaultWeight;
		expect(r.score({ ...DEFAULT_INPUTS, degree: true }, w)).toBeGreaterThan(
			r.score({ ...DEFAULT_INPUTS, degree: false }, w)
		);
		expect(r.whatIf!.applicable({ ...DEFAULT_INPUTS, degree: false })).toBe(true);
		expect(r.whatIf!.applicable({ ...DEFAULT_INPUTS, degree: true })).toBe(false);
	});

	it('social connection is monotonic (Holt-Lunstad)', () => {
		const r = byId('connection');
		const s = [0, 1, 2].map((c) => r.score({ ...DEFAULT_INPUTS, socialConnection: c as 0 | 1 | 2 }, r.defaultWeight));
		expect(s[0]).toBeLessThan(s[1]);
		expect(s[1]).toBeLessThan(s[2]);
	});

	it('driving: incidents only ever lower the score, floor is mildly negative', () => {
		const r = byId('driving');
		const s = (n: number) => r.score({ ...DEFAULT_INPUTS, drivingIncidents: n }, r.defaultWeight);
		expect(s(0)).toBeGreaterThan(s(1));
		expect(s(1)).toBeGreaterThan(s(3));
		expect(s(10)).toBeGreaterThanOrEqual(-r.defaultWeight);
	});

	it('digital footprint and voting access are flagged speculative', () => {
		expect(byId('digital').evidence).toBe('SPECULATIVE');
		expect(byId('voting').evidence).toBe('SPECULATIVE');
	});

	it('criminal record rule carries a systemic-bias caveat and partnership a selection caveat', () => {
		expect(byId('criminal-record').caveat).toBeTruthy();
		expect(byId('partnership').caveat).toBeTruthy();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/rulebook/remaining-domains.test.ts`
Expected: FAIL — cannot resolve `./education`.

- [ ] **Step 3: Implement the three domain files**

`src/lib/rulebook/education.ts`:
```ts
import type { Rule } from './types';

const ACCESSED = '2026-06-11';

export const EDUCATION_RULES: Rule[] = [
	{
		id: 'degree',
		domain: 'education',
		tier: 'your_moves',
		label: 'Degree attainment',
		controllable: true,
		defaultWeight: 12,
		logic: "Holding a degree raises modeled marketability, reflecting the measured earnings premium. 'Controllable' only if the time and tuition were affordable to you.",
		evidence: 'SOURCED',
		source: {
			name: 'BLS — Education pays',
			finding: "Among full-time workers 25–34, bachelor's-degree holders' median earnings run roughly 60% above high-school-only earnings.",
			url: 'https://www.bls.gov/careeroutlook/2025/data-on-display/education-pays.htm',
			accessed: ACCESSED
		},
		inputs: ['degree'],
		score: (i, w) => Math.round((i.degree ? 1 : 0.33) * w),
		describe: (i) => (i.degree ? 'degree held — the ~60% earnings premium is priced in' : 'no degree yet — see the what-if lever for the delta'),
		whatIf: {
			label: 'Finish a degree',
			applicable: (i) => !i.degree,
			transform: (i) => ({ ...i, degree: true })
		}
	},
	{
		id: 'employment',
		domain: 'education',
		tier: 'your_moves',
		label: 'Employment status',
		controllable: true,
		defaultWeight: 8,
		logic: 'Employed or self-employed scores full; students and retirees partial (different life phase, not failure); unemployed zero — which is how every lender reads it.',
		evidence: 'SOURCED',
		source: {
			name: 'BLS — Labor Force Statistics (CPS)',
			finding: 'Unemployment correlates with sharp income loss and scarring effects on future earnings, especially for long spells.',
			url: 'https://www.bls.gov/cps/',
			accessed: ACCESSED
		},
		inputs: ['employment'],
		score: (i, w) => Math.round({ employed: 1, self: 1, student: 0.6, retired: 0.7, unemployed: 0 }[i.employment] * w),
		describe: (i) => ({ employed: 'employed — steady income, the input every other system keys on', self: 'self-employed — same credit, more paperwork', student: 'student — partial credit; the system reads this as investment phase', retired: 'retired — drawing down rather than earning', unemployed: 'unemployed — the status every scoring system punishes hardest' })[i.employment]
	},
	{
		id: 'outlook',
		domain: 'education',
		tier: 'your_moves',
		label: 'Occupation outlook',
		controllable: true,
		defaultWeight: 6,
		logic: "Whether your field is projected to grow or shrink — BLS publishes ten-year projections for every occupation. Self-assessed band here.",
		evidence: 'SOURCED',
		source: {
			name: 'BLS — Occupational Outlook Handbook',
			finding: 'Projects employment change by occupation over a 10-year window; growth varies from double-digit increases to steep declines.',
			url: 'https://www.bls.gov/ooh/',
			accessed: ACCESSED
		},
		inputs: ['outlook'],
		score: (i, w) => Math.round({ declining: 0.2, stable: 0.6, growing: 1 }[i.outlook] * w),
		describe: (i) => ({ declining: 'a shrinking field — the projection, not a prophecy', stable: 'a stable field', growing: 'a growing field — demand tailwind' })[i.outlook]
	}
];
```

`src/lib/rulebook/social.ts`:
```ts
import type { Rule } from './types';

const ACCESSED = '2026-06-11';

export const SOCIAL_RULES: Rule[] = [
	{
		id: 'connection',
		domain: 'social',
		tier: 'your_moves',
		label: 'Social connection',
		controllable: true,
		defaultWeight: 10,
		logic: 'Regular contact with people you are close to. The mortality effect of isolation rivals smoking in meta-analysis — the most underpriced rule in this book.',
		evidence: 'SOURCED',
		source: {
			name: 'Holt-Lunstad et al. — Social Relationships and Mortality Risk (meta-analysis)',
			finding: 'Stronger social relationships associated with ~50% increased odds of survival — an effect comparable to quitting smoking.',
			url: 'https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1000316',
			accessed: ACCESSED
		},
		inputs: ['socialConnection'],
		score: (i, w) => Math.round([0.1, 0.5, 1][i.socialConnection] * w),
		describe: (i) => ['rarely see people you are close to — the meta-analysis prices this like a pack-a-day habit', 'some regular contact', 'regular close contact — a mortality hedge nobody invoices you for'][i.socialConnection]
	},
	{
		id: 'partnership',
		domain: 'social',
		tier: 'your_moves',
		label: 'Partnership status',
		controllable: true,
		defaultWeight: 6,
		logic: 'Married/partnered people show better longevity and household finances in the data — partly pooling, partly selection.',
		evidence: 'SOURCED',
		caveat: 'Selection effects are real: healthier, wealthier people marry more. The data cannot fully separate cause from sorting, and single is not a deficit — this scores the system, not you.',
		source: {
			name: 'Harvard Health / NIH — marriage and longevity research',
			finding: 'Married adults show lower mortality and cardiovascular risk in large cohorts, with effect sizes that shrink after controlling for selection.',
			url: 'https://www.health.harvard.edu/staying-healthy/marriage-and-mens-health',
			accessed: ACCESSED
		},
		inputs: ['partnered'],
		score: (i, w) => Math.round((i.partnered ? 1 : 0.5) * w),
		describe: (i) => (i.partnered ? 'partnered — pooled risk, pooled rent' : 'single — half credit, and the caveat on this rule matters')
	},
	{
		id: 'volunteering',
		domain: 'social',
		tier: 'your_moves',
		label: 'Volunteering / community',
		controllable: true,
		defaultWeight: 4,
		logic: 'Regular volunteering correlates with health and well-being outcomes — and is the closest thing to a real-world "social karma" ledger.',
		evidence: 'SOURCED',
		source: {
			name: 'AmeriCorps — Health Benefits of Volunteering',
			finding: 'Volunteers report better health and lower depression; older volunteers show reduced mortality in longitudinal studies.',
			url: 'https://americorps.gov/about/our-impact/evidence-research',
			accessed: ACCESSED
		},
		inputs: ['volunteers'],
		score: (i, w) => Math.round((i.volunteers ? 1 : 0.4) * w),
		describe: (i) => (i.volunteers ? 'regular volunteer — the one score here you donate your way into' : 'no regular volunteering — partial credit, not a demerit')
	},
	{
		id: 'driving',
		domain: 'social',
		tier: 'your_moves',
		label: 'Driving record',
		controllable: true,
		defaultWeight: 6,
		logic: 'At-fault accidents and moving violations in the last 3 years, scored the way an auto insurer rates you. Clean record full; each incident bites.',
		evidence: 'SOURCED',
		source: {
			name: 'Insurance Information Institute — What determines the price of an auto insurance policy?',
			finding: 'Driving record is a primary rating factor; accidents and violations raise premiums for 3–5 years.',
			url: 'https://www.iii.org/article/what-determines-price-my-auto-insurance-policy',
			accessed: ACCESSED
		},
		inputs: ['drivingIncidents'],
		score: (i, w) => Math.round(Math.max(1 - i.drivingIncidents * 0.4, -0.2) * w),
		describe: (i) => (i.drivingIncidents === 0 ? 'clean record — the cheapest insurance tier' : `${i.drivingIncidents} incident(s) in 3 years — your insurer has already done this math`)
	},
	{
		id: 'digital',
		domain: 'social',
		tier: 'your_moves',
		label: 'Digital footprint',
		controllable: true,
		defaultWeight: 4,
		logic: 'Employers and landlords screen public profiles, but no public dataset quantifies the effect on outcomes — so the weight is a flagged guess.',
		evidence: 'SPECULATIVE',
		source: {
			name: 'Harvard Business School / CareerBuilder screening surveys',
			finding: 'Majorities of employers report screening candidates online and rejecting some on what they find — survey evidence, not an outcome dataset. Hence speculative.',
			url: 'https://www.press.careerbuilder.com/2018-08-09-More-Than-Half-of-Employers-Have-Found-Content-on-Social-Media-That-Caused-Them-NOT-to-Hire-a-Candidate-According-to-Recent-CareerBuilder-Survey',
			accessed: ACCESSED
		},
		inputs: ['digitalFootprint'],
		score: (i, w) => Math.round([0.2, 0.6, 1][i.digitalFootprint] * w),
		describe: (i) => ['a public footprint that screens badly — recruiters do look', 'an unremarkable public footprint', 'a curated public footprint — passive credentialing'][i.digitalFootprint]
	}
];
```

`src/lib/rulebook/civic.ts`:
```ts
import type { Rule } from './types';

const ACCESSED = '2026-06-11';

export const CIVIC_RULES: Rule[] = [
	{
		id: 'criminal-record',
		domain: 'civic',
		tier: 'your_moves',
		label: 'Criminal record',
		controllable: true,
		defaultWeight: 8,
		logic: 'A record roughly halves employer callbacks in audit studies. Scored as the labor market scores it — which is exactly the kind of opaque penalty this app exists to expose.',
		evidence: 'SOURCED',
		caveat: 'Enforcement and conviction rates are themselves racially and economically skewed, so this rule inherits that bias from the system it measures. Shown because the penalty is real, not because it is just.',
		source: {
			name: 'Pager — The Mark of a Criminal Record (audit study)',
			finding: 'Matched-pair audits found a criminal record cut employer callbacks by ~50%, with effects compounding across race.',
			url: 'https://www.journals.uchicago.edu/doi/10.1086/374403',
			accessed: ACCESSED
		},
		inputs: ['criminalRecord'],
		score: (i, w) => Math.round((i.criminalRecord ? 0 : 1) * w),
		describe: (i) => (i.criminalRecord ? 'record present — the callback penalty is measured and brutal' : 'no record — full marks on a gate most people never see')
	},
	{
		id: 'voting',
		domain: 'civic',
		tier: 'your_moves',
		label: 'Voter registration',
		controllable: true,
		defaultWeight: 4,
		logic: 'Registered voters appear in civic data used by campaigns, jury pools, and some tenant screens; the personal-outcome effect is unquantified — flagged guess.',
		evidence: 'SPECULATIVE',
		source: {
			name: 'US Census — Voting and Registration tables',
			finding: 'Registration rates are tracked demographically, but no public dataset ties individual registration to life outcomes. Hence speculative.',
			url: 'https://www.census.gov/topics/public-sector/voting.html',
			accessed: ACCESSED
		},
		inputs: ['voterRegistered'],
		score: (i, w) => Math.round((i.voterRegistered ? 1 : 0.4) * w),
		describe: (i) => (i.voterRegistered ? 'registered — present in the civic ledger' : 'not registered — absent from the civic ledger')
	}
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/rulebook/remaining-domains.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/rulebook && git commit -m "feat: education, social, and civic domain rules"
```

---

### Task 7: Rulebook aggregate index

**Files:**
- Create: `src/lib/rulebook/index.ts`
- Test: `src/lib/rulebook/index.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/rulebook/index.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { DOMAINS, RULES, TIERS } from './index';

describe('rulebook aggregate', () => {
	it('contains all 29 rules with unique ids', () => {
		expect(RULES).toHaveLength(29);
		expect(new Set(RULES.map((r) => r.id)).size).toBe(29);
	});

	it('every rule belongs to a declared domain and tier', () => {
		for (const r of RULES) {
			expect(DOMAINS[r.domain]).toBeDefined();
			expect(TIERS[r.tier]).toBeDefined();
		}
	});

	it('every domain has at least one rule', () => {
		for (const d of Object.keys(DOMAINS)) {
			expect(RULES.some((r) => r.domain === d), d).toBe(true);
		}
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/rulebook/index.test.ts`
Expected: FAIL — `./index` has no exports.

- [ ] **Step 3: Implement index.ts**

`src/lib/rulebook/index.ts`:
```ts
import { CIVIC_RULES } from './civic';
import { EDUCATION_RULES } from './education';
import { FINANCE_RULES } from './finance';
import { HEALTH_RULES } from './health';
import { ORIGIN_RULES } from './origin';
import { SOCIAL_RULES } from './social';
import type { Domain, Rule, Tier } from './types';

export const RULES: Rule[] = [
	...ORIGIN_RULES,
	...HEALTH_RULES,
	...FINANCE_RULES,
	...EDUCATION_RULES,
	...SOCIAL_RULES,
	...CIVIC_RULES
];

export const TIERS: Record<Tier, { label: string; sub: string; accent: string }> = {
	starting_point: {
		label: 'Your starting point',
		sub: 'mostly out of your hands — luck of where and to whom you were born',
		accent: 'var(--start)'
	},
	your_moves: {
		label: 'Your moves',
		sub: "things you've actually influenced — where motivation lives",
		accent: 'var(--moves)'
	}
};

export const DOMAINS: Record<Domain, { label: string; blurb: string }> = {
	origin: { label: 'Origin', blurb: 'where and to whom you were born' },
	health: { label: 'Health / actuarial', blurb: 'how a life insurer prices you' },
	finance: { label: 'Finance / credit', blurb: 'how lenders and bureaus score you' },
	education: { label: 'Education / work', blurb: 'how the labor market values you' },
	social: { label: 'Social', blurb: 'connection, record, and footprint' },
	civic: { label: 'Civic / legal', blurb: 'how institutional ledgers read you' }
};

export * from './inputs';
export * from './types';
```

- [ ] **Step 4: Run full test suite**

Run: `npm test`
Expected: ALL PASS across inputs, origin, health, finance, remaining-domains, index.

- [ ] **Step 5: Commit**

```bash
git add src/lib/rulebook && git commit -m "feat: rulebook aggregate with tier and domain metadata"
```

---

### Task 8: Scoring engine

**Files:**
- Create: `src/lib/engine/score.ts`
- Test: `src/lib/engine/score.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/engine/score.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS, RULES } from '../rulebook';
import { computeScore } from './score';

describe('computeScore', () => {
	it('produces one entry per rule and consistent totals', () => {
		const r = computeScore(DEFAULT_INPUTS);
		expect(r.perRule).toHaveLength(RULES.length);
		const sum = r.perRule.filter((p) => p.enabled).reduce((a, p) => a + p.value, 0);
		expect(r.composite).toBe(sum);
		expect(r.tierSubtotals.starting_point + r.tierSubtotals.your_moves).toBe(r.composite);
		const domainSum = Object.values(r.domainSubtotals).reduce((a, b) => a + b, 0);
		expect(domainSum).toBe(r.composite);
	});

	it('weight override scales a rule; enabled:false excludes it from totals but keeps the row', () => {
		const base = computeScore(DEFAULT_INPUTS);
		const doubled = computeScore(DEFAULT_INPUTS, { country: { weight: 48 } });
		const baseCountry = base.perRule.find((p) => p.id === 'country')!;
		const dblCountry = doubled.perRule.find((p) => p.id === 'country')!;
		expect(dblCountry.value).toBe(baseCountry.value * 2);
		expect(dblCountry.max).toBe(48);

		const disabled = computeScore(DEFAULT_INPUTS, { country: { enabled: false } });
		const row = disabled.perRule.find((p) => p.id === 'country')!;
		expect(row.enabled).toBe(false);
		expect(disabled.composite).toBe(base.composite - baseCountry.value);
	});

	it('clamps raw inputs before scoring', () => {
		const r = computeScore({ ...DEFAULT_INPUTS, age: 9999, creditUtil: -50 });
		expect(r.perRule.every((p) => Number.isFinite(p.value))).toBe(true);
	});

	it('what-ifs: only applicable levers appear, and applying one reproduces the delta', () => {
		const inputs = { ...DEFAULT_INPUTS, debt: 20000, degree: false };
		const r = computeScore(inputs);
		const ids = r.whatIfs.map((w) => w.ruleId);
		expect(ids).toContain('dti'); // has debt → clear-the-debt lever
		expect(ids).toContain('degree');
		expect(ids).not.toContain('smoking'); // default is never-smoker

		const clear = r.whatIfs.find((w) => w.ruleId === 'dti')!;
		const after = computeScore({ ...inputs, debt: 0 });
		expect(clear.delta).toBe(after.composite - r.composite);
		expect(clear.delta).toBeGreaterThan(0);
	});

	it('a disabled rule contributes no what-if lever', () => {
		const inputs = { ...DEFAULT_INPUTS, debt: 20000 };
		const r = computeScore(inputs, { dti: { enabled: false } });
		expect(r.whatIfs.map((w) => w.ruleId)).not.toContain('dti');
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/engine/score.test.ts`
Expected: FAIL — cannot resolve `./score`.

- [ ] **Step 3: Implement score.ts**

`src/lib/engine/score.ts`:
```ts
import { clampInputs, RULES } from '../rulebook';
import type { Domain, Evidence, Inputs, Tier } from '../rulebook';

export interface RuleOverride {
	weight?: number;
	enabled?: boolean;
}
export type Overrides = Partial<Record<string, RuleOverride>>;

export interface RuleScore {
	id: string;
	label: string;
	domain: Domain;
	tier: Tier;
	evidence: Evidence;
	controllable: boolean;
	value: number;
	max: number;
	enabled: boolean;
	description: string;
}

export interface WhatIfDelta {
	ruleId: string;
	label: string;
	delta: number;
}

export interface ScoreResult {
	perRule: RuleScore[];
	tierSubtotals: Record<Tier, number>;
	domainSubtotals: Record<Domain, number>;
	composite: number;
	whatIfs: WhatIfDelta[];
}

const MAX_WEIGHT = 50;

function compositeOf(inputs: Inputs, overrides: Overrides): number {
	let total = 0;
	for (const rule of RULES) {
		const o = overrides[rule.id];
		if (o?.enabled === false) continue;
		total += rule.score(inputs, clampWeight(o?.weight ?? rule.defaultWeight));
	}
	return total;
}

const clampWeight = (w: number) => Math.max(0, Math.min(MAX_WEIGHT, w));

export function computeScore(rawInputs: Inputs, overrides: Overrides = {}): ScoreResult {
	const inputs = clampInputs(rawInputs);
	const tierSubtotals: Record<Tier, number> = { starting_point: 0, your_moves: 0 };
	const domainSubtotals = { origin: 0, health: 0, finance: 0, education: 0, social: 0, civic: 0 };

	const perRule: RuleScore[] = RULES.map((rule) => {
		const o = overrides[rule.id];
		const enabled = o?.enabled !== false;
		const max = clampWeight(o?.weight ?? rule.defaultWeight);
		const value = rule.score(inputs, max);
		if (enabled) {
			tierSubtotals[rule.tier] += value;
			domainSubtotals[rule.domain] += value;
		}
		return {
			id: rule.id, label: rule.label, domain: rule.domain, tier: rule.tier,
			evidence: rule.evidence, controllable: rule.controllable,
			value, max, enabled, description: rule.describe(inputs)
		};
	});

	const composite = tierSubtotals.starting_point + tierSubtotals.your_moves;

	const whatIfs: WhatIfDelta[] = RULES.filter(
		(r) => r.whatIf && overrides[r.id]?.enabled !== false && r.whatIf.applicable(inputs)
	).map((r) => ({
		ruleId: r.id,
		label: r.whatIf!.label,
		delta: compositeOf(r.whatIf!.transform(inputs), overrides) - composite
	}));

	return { perRule, tierSubtotals, domainSubtotals, composite, whatIfs };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/engine/score.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/engine && git commit -m "feat: pure scoring engine with overrides and what-if deltas"
```

---

### Task 9: Share codec (profile ⇄ URL fragment)

**Files:**
- Create: `src/lib/share/codec.ts`
- Test: `src/lib/share/codec.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/share/codec.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS } from '../rulebook';
import { decodeProfile, encodeProfile } from './codec';

describe('share codec', () => {
	it('round-trips a profile', async () => {
		const profile = {
			inputs: { ...DEFAULT_INPUTS, netWorth: 123456, country: 'br' as const },
			overrides: { country: { weight: 30 }, dti: { enabled: false } }
		};
		const encoded = await encodeProfile(profile);
		expect(encoded).toMatch(/^1\.[A-Za-z0-9_-]+$/); // versioned, url-safe
		const decoded = await decodeProfile(encoded);
		expect(decoded).toEqual(profile);
	});

	it('returns null for unknown versions, garbage, and empty input', async () => {
		const good = await encodeProfile({ inputs: DEFAULT_INPUTS, overrides: {} });
		expect(await decodeProfile('9.' + good.slice(2))).toBeNull();
		expect(await decodeProfile('1.!!!not-base64!!!')).toBeNull();
		expect(await decodeProfile('1.AAAA')).toBeNull(); // valid b64, invalid deflate
		expect(await decodeProfile('')).toBeNull();
	});

	it('produces URLs meaningfully shorter than raw JSON', async () => {
		const profile = { inputs: DEFAULT_INPUTS, overrides: {} };
		const encoded = await encodeProfile(profile);
		expect(encoded.length).toBeLessThan(JSON.stringify(profile).length);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/share/codec.test.ts`
Expected: FAIL — cannot resolve `./codec`.

- [ ] **Step 3: Implement codec.ts**

Uses native `CompressionStream` (browsers, CF Workers, Node 18+ — no dependency).

`src/lib/share/codec.ts`:
```ts
import type { Overrides } from '../engine/score';
import type { Inputs } from '../rulebook';

export interface Profile {
	inputs: Inputs;
	overrides: Overrides;
}

const VERSION = '1';

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
	const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
	return new Uint8Array(await new Response(out).arrayBuffer());
}

const toB64url = (bytes: Uint8Array) =>
	btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');

function fromB64url(s: string): Uint8Array {
	const b64 = s.replaceAll('-', '+').replaceAll('_', '/');
	return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export async function encodeProfile(profile: Profile): Promise<string> {
	const json = new TextEncoder().encode(JSON.stringify(profile));
	const deflated = await pipe(json, new CompressionStream('deflate-raw'));
	return `${VERSION}.${toB64url(deflated)}`;
}

export async function decodeProfile(encoded: string): Promise<Profile | null> {
	try {
		const dot = encoded.indexOf('.');
		if (dot < 0 || encoded.slice(0, dot) !== VERSION) return null;
		const bytes = fromB64url(encoded.slice(dot + 1));
		const inflated = await pipe(bytes, new DecompressionStream('deflate-raw'));
		const parsed = JSON.parse(new TextDecoder().decode(inflated));
		if (!parsed || typeof parsed.inputs !== 'object' || typeof parsed.overrides !== 'object') return null;
		return parsed as Profile;
	} catch {
		return null;
	}
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/share/codec.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/share && git commit -m "feat: versioned deflate+base64url profile share codec"
```

---

### Task 10: Quantizer + local fallback narrative

**Files:**
- Create: `src/lib/engine/quantize.ts`, `src/lib/narrative/local.ts`
- Test: `src/lib/engine/quantize.test.ts`, `src/lib/narrative/local.test.ts`

- [ ] **Step 1: Write the failing tests**

`src/lib/engine/quantize.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS } from '../rulebook';
import { quantizeForNarrative } from './quantize';
import { computeScore } from './score';

describe('quantizeForNarrative', () => {
	it('rounds all subtotals to nearest 5 and sorts lever ids', () => {
		const result = computeScore({ ...DEFAULT_INPUTS, debt: 20000 });
		const q = quantizeForNarrative(result);
		expect(q.v).toBe(1);
		for (const v of [...Object.values(q.domains), q.tiers.starting_point, q.tiers.your_moves]) {
			expect(v % 5).toBe(0);
		}
		expect(q.levers).toEqual([...q.levers].sort());
	});

	it('nearby profiles land in the same bucket (cache efficiency)', () => {
		const a = quantizeForNarrative(computeScore({ ...DEFAULT_INPUTS, netWorth: 6000 }));
		const b = quantizeForNarrative(computeScore({ ...DEFAULT_INPUTS, netWorth: 6400 }));
		expect(a).toEqual(b);
	});
});
```

`src/lib/narrative/local.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS } from '../rulebook';
import { computeScore } from '../engine/score';
import { composeLocalNarrative } from './local';

describe('composeLocalNarrative', () => {
	it('mentions the strongest and weakest enabled rules and stays prose-length', () => {
		const result = computeScore({ ...DEFAULT_INPUTS, debt: 30000 });
		const text = composeLocalNarrative(result);
		const sorted = [...result.perRule].filter((p) => p.enabled).sort((a, b) => b.value / b.max - a.value / a.max);
		expect(text).toContain(sorted[0].label);
		expect(text).toContain(sorted[sorted.length - 1].label);
		expect(text.length).toBeGreaterThan(100);
		expect(text.length).toBeLessThan(1200);
	});

	it('mentions the biggest available lever when one exists', () => {
		const result = computeScore({ ...DEFAULT_INPUTS, debt: 30000 });
		const best = [...result.whatIfs].sort((a, b) => b.delta - a.delta)[0];
		expect(composeLocalNarrative(result)).toContain(best.label);
	});

	it('is deterministic', () => {
		const result = computeScore(DEFAULT_INPUTS);
		expect(composeLocalNarrative(result)).toBe(composeLocalNarrative(result));
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/engine/quantize.test.ts src/lib/narrative/local.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement both modules**

`src/lib/engine/quantize.ts`:
```ts
import type { Domain, Tier } from '../rulebook';
import type { ScoreResult } from './score';

export interface NarrativePayload {
	v: 1;
	domains: Record<Domain, number>;
	tiers: Record<Tier, number>;
	levers: string[];
}

const to5 = (n: number) => Math.round(n / 5) * 5;

export function quantizeForNarrative(result: ScoreResult): NarrativePayload {
	const domains = Object.fromEntries(
		Object.entries(result.domainSubtotals).map(([d, v]) => [d, to5(v)])
	) as Record<Domain, number>;
	return {
		v: 1,
		domains,
		tiers: {
			starting_point: to5(result.tierSubtotals.starting_point),
			your_moves: to5(result.tierSubtotals.your_moves)
		},
		levers: result.whatIfs.map((w) => w.ruleId).sort()
	};
}
```

`src/lib/narrative/local.ts`:
```ts
import type { ScoreResult } from '../engine/score';

/** Deterministic narrative from rule descriptions — used when AI is unavailable. */
export function composeLocalNarrative(result: ScoreResult): string {
	const enabled = result.perRule.filter((p) => p.enabled && p.max > 0);
	const byStrength = [...enabled].sort((a, b) => b.value / b.max - a.value / a.max);
	const strongest = byStrength[0];
	const weakest = byStrength[byStrength.length - 1];
	const start = result.tierSubtotals.starting_point;
	const moves = result.tierSubtotals.your_moves;

	const parts = [
		`Your starting point contributes ${start} points and your own moves contribute ${moves} — the split matters more than the ${result.composite} total.`,
		`Your strongest position is ${strongest.label}: ${strongest.description}.`,
		`The biggest drag is ${weakest.label}: ${weakest.description}.`
	];

	const best = [...result.whatIfs].sort((a, b) => b.delta - a.delta)[0];
	if (best && best.delta > 0) {
		parts.push(`Of the levers you control, “${best.label}” moves the most: +${best.delta} points. A delta, not a destiny.`);
	}
	return parts.join(' ');
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/engine/quantize.test.ts src/lib/narrative/local.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/engine src/lib/narrative && git commit -m "feat: narrative quantizer and deterministic local narrative"
```

---

### Task 11: Narrative server handler (KV cache + Gemini + guards)

**Files:**
- Create: `src/lib/server/narrative.ts`, `src/routes/api/narrative/+server.ts`
- Test: `src/lib/server/narrative.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/server/narrative.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest';
import type { NarrativePayload } from '../engine/quantize';
import { handleNarrative, type KVLike } from './narrative';

const PAYLOAD: NarrativePayload = {
	v: 1,
	domains: { origin: 40, health: 35, finance: 30, education: 15, social: 20, civic: 10 },
	tiers: { starting_point: 55, your_moves: 95 },
	levers: ['dti', 'emergency-fund']
};

function memKV(): KVLike & { store: Map<string, string> } {
	const store = new Map<string, string>();
	return {
		store,
		get: async (k) => store.get(k) ?? null,
		put: async (k, v) => void store.set(k, v)
	};
}

const geminiOk = (text: string) =>
	vi.fn(async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status: 200 }));

const deps = (kv: KVLike, fetchFn: typeof fetch) => ({
	kv, fetchFn, apiKey: 'test-key', today: () => '2026-06-11'
});

describe('handleNarrative', () => {
	it('rejects malformed payloads', async () => {
		const r = await handleNarrative({ nope: true }, '1.2.3.4', deps(memKV(), geminiOk('x')));
		expect(r).toEqual({ fallback: true });
	});

	it('cache miss calls Gemini once, stores, then hits cache without calling again', async () => {
		const kv = memKV();
		const fetchFn = geminiOk('Your score story.');
		const first = await handleNarrative(PAYLOAD, '1.2.3.4', deps(kv, fetchFn));
		expect(first).toEqual({ text: 'Your score story.' });
		expect(fetchFn).toHaveBeenCalledTimes(1);
		expect([...kv.store.keys()].some((k) => k.startsWith('narr:'))).toBe(true);

		const second = await handleNarrative(PAYLOAD, '5.6.7.8', deps(kv, fetchFn));
		expect(second).toEqual({ text: 'Your score story.' });
		expect(fetchFn).toHaveBeenCalledTimes(1); // cached
	});

	it('identical payloads hash identically regardless of key order', async () => {
		const kv = memKV();
		const fetchFn = geminiOk('once');
		await handleNarrative(PAYLOAD, '1.1.1.1', deps(kv, fetchFn));
		const reordered = JSON.parse(JSON.stringify(PAYLOAD));
		reordered.domains = Object.fromEntries(Object.entries(PAYLOAD.domains).reverse());
		await handleNarrative(reordered, '1.1.1.1', deps(kv, fetchFn));
		expect(fetchFn).toHaveBeenCalledTimes(1);
	});

	it('falls back on Gemini error and does not cache the failure', async () => {
		const kv = memKV();
		const bad = vi.fn(async () => new Response('quota', { status: 429 }));
		const r = await handleNarrative(PAYLOAD, '1.2.3.4', deps(kv, bad));
		expect(r).toEqual({ fallback: true });
		expect([...kv.store.keys()].some((k) => k.startsWith('narr:'))).toBe(false);
	});

	it('falls back when no API key is configured', async () => {
		const r = await handleNarrative(PAYLOAD, '1.2.3.4', { ...deps(memKV(), geminiOk('x')), apiKey: undefined });
		expect(r).toEqual({ fallback: true });
	});

	it('enforces the per-IP daily limit (10)', async () => {
		const kv = memKV();
		const fetchFn = geminiOk('hi');
		const d = deps(kv, fetchFn);
		for (let n = 0; n < 10; n++) {
			// vary payload so each request is a cache miss
			const p = { ...PAYLOAD, tiers: { ...PAYLOAD.tiers, your_moves: n * 5 } };
			expect('text' in (await handleNarrative(p, '9.9.9.9', d))).toBe(true);
		}
		const p11 = { ...PAYLOAD, tiers: { ...PAYLOAD.tiers, your_moves: 990 } };
		expect(await handleNarrative(p11, '9.9.9.9', d)).toEqual({ fallback: true });
	});

	it('enforces the global daily Gemini budget (200 calls)', async () => {
		const kv = memKV();
		kv.store.set('budget:2026-06-11', '200');
		const fetchFn = geminiOk('hi');
		const r = await handleNarrative(PAYLOAD, '1.2.3.4', deps(kv, fetchFn));
		expect(r).toEqual({ fallback: true });
		expect(fetchFn).not.toHaveBeenCalled();
	});

	it('budget guard still serves cache hits', async () => {
		const kv = memKV();
		const fetchFn = geminiOk('cached story');
		await handleNarrative(PAYLOAD, '1.2.3.4', deps(kv, fetchFn));
		kv.store.set('budget:2026-06-11', '200');
		const r = await handleNarrative(PAYLOAD, '5.5.5.5', deps(kv, fetchFn));
		expect(r).toEqual({ text: 'cached story' });
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/server/narrative.test.ts`
Expected: FAIL — cannot resolve `./narrative`.

- [ ] **Step 3: Implement the handler**

`src/lib/server/narrative.ts`:
```ts
import type { NarrativePayload } from '../engine/quantize';

export interface KVLike {
	get(key: string): Promise<string | null>;
	put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
}

export interface NarrativeDeps {
	kv: KVLike;
	apiKey: string | undefined;
	fetchFn: typeof fetch;
	today(): string; // 'YYYY-MM-DD' — injected so tests control the clock
}

export type NarrativeResponse = { text: string } | { fallback: true };

const CACHE_TTL = 60 * 60 * 24 * 30; // 30 days
const COUNTER_TTL = 60 * 60 * 48;
const IP_DAILY_LIMIT = 10;
const GLOBAL_DAILY_BUDGET = 200; // Gemini calls/day — well under free tier
const GEMINI_URL =
	'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

const DOMAIN_ORDER = ['origin', 'health', 'finance', 'education', 'social', 'civic'] as const;

function validate(body: unknown): NarrativePayload | null {
	const b = body as NarrativePayload;
	if (!b || b.v !== 1 || !b.domains || !b.tiers || !Array.isArray(b.levers)) return null;
	const nums = [...DOMAIN_ORDER.map((d) => b.domains[d]), b.tiers.starting_point, b.tiers.your_moves];
	if (!nums.every((n) => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= 10000)) return null;
	if (b.levers.length > 20 || !b.levers.every((l) => typeof l === 'string' && l.length < 40)) return null;
	return b;
}

/** Canonical, key-order-independent serialization for hashing. */
function canonical(p: NarrativePayload): string {
	return JSON.stringify([
		p.v,
		DOMAIN_ORDER.map((d) => p.domains[d]),
		[p.tiers.starting_point, p.tiers.your_moves],
		[...p.levers].sort()
	]);
}

async function sha256(s: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function buildPrompt(p: NarrativePayload): string {
	const domains = DOMAIN_ORDER.map((d) => `${d}: ${p.domains[d]}`).join(', ');
	return [
		'You are the narrator for "Life Score", an app that exposes how existing systems (credit scores, actuarial tables, audit studies) turn a life into a number — for transparency, never judgment.',
		'Write a plain-language narrative of at most 150 words for this anonymous score profile. No greetings, no headers, no bullet points, no advice-column tone. Address the reader as "you".',
		`Tier subtotals — starting point (luck of birth): ${p.tiers.starting_point}; your moves (things influenced): ${p.tiers.your_moves}.`,
		`Domain subtotals: ${domains}.`,
		p.levers.length
			? `Available improvement levers (rule ids): ${p.levers.join(', ')}. Mention the spirit of at most two.`
			: 'No improvement levers are currently available.',
		'Close with one sentence reminding the reader these weights are visible, editable, and arguable in the app.'
	].join('\n');
}

export async function handleNarrative(
	body: unknown,
	ip: string,
	deps: NarrativeDeps
): Promise<NarrativeResponse> {
	const payload = validate(body);
	if (!payload) return { fallback: true };

	const hash = await sha256(canonical(payload));
	const cacheKey = `narr:${hash}`;
	const cached = await deps.kv.get(cacheKey);
	if (cached) return { text: cached };

	if (!deps.apiKey) return { fallback: true };

	const day = deps.today();
	const ipKey = `rl:${ip}:${day}`;
	const budgetKey = `budget:${day}`;
	const ipCount = Number((await deps.kv.get(ipKey)) ?? '0');
	if (ipCount >= IP_DAILY_LIMIT) return { fallback: true };
	const budget = Number((await deps.kv.get(budgetKey)) ?? '0');
	if (budget >= GLOBAL_DAILY_BUDGET) return { fallback: true };

	// Count the attempt before calling: fail toward fallback, never toward unmetered calls.
	await deps.kv.put(ipKey, String(ipCount + 1), { expirationTtl: COUNTER_TTL });
	await deps.kv.put(budgetKey, String(budget + 1), { expirationTtl: COUNTER_TTL });

	try {
		const res = await deps.fetchFn(`${GEMINI_URL}?key=${deps.apiKey}`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				contents: [{ parts: [{ text: buildPrompt(payload) }] }],
				generationConfig: { temperature: 0.4, maxOutputTokens: 400 }
			})
		});
		if (!res.ok) return { fallback: true };
		const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
		const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
		if (!text) return { fallback: true };
		await deps.kv.put(cacheKey, text, { expirationTtl: CACHE_TTL });
		return { text };
	} catch {
		return { fallback: true };
	}
}
```

`src/routes/api/narrative/+server.ts`:
```ts
import { json } from '@sveltejs/kit';
import { handleNarrative } from '$lib/server/narrative';
import type { RequestHandler } from './$types';

export const prerender = false;

export const POST: RequestHandler = async ({ request, platform, getClientAddress }) => {
	const env = platform?.env;
	if (!env?.NARRATIVE_KV) return json({ fallback: true });
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ fallback: true });
	}
	const result = await handleNarrative(body, getClientAddress(), {
		kv: env.NARRATIVE_KV,
		apiKey: env.GEMINI_API_KEY,
		fetchFn: fetch,
		today: () => new Date().toISOString().slice(0, 10)
	});
	return json(result);
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/server/narrative.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/server src/routes/api && git commit -m "feat: narrative endpoint with KV cache, rate limits, and Gemini budget guard"
```

---

### Task 12: Narrative client + profile store

**Files:**
- Create: `src/lib/narrative/client.ts`, `src/lib/state/profile.svelte.ts`
- Test: `src/lib/narrative/client.test.ts`, `src/lib/state/profile.test.ts`

- [ ] **Step 1: Write the failing tests**

`src/lib/narrative/client.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_INPUTS } from '../rulebook';
import { computeScore } from '../engine/score';
import { fetchNarrative } from './client';

const result = computeScore(DEFAULT_INPUTS);

describe('fetchNarrative', () => {
	it('returns AI text when the endpoint responds with text', async () => {
		const fetchFn = vi.fn(async () => new Response(JSON.stringify({ text: 'ai says' }), { status: 200 }));
		expect(await fetchNarrative(result, fetchFn as typeof fetch)).toEqual({ text: 'ai says', source: 'ai' });
	});

	it('falls back locally on fallback flag, HTTP error, and network error', async () => {
		for (const fetchFn of [
			vi.fn(async () => new Response(JSON.stringify({ fallback: true }), { status: 200 })),
			vi.fn(async () => new Response('boom', { status: 500 })),
			vi.fn(async () => { throw new Error('offline'); })
		]) {
			const r = await fetchNarrative(result, fetchFn as unknown as typeof fetch);
			expect(r.source).toBe('local');
			expect(r.text.length).toBeGreaterThan(50);
		}
	});
});
```

`src/lib/state/profile.test.ts` (persistence helpers are plain functions — testable without Svelte):
```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS } from '../rulebook';
import { loadStoredProfile, storeProfile } from './profile.svelte';

function memStorage(): Storage {
	const m = new Map<string, string>();
	return {
		getItem: (k) => m.get(k) ?? null,
		setItem: (k, v) => void m.set(k, v),
		removeItem: (k) => void m.delete(k),
		clear: () => m.clear(),
		key: () => null,
		get length() { return m.size; }
	} as Storage;
}

describe('profile persistence', () => {
	it('round-trips through storage', () => {
		const s = memStorage();
		const profile = { inputs: { ...DEFAULT_INPUTS, age: 44 }, overrides: { bmi: { enabled: false } } };
		storeProfile(s, profile);
		expect(loadStoredProfile(s)).toEqual(profile);
	});

	it('returns defaults for missing or corrupt storage', () => {
		const s = memStorage();
		expect(loadStoredProfile(s)).toEqual({ inputs: DEFAULT_INPUTS, overrides: {} });
		s.setItem('lifescore:profile', '{corrupt');
		expect(loadStoredProfile(s)).toEqual({ inputs: DEFAULT_INPUTS, overrides: {} });
	});

	it('merges stored inputs over defaults so new fields get default values', () => {
		const s = memStorage();
		s.setItem('lifescore:profile', JSON.stringify({ inputs: { age: 50 }, overrides: {} }));
		const p = loadStoredProfile(s);
		expect(p.inputs.age).toBe(50);
		expect(p.inputs.country).toBe(DEFAULT_INPUTS.country);
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/narrative/client.test.ts src/lib/state/profile.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement both modules**

`src/lib/narrative/client.ts`:
```ts
import { quantizeForNarrative } from '../engine/quantize';
import type { ScoreResult } from '../engine/score';
import { composeLocalNarrative } from './local';

export interface Narrative {
	text: string;
	source: 'ai' | 'local';
}

export async function fetchNarrative(result: ScoreResult, fetchFn: typeof fetch = fetch): Promise<Narrative> {
	try {
		const res = await fetchFn('/api/narrative', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(quantizeForNarrative(result))
		});
		if (res.ok) {
			const data = (await res.json()) as { text?: string; fallback?: boolean };
			if (data.text) return { text: data.text, source: 'ai' };
		}
	} catch {
		// fall through to local
	}
	return { text: composeLocalNarrative(result), source: 'local' };
}
```

`src/lib/state/profile.svelte.ts`:
```ts
import type { Profile } from '../share/codec';
import { DEFAULT_INPUTS } from '../rulebook';

const KEY = 'lifescore:profile';

export function loadStoredProfile(storage: Storage | null): Profile {
	const fresh: Profile = { inputs: { ...DEFAULT_INPUTS }, overrides: {} };
	if (!storage) return fresh;
	try {
		const raw = storage.getItem(KEY);
		if (!raw) return fresh;
		const parsed = JSON.parse(raw) as Partial<Profile>;
		return {
			inputs: { ...DEFAULT_INPUTS, ...(parsed.inputs ?? {}) },
			overrides: parsed.overrides ?? {}
		};
	} catch {
		return fresh;
	}
}

export function storeProfile(storage: Storage | null, profile: Profile): void {
	try {
		storage?.setItem(KEY, JSON.stringify(profile));
	} catch {
		// storage unavailable (private mode, quota) — app stays in-memory
	}
}

/** Svelte 5 runes store. Instantiate once in the layout; pass via context or import. */
export function createProfileState(initial: Profile) {
	let inputs = $state(initial.inputs);
	let overrides = $state(initial.overrides);
	return {
		get inputs() { return inputs; },
		get overrides() { return overrides; },
		setInput<K extends keyof Profile['inputs']>(key: K, value: Profile['inputs'][K]) {
			inputs = { ...inputs, [key]: value };
		},
		setOverride(ruleId: string, patch: { weight?: number; enabled?: boolean }) {
			overrides = { ...overrides, [ruleId]: { ...overrides[ruleId], ...patch } };
		},
		resetOverrides() { overrides = {}; },
		replace(profile: Profile) { inputs = profile.inputs; overrides = profile.overrides; },
		snapshot(): Profile { return { inputs, overrides }; }
	};
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: ALL PASS (entire suite so far).

- [ ] **Step 5: Commit**

```bash
git add src/lib/narrative src/lib/state && git commit -m "feat: narrative client with local fallback and persistent profile store"
```

---

### Task 13: UI primitives

**Files:** Create in `src/lib/ui/`: `Tag.svelte`, `Bar.svelte`, `ScoreRow.svelte`, `SectionHead.svelte`, `Field.svelte`, `NumInput.svelte`, `SelectInput.svelte`, `Toggle.svelte`, `Lever.svelte`, `Callout.svelte`

All components are Svelte 5 (runes, `$props()`). Styling follows the spike: CSS variables from `app.css`, Tailwind utilities for layout, mono font for numbers. No scoring logic in components — they render values handed to them.

- [ ] **Step 1: Implement the primitives**

`src/lib/ui/Tag.svelte`:
```svelte
<script lang="ts">
	let { kind }: { kind: 'SOURCED' | 'SPECULATIVE' } = $props();
	const sourced = $derived(kind === 'SOURCED');
</script>

<span
	class="rounded-sm border px-1.5 py-0.5 text-[9px] font-bold tracking-[0.12em]"
	style:font-family="var(--font-mono)"
	style:background={sourced ? 'rgba(111,191,150,0.14)' : 'rgba(216,168,92,0.14)'}
	style:color={sourced ? 'var(--sourced)' : 'var(--spec)'}
	style:border-color={sourced ? 'rgba(111,191,150,0.35)' : 'rgba(216,168,92,0.35)'}
>{kind}</span>
```

`src/lib/ui/Bar.svelte`:
```svelte
<script lang="ts">
	let { value, max, accent }: { value: number; max: number; accent: string } = $props();
	const pct = $derived(max > 0 ? Math.max(0, Math.min(100, (Math.abs(value) / max) * 100)) : 0);
</script>

<div class="h-1.5 w-full rounded-full" style:background="rgba(255,255,255,0.06)">
	<div
		class="h-1.5 rounded-full transition-all duration-500"
		style:width="{pct}%"
		style:background={value < 0 ? '#c0604d' : accent}
	></div>
</div>
```

`src/lib/ui/ScoreRow.svelte`:
```svelte
<script lang="ts">
	import type { RuleScore } from '$lib/engine/score';
	import Bar from './Bar.svelte';
	import Tag from './Tag.svelte';

	let { row, accent }: { row: RuleScore; accent: string } = $props();
</script>

<div class="border-b py-3" style:border-color="var(--line)" style:opacity={row.enabled ? 1 : 0.4}>
	<div class="mb-1.5 flex items-baseline justify-between gap-3">
		<div class="flex min-w-0 items-center gap-2">
			<span class="text-[13.5px]" style:color="var(--ink)">{row.label}</span>
			<Tag kind={row.evidence} />
			{#if !row.enabled}
				<span class="text-[9px]" style:font-family="var(--font-mono)" style:color="var(--ink-dim)">EXCLUDED BY YOU</span>
			{/if}
		</div>
		<span class="shrink-0 text-[13px] tabular-nums" style:font-family="var(--font-mono)" style:color={accent}>
			{row.value >= 0 ? '+' : ''}{row.value}
		</span>
	</div>
	<Bar value={row.value} max={row.max} {accent} />
	<div class="mt-1.5 text-[11px] leading-snug" style:color="var(--ink-dim)">{row.description}</div>
</div>
```

`src/lib/ui/SectionHead.svelte`:
```svelte
<script lang="ts">
	let { label, sub, accent, subtotal }: { label: string; sub: string; accent: string; subtotal: number } = $props();
</script>

<div class="mt-1 mb-1 flex items-baseline justify-between gap-3">
	<div>
		<span class="text-[15px] font-semibold" style:font-family="var(--font-display)" style:color={accent}>{label}</span>
		<span class="ml-2 text-[11px]" style:color="var(--ink-dim)">{sub}</span>
	</div>
	<span class="shrink-0 text-[13px] tabular-nums" style:font-family="var(--font-mono)" style:color={accent}>
		{subtotal >= 0 ? '+' : ''}{subtotal}
	</span>
</div>
```

`src/lib/ui/Field.svelte`:
```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';
	let { label, children }: { label: string; children: Snippet } = $props();
</script>

<label class="flex flex-col gap-1">
	<span class="text-[10px] tracking-[0.1em] uppercase" style:font-family="var(--font-mono)" style:color="var(--ink-dim)">{label}</span>
	{@render children()}
</label>
```

`src/lib/ui/NumInput.svelte`:
```svelte
<script lang="ts">
	let {
		value = $bindable(),
		step = 1000,
		prefix = '$',
		suffix = ''
	}: { value: number; step?: number; prefix?: string; suffix?: string } = $props();
</script>

<div class="flex items-center text-[13px]" style:color="var(--ink)">
	{#if prefix}<span style:color="var(--ink-dim)">{prefix}</span>{/if}
	<input
		type="number"
		bind:value
		{step}
		class="ml-0.5 w-full bg-transparent tabular-nums outline-none"
		style:font-family="var(--font-mono)"
	/>
	{#if suffix}<span class="text-[10px]" style:color="var(--ink-dim)">{suffix}</span>{/if}
</div>
```

`src/lib/ui/SelectInput.svelte`:
```svelte
<script lang="ts">
	let {
		value = $bindable(),
		opts
	}: { value: string | number; opts: [string | number, string][] } = $props();
</script>

<select bind:value class="w-full bg-transparent text-[13px] outline-none" style:color="var(--ink)">
	{#each opts as [k, label] (k)}
		<option value={k} style:background="var(--panel)">{label}</option>
	{/each}
</select>
```

`src/lib/ui/Toggle.svelte`:
```svelte
<script lang="ts">
	let { value = $bindable(), onLabel = 'Yes', offLabel = 'No' }: { value: boolean; onLabel?: string; offLabel?: string } = $props();
</script>

<button
	type="button"
	class="text-left text-[13px]"
	style:color={value ? 'var(--moves)' : 'var(--ink-dim)'}
	onclick={() => (value = !value)}
>{value ? onLabel : offLabel} ▸</button>
```

`src/lib/ui/Lever.svelte`:
```svelte
<script lang="ts">
	let { active, label, delta, onclick }: { active: boolean; label: string; delta: number; onclick: () => void } = $props();
</script>

<button
	type="button"
	class="rounded-full border px-3 py-1.5 text-[12px] transition-all"
	style:font-family="var(--font-mono)"
	style:background={active ? 'rgba(217,164,65,0.16)' : 'transparent'}
	style:color={active ? 'var(--moves)' : 'var(--ink-dim)'}
	style:border-color={active ? 'rgba(217,164,65,0.5)' : 'var(--line)'}
	{onclick}
>{active ? '● ' : '○ '}{label} <span class="tabular-nums">+{delta}</span></button>
```

`src/lib/ui/Callout.svelte`:
```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';
	let { title, children }: { title: string; children: Snippet } = $props();
</script>

<div class="mt-4 rounded-lg p-3.5" style:background="rgba(217,164,65,0.08)" style:border="1px solid rgba(217,164,65,0.25)">
	<div class="mb-1 text-[11px] tracking-[0.12em]" style:font-family="var(--font-mono)" style:color="var(--moves)">{title}</div>
	<div class="text-[13.5px] leading-snug" style:color="var(--ink)">{@render children()}</div>
</div>
```

- [ ] **Step 2: Verify**

Run: `npm run check`
Expected: 0 errors, 0 warnings.

- [ ] **Step 3: Commit**

```bash
git add src/lib/ui && git commit -m "feat: UI primitives in the spike's visual language"
```

---

### Task 14: Layout + Score page

**Files:**
- Create: `src/routes/+layout.svelte`, `src/lib/ui/InputsPanel.svelte`, `src/lib/ui/NarrativeCard.svelte`, `src/lib/ui/ShareButton.svelte`
- Modify: `src/routes/+page.svelte` (replace scaffold placeholder)

- [ ] **Step 1: Implement the layout (nav + shared profile state via context)**

`src/routes/+layout.svelte`:
```svelte
<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { setContext } from 'svelte';
	import { createProfileState, loadStoredProfile, storeProfile } from '$lib/state/profile.svelte';
	import { decodeProfile } from '$lib/share/codec';

	let { children } = $props();

	const profile = createProfileState(loadStoredProfile(browser ? localStorage : null));
	setContext('profile', profile);

	let shareNotice = $state<'ok' | 'bad' | null>(null);

	// Imported share links: #p=1.<payload>
	$effect(() => {
		if (!browser) return;
		const hash = location.hash;
		if (!hash.startsWith('#p=')) return;
		decodeProfile(hash.slice(3)).then((decoded) => {
			if (decoded) {
				profile.replace(decoded);
				shareNotice = 'ok';
			} else {
				shareNotice = 'bad';
			}
			history.replaceState(null, '', location.pathname);
		});
	});

	// Persist on every change.
	$effect(() => {
		storeProfile(browser ? localStorage : null, profile.snapshot());
	});

	const links = [
		['/', 'Score'],
		['/rulebook', 'Rulebook'],
		['/about', 'Why']
	];
</script>

<div class="mx-auto w-full max-w-[760px] px-5 pt-7 pb-10">
	<header class="mb-1 flex flex-wrap items-end justify-between gap-2">
		<h1 class="text-[30px] leading-none font-semibold tracking-[-0.01em]" style:font-family="var(--font-display)">
			Life Score
		</h1>
		<nav class="flex gap-1">
			{#each links as [href, label] (href)}
				<a
					{href}
					class="rounded-full border px-3 py-1 text-[12px] transition-all"
					style:font-family="var(--font-mono)"
					style:background={page.url.pathname === href ? 'rgba(255,255,255,0.08)' : 'transparent'}
					style:color={page.url.pathname === href ? 'var(--ink)' : 'var(--ink-dim)'}
					style:border-color={page.url.pathname === href ? 'rgba(255,255,255,0.2)' : 'var(--line)'}
				>{label}</a>
			{/each}
		</nav>
	</header>

	{#if shareNotice === 'ok'}
		<button class="mb-2 text-[11px]" style:color="var(--sourced)" onclick={() => (shareNotice = null)}>
			Loaded a shared profile — it stays on this device. dismiss ×
		</button>
	{:else if shareNotice === 'bad'}
		<button class="mb-2 text-[11px]" style:color="var(--spec)" onclick={() => (shareNotice = null)}>
			Couldn't read that share link — showing defaults. dismiss ×
		</button>
	{/if}

	{@render children()}
</div>
```

- [ ] **Step 2: Implement InputsPanel, NarrativeCard, ShareButton**

`src/lib/ui/InputsPanel.svelte` (domain-grouped, progressive disclosure — core fields always visible, the rest behind "add detail"):
```svelte
<script lang="ts">
	import { COUNTRIES } from '$lib/rulebook';
	import type { createProfileState } from '$lib/state/profile.svelte';
	import Field from './Field.svelte';
	import NumInput from './NumInput.svelte';
	import SelectInput from './SelectInput.svelte';
	import Toggle from './Toggle.svelte';

	let { profile }: { profile: ReturnType<typeof createProfileState> } = $props();
	let expanded = $state(false);

	// bind: helpers — components bind to these proxies, writes route through setInput
	function field<K extends keyof typeof profile.inputs>(key: K) {
		return {
			get value() { return profile.inputs[key]; },
			set value(v) { profile.setInput(key, v); }
		};
	}
	const countryOpts = Object.entries(COUNTRIES).map(([k, v]) => [k, v.name]) as [string, string][];
	const f = {
		country: field('country'), familySupport: field('familySupport'), age: field('age'),
		sex: field('sex'), income: field('income'), netWorth: field('netWorth'), debt: field('debt'),
		degree: field('degree'), parentsDegree: field('parentsDegree'), neighborhood: field('neighborhood'),
		smoker: field('smoker'), exerciseMins: field('exerciseMins'), alcohol: field('alcohol'),
		sleepHours: field('sleepHours'), insured: field('insured'), bmiBand: field('bmiBand'),
		latePayments: field('latePayments'), creditUtil: field('creditUtil'),
		emergencyMonths: field('emergencyMonths'), homeowner: field('homeowner'),
		employment: field('employment'), outlook: field('outlook'),
		socialConnection: field('socialConnection'), partnered: field('partnered'),
		volunteers: field('volunteers'), drivingIncidents: field('drivingIncidents'),
		digitalFootprint: field('digitalFootprint'), criminalRecord: field('criminalRecord'),
		voterRegistered: field('voterRegistered')
	};
</script>

<div class="mb-5 rounded-lg p-3.5" style:background="var(--panel)" style:border="1px solid var(--line)">
	<div class="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
		<Field label="Country"><SelectInput bind:value={f.country.value} opts={countryOpts} /></Field>
		<Field label="Age"><NumInput bind:value={f.age.value} step={1} prefix="" /></Field>
		<Field label="Family support"><SelectInput bind:value={f.familySupport.value} opts={[[0, 'None'], [1, 'Some'], [2, 'Substantial']]} /></Field>
		<Field label="Income / yr"><NumInput bind:value={f.income.value} /></Field>
		<Field label="Net worth"><NumInput bind:value={f.netWorth.value} /></Field>
		<Field label="Total debt"><NumInput bind:value={f.debt.value} /></Field>
		<Field label="Has degree"><Toggle bind:value={f.degree.value} /></Field>
		<Field label="Smoker"><SelectInput bind:value={f.smoker.value} opts={[['never', 'Never'], ['former', 'Former'], ['current', 'Current']]} /></Field>
	</div>

	<button class="mt-3 text-[11px]" style:font-family="var(--font-mono)" style:color="var(--ink-dim)" onclick={() => (expanded = !expanded)}>
		{expanded ? '− less detail' : '+ add detail (21 more inputs — each one feeds a cited rule)'}
	</button>

	{#if expanded}
		<div class="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-3 sm:grid-cols-3" style:border-color="var(--line)">
			<Field label="Sex (actuarial)"><SelectInput bind:value={f.sex.value} opts={[['f', 'Female'], ['m', 'Male']]} /></Field>
			<Field label="Parent has degree"><Toggle bind:value={f.parentsDegree.value} /></Field>
			<Field label="Grew up in"><SelectInput bind:value={f.neighborhood.value} opts={[[0, 'Low-opportunity area'], [1, 'Average area'], [2, 'High-opportunity area']]} /></Field>
			<Field label="Exercise min/wk"><NumInput bind:value={f.exerciseMins.value} step={15} prefix="" /></Field>
			<Field label="Alcohol"><SelectInput bind:value={f.alcohol.value} opts={[['none', 'None'], ['moderate', 'Moderate'], ['heavy', 'Heavy']]} /></Field>
			<Field label="Sleep hrs/night"><NumInput bind:value={f.sleepHours.value} step={1} prefix="" /></Field>
			<Field label="Health insured"><Toggle bind:value={f.insured.value} /></Field>
			<Field label="BMI band"><SelectInput bind:value={f.bmiBand.value} opts={[['under', 'Underweight'], ['normal', 'Normal'], ['over', 'Overweight'], ['obese', 'Obese']]} /></Field>
			<Field label="Late payments 24mo"><SelectInput bind:value={f.latePayments.value} opts={[[0, 'None'], [1, 'One'], [2, 'Multiple']]} /></Field>
			<Field label="Credit util %"><NumInput bind:value={f.creditUtil.value} step={5} prefix="" suffix="%" /></Field>
			<Field label="Emergency fund (months)"><NumInput bind:value={f.emergencyMonths.value} step={1} prefix="" /></Field>
			<Field label="Homeowner"><Toggle bind:value={f.homeowner.value} /></Field>
			<Field label="Employment"><SelectInput bind:value={f.employment.value} opts={[['employed', 'Employed'], ['self', 'Self-employed'], ['student', 'Student'], ['retired', 'Retired'], ['unemployed', 'Unemployed']]} /></Field>
			<Field label="Field outlook"><SelectInput bind:value={f.outlook.value} opts={[['declining', 'Declining'], ['stable', 'Stable'], ['growing', 'Growing']]} /></Field>
			<Field label="See close people"><SelectInput bind:value={f.socialConnection.value} opts={[[0, 'Rarely'], [1, 'Sometimes'], [2, 'Regularly']]} /></Field>
			<Field label="Partnered"><Toggle bind:value={f.partnered.value} /></Field>
			<Field label="Volunteers"><Toggle bind:value={f.volunteers.value} /></Field>
			<Field label="Driving incidents 3y"><NumInput bind:value={f.drivingIncidents.value} step={1} prefix="" /></Field>
			<Field label="Public footprint"><SelectInput bind:value={f.digitalFootprint.value} opts={[[0, 'Screens badly'], [1, 'Neutral'], [2, 'Curated']]} /></Field>
			<Field label="Criminal record"><Toggle bind:value={f.criminalRecord.value} /></Field>
			<Field label="Registered to vote"><Toggle bind:value={f.voterRegistered.value} /></Field>
		</div>
	{/if}
</div>
```

`src/lib/ui/NarrativeCard.svelte`:
```svelte
<script lang="ts">
	import type { ScoreResult } from '$lib/engine/score';
	import { fetchNarrative, type Narrative } from '$lib/narrative/client';

	let { result }: { result: ScoreResult } = $props();
	let narrative = $state<Narrative | null>(null);
	let loading = $state(false);

	async function generate() {
		loading = true;
		narrative = await fetchNarrative(result);
		loading = false;
	}
</script>

<div class="mt-5 rounded-lg p-3.5" style:background="var(--panel)" style:border="1px solid var(--line)">
	<div class="mb-1 flex items-center justify-between">
		<div class="text-[11px] tracking-[0.12em]" style:font-family="var(--font-mono)" style:color="var(--ink-dim)">
			IN PLAIN LANGUAGE
			{#if narrative?.source === 'ai'}<span class="ml-2" style:color="var(--sourced)">AI</span>{/if}
		</div>
		<button
			class="rounded-full border px-3 py-1 text-[11px]"
			style:font-family="var(--font-mono)"
			style:color="var(--ink-dim)"
			style:border-color="var(--line)"
			disabled={loading}
			onclick={generate}
		>{loading ? '…' : narrative ? 'regenerate' : 'tell me the story'}</button>
	</div>
	{#if narrative}
		<p class="text-[13.5px] leading-snug" style:color="var(--ink)">{narrative.text}</p>
		{#if narrative.source === 'local'}
			<p class="mt-1 text-[10px]" style:color="var(--ink-dim)">composed locally from the rulebook — the AI narrator wasn't needed or wasn't available</p>
		{/if}
	{:else}
		<p class="text-[12px] italic" style:color="var(--ink-dim)">A short narrative of what the numbers above are actually saying. Only rounded subtotals ever leave your device.</p>
	{/if}
</div>
```

`src/lib/ui/ShareButton.svelte`:
```svelte
<script lang="ts">
	import { encodeProfile, type Profile } from '$lib/share/codec';

	let { profile }: { profile: Profile } = $props();
	let copied = $state(false);

	async function share() {
		const encoded = await encodeProfile(profile);
		const url = `${location.origin}/#p=${encoded}`;
		await navigator.clipboard.writeText(url);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<button
	class="rounded-full border px-3 py-1 text-[11px]"
	style:font-family="var(--font-mono)"
	style:color={copied ? 'var(--sourced)' : 'var(--ink-dim)'}
	style:border-color="var(--line)"
	onclick={share}
>{copied ? 'link copied ✓' : 'share — inputs travel in the link, not to a server'}</button>
```

- [ ] **Step 3: Implement the Score page**

`src/routes/+page.svelte`:
```svelte
<script lang="ts">
	import { getContext } from 'svelte';
	import { computeScore } from '$lib/engine/score';
	import { RULES, TIERS, type Tier } from '$lib/rulebook';
	import type { createProfileState } from '$lib/state/profile.svelte';
	import Callout from '$lib/ui/Callout.svelte';
	import InputsPanel from '$lib/ui/InputsPanel.svelte';
	import Lever from '$lib/ui/Lever.svelte';
	import NarrativeCard from '$lib/ui/NarrativeCard.svelte';
	import ScoreRow from '$lib/ui/ScoreRow.svelte';
	import SectionHead from '$lib/ui/SectionHead.svelte';
	import ShareButton from '$lib/ui/ShareButton.svelte';

	const profile = getContext<ReturnType<typeof createProfileState>>('profile');

	let activeLevers = $state<string[]>([]);

	const baseResult = $derived(computeScore(profile.inputs, profile.overrides));

	// Effective inputs after applying active what-if levers (transforms live on RULES).
	const effective = $derived(
		RULES.filter((r) => r.whatIf && activeLevers.includes(r.id)).reduce(
			(inputs, r) => r.whatIf!.transform(inputs),
			profile.inputs
		)
	);
	const result = $derived(computeScore(effective, profile.overrides));
	const moveDelta = $derived(result.composite - baseResult.composite);

	const tierKeys = Object.keys(TIERS) as Tier[];

	function toggleLever(id: string) {
		activeLevers = activeLevers.includes(id) ? activeLevers.filter((l) => l !== id) : [...activeLevers, id];
	}
</script>

<div class="mt-1 mb-4 flex items-start justify-between gap-4">
	<p class="max-w-[540px] text-[12.5px] leading-snug" style:color="var(--ink-dim)">
		Not a verdict on your worth — a look at how existing systems would position you, every weight shown.
		The composite below is the least useful number here; the breakdown is the point.
	</p>
	<div class="text-right">
		<div class="text-[10px] tracking-[0.14em]" style:font-family="var(--font-mono)" style:color="var(--ink-dim)">COMPOSITE</div>
		<div class="text-[26px] font-bold tabular-nums" style:font-family="var(--font-mono)">{result.composite}</div>
	</div>
</div>

<InputsPanel {profile} />

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
	<ShareButton profile={profile.snapshot()} />
</div>
```

- [ ] **Step 4: Verify**

Run: `npm run check && npm run build`
Expected: 0 errors; build succeeds. Then `npm run dev` and confirm by loading http://localhost:5173: inputs render, score updates live, levers toggle, share button copies a `#p=1.` URL that reloads correctly in a fresh tab.

- [ ] **Step 5: Commit**

```bash
git add src/routes src/lib/ui && git commit -m "feat: layout with shared profile state and the score page"
```

---

### Task 15: Rulebook page (citations + weight editor)

**Files:**
- Create: `src/lib/ui/RuleCard.svelte`, `src/routes/rulebook/+page.svelte`

- [ ] **Step 1: Implement RuleCard**

`src/lib/ui/RuleCard.svelte`:
```svelte
<script lang="ts">
	import type { RuleOverride } from '$lib/engine/score';
	import { TIERS, type Rule } from '$lib/rulebook';
	import Tag from './Tag.svelte';

	let {
		rule,
		override,
		onOverride
	}: {
		rule: Rule;
		override: RuleOverride | undefined;
		onOverride: (patch: RuleOverride) => void;
	} = $props();

	const accent = $derived(TIERS[rule.tier].accent);
	const weight = $derived(override?.weight ?? rule.defaultWeight);
	const enabled = $derived(override?.enabled !== false);
	const modified = $derived(weight !== rule.defaultWeight || !enabled);
</script>

<div class="mb-2 rounded-lg p-3.5" style:background="var(--panel)" style:border="1px solid var(--line)" style:opacity={enabled ? 1 : 0.55}>
	<div class="mb-1.5 flex items-center justify-between gap-2">
		<div class="flex flex-wrap items-center gap-2">
			<span class="text-[14px] font-semibold" style:font-family="var(--font-display)" style:color="var(--ink)">{rule.label}</span>
			<Tag kind={rule.evidence} />
			{#if rule.controllable}
				<span class="rounded-sm border px-1.5 py-0.5 text-[9px]" style:font-family="var(--font-mono)" style:color="var(--moves)" style:border-color="rgba(217,164,65,0.35)">CONTROLLABLE</span>
			{/if}
			{#if modified}
				<span class="text-[9px]" style:font-family="var(--font-mono)" style:color="var(--spec)">EDITED BY YOU</span>
			{/if}
		</div>
		<span class="shrink-0 text-[11px] tabular-nums" style:font-family="var(--font-mono)" style:color={accent}>±{weight}</span>
	</div>

	<div class="mb-2 text-[12.5px] leading-snug" style:color="var(--ink)">{rule.logic}</div>

	{#if rule.caveat}
		<div class="mb-2 text-[11px] leading-snug italic" style:color="var(--spec)">Caveat: {rule.caveat}</div>
	{/if}

	<div class="mb-3 pl-2.5 text-[11px] leading-snug" style:border-left="2px solid {accent}" style:color="var(--ink-dim)">
		<span style:color="var(--ink)">{rule.source.name}.</span>
		{rule.source.finding}
		<a href={rule.source.url} target="_blank" rel="noreferrer" style:color={accent} class="underline">source ↗</a>
		<span class="ml-1">(accessed {rule.source.accessed})</span>
	</div>

	<div class="flex items-center gap-3">
		<input
			type="range"
			min="0"
			max="50"
			value={weight}
			class="h-1 w-40 accent-[var(--moves)]"
			oninput={(e) => onOverride({ weight: Number(e.currentTarget.value) })}
		/>
		<span class="text-[10px] tabular-nums" style:font-family="var(--font-mono)" style:color="var(--ink-dim)">weight {weight}</span>
		<button
			class="ml-auto text-[10px]"
			style:font-family="var(--font-mono)"
			style:color={enabled ? 'var(--ink-dim)' : 'var(--spec)'}
			onclick={() => onOverride({ enabled: !enabled })}
		>{enabled ? 'exclude from my score' : 'excluded — include again'}</button>
	</div>
</div>
```

- [ ] **Step 2: Implement the Rulebook page**

`src/routes/rulebook/+page.svelte`:
```svelte
<script lang="ts">
	import { getContext } from 'svelte';
	import { DOMAINS, RULES, type Domain } from '$lib/rulebook';
	import type { createProfileState } from '$lib/state/profile.svelte';
	import RuleCard from '$lib/ui/RuleCard.svelte';

	const profile = getContext<ReturnType<typeof createProfileState>>('profile');
	const domainKeys = Object.keys(DOMAINS) as Domain[];
	const edited = $derived(Object.keys(profile.overrides).length > 0);
</script>

<p class="mt-1 mb-2 max-w-[560px] text-[12.5px] leading-snug" style:color="var(--ink-dim)">
	The whole pile of business rules, in one place. Each rule states its logic in plain English, declares whether
	it's <span style:color="var(--sourced)">sourced</span> or a flagged <span style:color="var(--spec)">guess</span>,
	and links the public evidence behind it. The weights are editorial — so edit them. Your weighting travels with
	your share link.
</p>

{#if edited}
	<button
		class="mb-3 rounded-full border px-3 py-1 text-[11px]"
		style:font-family="var(--font-mono)"
		style:color="var(--spec)"
		style:border-color="var(--line)"
		onclick={() => profile.resetOverrides()}
	>reset all weights to the cited defaults</button>
{/if}

{#each domainKeys as d (d)}
	<div class="mt-4 mb-1">
		<span class="text-[13px] font-semibold" style:font-family="var(--font-display)" style:color="var(--ink)">{DOMAINS[d].label}</span>
		<span class="ml-2 text-[11px]" style:color="var(--ink-dim)">{DOMAINS[d].blurb}</span>
	</div>
	{#each RULES.filter((r) => r.domain === d) as rule (rule.id)}
		<RuleCard
			{rule}
			override={profile.overrides[rule.id]}
			onOverride={(patch) => profile.setOverride(rule.id, patch)}
		/>
	{/each}
{/each}
```

- [ ] **Step 3: Verify**

Run: `npm run check && npm run build`
Expected: clean. In `npm run dev`: dragging a weight slider on `/rulebook` changes the `±` readout and the score on `/`; excluding a rule greys it on both pages; reset restores defaults.

- [ ] **Step 4: Commit**

```bash
git add src/lib/ui/RuleCard.svelte src/routes/rulebook && git commit -m "feat: rulebook page with citations, weight editor, and rule exclusion"
```

---

### Task 16: About page

**Files:** Create: `src/routes/about/+page.svelte`

- [ ] **Step 1: Implement**

`src/routes/about/+page.svelte`:
```svelte
<script lang="ts">
	import { RULES } from '$lib/rulebook';
	const sourced = RULES.filter((r) => r.evidence === 'SOURCED').length;
	const speculative = RULES.length - sourced;
</script>

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
```

- [ ] **Step 2: Verify**

Run: `npm run check && npm run build`
Expected: clean; `/about` lists all 29 sources with working links.

- [ ] **Step 3: Commit**

```bash
git add src/routes/about && git commit -m "feat: about page with manifesto, exclusions, and full source list"
```

---

### Task 17: Source URL verification, README, deploy

**Files:** Create: `README.md`. Modify: any rulebook file whose URL fails verification.

- [ ] **Step 1: Verify every cited URL resolves**

Run this and eyeball the status column — every URL should return 200 (or 301/302 to a real page; follow and update the rule's `url` to the final destination if it redirects):

```bash
grep -ho "https://[^']*" src/lib/rulebook/*.ts | sort -u | while read url; do
  code=$(curl -s -o /dev/null -w '%{http_code}' -L --max-time 15 -A 'Mozilla/5.0' "$url")
  echo "$code  $url"
done
```

Expected: every line starts with 200. For any 404/410: find the source's current canonical URL (the publisher's site search), update the rule file, and re-run `npm test`.

- [ ] **Step 2: Write README.md**

```markdown
# Life Score

You are already a number — a credit score, an actuarial row, a callback probability.
This app rebuilds those numbers in the open: every rule cited or flagged as a guess,
every weight visible and editable. Transparency, not judgment.

## Stack

- Svelte 5 + SvelteKit, prerendered static pages, deployed to Cloudflare Workers
- One dynamic endpoint: `POST /api/narrative` — KV-cached Gemini narratives with a
  deterministic local fallback (the app is fully functional with no API key at all)
- All user data stays in the browser (localStorage + URL-fragment share links)

## Develop

    npm install
    npm run dev      # app at localhost:5173 (narrative falls back to local composer)
    npm test         # vitest suite: rulebook invariants, engine, codec, worker handler
    npm run check    # svelte-check

## Deploy (Cloudflare free tier)

    npx wrangler kv namespace create NARRATIVE_KV   # put the id in wrangler.jsonc
    npx wrangler secret put GEMINI_API_KEY          # optional — omit to run AI-free
    npm run deploy

## Editing the rulebook

Rules live in `src/lib/rulebook/<domain>.ts`. Each rule is declarative: logic,
evidence tag (`SOURCED`/`SPECULATIVE`), citation with access date, and a pure
`score(inputs, weight)` function. Add a rule, and the UI, weight editor, share
codec, and about-page source list pick it up automatically. `npm test` enforces
the invariants (bounds, integer scores, citation present).
```

- [ ] **Step 3: Full verification pass**

```bash
npm test && npm run check && npm run build
```
Expected: full suite green, no check errors, CF build output present.

- [ ] **Step 4: Manual smoke (dev server)**

`npm run dev`, then verify: score page renders defaults (the 27-year-old "son" scenario); editing net worth moves the finance rows; a what-if lever shows its delta; `/rulebook` slider edits propagate to `/`; share link round-trips in a private window; `/about` renders all sources; narrative card shows the locally-composed fallback (no KV/key in dev).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "docs: README with deploy instructions; verify cited source URLs"
```

- [ ] **Step 6 (optional, requires Roy's CF account): Deploy**

```bash
npx wrangler kv namespace create NARRATIVE_KV  # paste id into wrangler.jsonc
npx wrangler secret put GEMINI_API_KEY
npm run deploy
```

---

## Plan self-review notes

- **Spec coverage:** rulebook model+content (Tasks 2–7), engine+overrides (8), share codec (9), quantizer+fallback (10), worker with cache/limits/budget (11), client+persistence (12), UI in spike aesthetic across all three pages (13–16), error handling embedded throughout (codec null-paths, fallback flags, storage guards), free-tier guards (11), README/deploy (17). Spec §8 out-of-scope items are not implemented anywhere.
- **Counts:** 29 rules = 5 origin + 7 health + 7 finance + 3 education + 5 social + 2 civic; matched by tests in Tasks 3–7.
- **Type consistency:** `Rule`/`Inputs`/`InputKey` from `rulebook/types.ts`; `Overrides`/`ScoreResult` from `engine/score.ts`; `Profile` from `share/codec.ts`; `NarrativePayload` from `engine/quantize.ts`; `KVLike` from `server/narrative.ts` — single definition site each, imported everywhere else.
