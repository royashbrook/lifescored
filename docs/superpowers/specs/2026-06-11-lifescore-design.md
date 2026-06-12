# Life Score — Design Spec

**Date:** 2026-06-11
**Status:** Approved (design review with Roy, this session)
**Origin:** `~/Downloads/life_score_spike_1.jsx` (React spike v2)

## 1. Purpose

An app that generates a "life score" from real-world inputs, exposing how existing
systems — actuarial tables, credit scoring, lending rules, insurance pricing,
social-science research — already turn a person into a number. The goal is
**transparency, not judgment**: every weight visible, every rule stated in plain
English, every claim cited to a public source or explicitly flagged as a guess.
Users can tune the weights themselves, because the weighting *is* the argument.

Product principles (invariants, carried from the spike):

1. **The composite is the least useful number.** The breakdown is the point; the UI
   de-emphasizes the total.
2. **Every rule shows its receipt.** Evidence level is `SOURCED` (public dataset or
   peer-reviewed research, linked) or `SPECULATIVE` (a flagged guess, with the reason
   no clean source exists).
3. **Protected characteristics are deliberately excluded**, with the explanation
   shown in-app: once the real variables (wealth, debt, neighborhood, health
   behaviors) are measured directly, a race/religion/etc. term only double-counts
   them — which is why lending law forbids it. We measure targets, not proxies.
4. **Unmeasurable luck stays an unscored asterisk** (recession at graduation,
   illness, timing) — never a fake number.
5. **Two tiers:** "Your starting point" (mostly out of your hands) vs. "Your moves"
   (things you influenced — where motivation lives). What-if levers exist only for
   controllable rules; deltas are framed as "a delta, not a destiny."

## 2. Scope decisions (made in design review)

| Decision | Choice |
|---|---|
| Rulebook breadth | Broad: ~30 rules across 6 domains in v1 |
| Data model | Client-only; localStorage + compressed-URL sharing; no accounts, no server-side user data |
| AI role | One feature: cached plain-language score narrative via Gemini free tier, with deterministic local fallback |
| Stack | Svelte 5 (runes) + SvelteKit + TypeScript + Tailwind, `adapter-cloudflare`, Workers KV |
| Hosting | Cloudflare Workers free tier; all pages prerendered/static; one dynamic API route |

## 3. Architecture

```
Browser (everything user-specific happens here)
├── SvelteKit prerendered pages:  /  /rulebook  /about
├── Rulebook  src/lib/rulebook/   declarative rules, one file per domain
├── Engine    src/lib/engine/     pure scoring functions
├── Profile store (runes)         inputs + weight overrides → localStorage
└── Share codec                   profile ⇄ deflate+base64url URL fragment

Cloudflare Worker (the only server code)
└── POST /api/narrative
    quantized summary → hash → KV cache (30d TTL)
      hit  → cached narrative
      miss → Gemini Flash (strict prompt) → store → return
    guards: per-IP rate limit, global daily Gemini budget counter
    any failure → { fallback: true } → client renders local narrative
```

### 3.1 Rule model

```ts
type Domain = 'origin' | 'health' | 'finance' | 'education' | 'social' | 'civic';
type Tier = 'starting_point' | 'your_moves';
type Evidence = 'SOURCED' | 'SPECULATIVE';

interface Rule {
  id: string;
  domain: Domain;
  tier: Tier;
  label: string;
  controllable: boolean;
  defaultWeight: number;              // max points; user-tunable per rule
  logic: string;                      // plain-English statement of the rule
  evidence: Evidence;
  source: { name: string; finding: string; url: string; accessed: string };
  inputs: InputKey[];                 // input keys this rule reads
  score(i: Inputs, weight: number): number;   // pure; clamped to [-weight, +weight] or [0, weight] per rule
  describe(i: Inputs): string;        // deterministic plain-English explanation
  whatIf?: { label: string; transform(i: Inputs): Inputs };  // controllable rules only
}
```

The UI iterates the rulebook; no scoring logic lives in components. Rules score
against a **weight parameter**, not a hard-coded max, so user weight overrides flow
through the same pure function.

### 3.2 Scoring engine

Pure module, no UI knowledge:

```
computeScore(inputs, overrides) → {
  perRule: { id, value, max, description }[],
  tierSubtotals, domainSubtotals, composite,
  whatIfDeltas: { ruleId, label, delta }[],
}
```

`overrides` = per-rule `{ weight?: number; enabled?: boolean }`. Disabled rules are
excluded from totals but still shown (greyed) in the breakdown, so turning a rule
off is itself a visible, shareable editorial act.

### 3.3 Profile state & sharing

- Runes-based store: `{ version, inputs, overrides }`; persisted to localStorage on
  change; hydrated on load.
- **Share:** serialize → deflate → base64url → URL *fragment* (`#p=1.<payload>`).
  Fragments are never sent to the server, so shared profiles can't appear in logs.
  Leading version number gates the codec for future migrations.
- Malformed/unknown-version payloads → load defaults + dismissible notice.
- A visible privacy statement: inputs never leave the device; the narrative endpoint
  receives only quantized subtotals.

### 3.4 Narrative endpoint (the only server code)

`POST /api/narrative`

Request (quantized — privacy and cache efficiency are the same mechanism):

```ts
{
  v: 1,
  domains: Record<Domain, number>,   // subtotals rounded to nearest 5
  tiers: { starting_point: number; your_moves: number },  // rounded to nearest 5
  levers: string[],                  // active what-if rule ids, sorted
}
```

Flow: stable-stringify → SHA-256 → KV `narr:<hash>` lookup → hit returns cached
text; miss calls Gemini (`gemini-flash` latest free-tier model, temperature low,
strict template prompt, ~200-word cap) → store with 30-day TTL → return.

Guards:
- Per-IP rate limit (KV counter, e.g. 10/day) — narrative is per-profile-shape, so
  legitimate use is low-frequency.
- Global daily Gemini budget counter in KV (well under free-tier RPD); over budget →
  `{ fallback: true }`.
- Gemini error/timeout → `{ fallback: true }`. The client then composes a local
  narrative from `describe()` outputs. **AI is garnish, never load-bearing.**

Quantization keeps the realistic key space to low thousands; after warm-up, Gemini
call volume approaches zero.

### 3.5 Free-tier budget

- Static pages/assets: served as CF static assets — effectively free, don't consume
  Worker requests.
- Worker requests: only `/api/narrative` (≤1 per user per profile-shape) — far
  under 100k/day.
- KV free tier: 100k reads / 1k writes per day. Reads = cache lookups (fine).
  Writes = cache misses + counters (bounded by the Gemini budget guard, ≪1k/day).

## 4. The rulebook (v1 content)

~30 rules. Final wording, weights, and verified URLs are implementation-plan work;
each rule below names its intended public source. Default weights are editorial and
that's the point — they ship visible and tunable. The six spike rules carry over.

**Origin — "your starting point"** (tier: starting_point)
| Rule | Source | Evidence |
|---|---|---|
| Country of residence (income tier) | World Bank income classifications | SOURCED |
| Generational support / family floor | Opportunity Insights (Chetty) — population-scale only | SPECULATIVE |
| Parental education | OECD / NCES intergenerational education data | SOURCED |
| Passport strength | Henley Passport Index | SOURCED |
| Neighborhood opportunity | Opportunity Atlas | SOURCED |

**Health / actuarial** (mixed tiers — age/sex are starting point; behaviors are moves)
| Rule | Source | Evidence |
|---|---|---|
| Age & sex vs. life table | SSA actuarial life tables | SOURCED |
| Smoking status | CDC mortality/life-expectancy data | SOURCED |
| Physical activity | WHO/CDC guidelines + mortality research | SOURCED |
| Alcohol use | CDC/NIAAA | SOURCED |
| Sleep | AASM/CDC sleep-duration research | SOURCED |
| Health insurance coverage | KFF / Census uninsured-outcome data | SOURCED |
| BMI band | CDC/WHO (with in-app caveat on BMI's known limits) | SOURCED |

**Finance / credit** (tier: your_moves, per spike's framing)
| Rule | Source | Evidence |
|---|---|---|
| Net worth vs. age-band median | Fed Survey of Consumer Finances | SOURCED |
| Debt-to-income vs. 43% line | CFPB Qualified Mortgage rule | SOURCED |
| Payment history | FICO published weighting (35%) | SOURCED |
| Credit utilization | FICO published weighting (30%) | SOURCED |
| Emergency fund (3-month test) | Fed SHED report | SOURCED |
| Income vs. median | Census/BLS median earnings | SOURCED |
| Homeownership | Fed SCF homeowner/renter wealth gap | SOURCED |

**Education / work** (tier: your_moves, with affordability caveat per spike)
| Rule | Source | Evidence |
|---|---|---|
| Degree attainment | BLS education-pays earnings data | SOURCED |
| Employment status | BLS unemployment/outcome data | SOURCED |
| Occupation outlook | BLS Occupational Outlook Handbook | SOURCED |

**Social** (tier: your_moves)
| Rule | Source | Evidence |
|---|---|---|
| Social connection | Holt-Lunstad meta-analysis (loneliness/mortality) | SOURCED |
| Partnership status | Longevity/marriage research (with selection-effect caveat) | SOURCED |
| Volunteering / community | Corporation for National Service research | SOURCED |
| Driving record | Insurance industry rating factors (III) | SOURCED |
| Digital footprint | No clean public dataset — flagged guess | SPECULATIVE |

**Civic / legal** (mixed; framed strictly as "how systems score you")
| Rule | Source | Evidence |
|---|---|---|
| Criminal record | Sourced employment-effect research (e.g. Pager audit studies) | SOURCED |
| Voting access / registration | State-level access indexes | SPECULATIVE |

Sensitive-topic handling: civic/legal and health rules use the same framing as
everything else — *this is how existing systems would position you* — never advice,
never moral judgment. BMI, partnership, and criminal-record rules carry explicit
in-app caveats about known criticisms of those measures, cited.

## 5. UI

Preserves the spike's editorial aesthetic: dark palette, Fraunces (display),
Newsreader (body), JetBrains Mono (numbers/labels), tier accent colors, evidence
tags, thin score bars. Tailwind utilities + CSS variables, self-hosted fonts.

- **`/` — Score.** Domain-grouped inputs (progressive disclosure: start with ~8 core
  inputs, "add detail" expands each domain), tier breakdown with per-rule rows/bars,
  "the comparison that actually helps" callout, what-if lever chips with delta
  readout, AI narrative card (with `AI` tag when remote, no tag when local
  fallback), share button, composite shown small per principle 1.
- **`/rulebook` — Rulebook.** Every rule card: logic, evidence tag, controllable
  tag, source quote + link, weight slider, enable toggle, "reset all to defaults."
  Banner restates the editorial-weights thesis.
- **`/about` — Why.** Manifesto: transparency goal, what's deliberately excluded
  and why, the unscored-luck asterisk, methodology notes, full source list.

## 6. Error handling

| Failure | Behavior |
|---|---|
| Narrative API error / quota / timeout | Client renders deterministic local narrative; no error state visible beyond missing AI tag |
| Malformed or future-version share URL | Defaults + dismissible "couldn't read that link" notice |
| Out-of-range numeric input | Clamped at engine boundary; UI shows clamped value |
| localStorage unavailable | App functions, in-memory only |
| KV unavailable (worker) | Skip cache, still enforce budget counter conservatively (fail toward fallback, never toward unmetered Gemini calls) |

## 7. Testing

Vitest, TDD throughout:

- **Per rule:** bounds (never exceeds ±weight), clamping, monotonicity where
  applicable (e.g. more debt never raises the debt score), `describe()` snapshots.
- **Engine:** subtotal/composite arithmetic, override semantics (weight scaling,
  disable), what-if delta correctness.
- **Codec:** round-trip property tests, version gating, corruption → defaults.
- **Worker:** cache hit/miss, quantization stability (same bucket → same hash),
  rate-limit and budget-guard paths, Gemini-failure → fallback (mock KV + fetch).
- **Smoke:** prerender build succeeds; score page renders with defaults.

## 8. Out of scope for v1

Accounts/auth, server-side profiles, population percentile comparisons ("you vs.
others who shared"), AI Q&A about sources, i18n, additional countries beyond a
representative set in the country table, mobile app.
