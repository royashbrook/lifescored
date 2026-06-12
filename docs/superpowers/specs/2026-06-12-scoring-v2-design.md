# Life Score — Scoring v2 Design (position × weight)

**Date:** 2026-06-12
**Status:** Approved in design review with Roy (this session)
**Builds on:** `2026-06-11-lifescore-design.md` (v1, shipped). This is an addendum;
v1 principles remain binding except where amended here.

## 1. Motivation

Three gaps surfaced after using v1:

1. **The formula is invisible.** Every rule already computes `points = fraction ×
   weight`, but the UI shows only the result. The receipt is incomplete — users
   can't see what part is *measurement* and what part is *editorial*.
2. **Weights have no stated justification.** The slider exists, but the default
   numbers look arbitrary. Each weight needs its own "why," the same way each
   rule has its source.
3. **Wealth saturates.** Income caps at 2× median and net worth just above
   median, so a trillionaire scores the same as a comfortable professional —
   contradicting the goal that the score reflect how much the real world rewards
   money.

## 2. The scoring contract (amends v1 §3.1)

### Rule interface changes

```ts
interface Rule {
  // ... unchanged: id, domain, tier, label, controllable, defaultWeight,
  //     logic, evidence, source, inputs, describe, whatIf?, caveat?
  position(i: Inputs): number;     // REPLACES score(i, weight)
  bounds: [number, number];        // declared position bounds; upper may be Infinity
  weightRationale: string;         // REQUIRED: why this default weight, relative to baseline
}
```

- `position(i)` returns the **measured fact**, normalized so `1.0` = full marks
  on this dimension. It may be negative or exceed 1.0 only within declared
  `bounds`.
- The **engine** computes points in exactly one place:
  `points = round(clampToBounds(position(i)) × weight) (normalized −0 → 0)`.
  Per-rule `|| 0` guards disappear; the engine owns the formula.
- `RuleScore` gains a `position` field so the UI can show the decomposition.

### Display formula (every score row)

```
position 7.5/10  ×  weight 2.4×  =  +18
```

- Position displayed on a 0–10 scale (one decimal).
- Weight displayed as a multiplier of the baseline (weight / 10, one decimal).
- Exact microcopy decided at implementation; the three numbers are required.

### The baseline

**Weight 1.0× ≡ 10 points, anchored on income.** Income keeps defaultWeight 10
and its `weightRationale` states it is the baseline: the dimension existing
systems price most legibly. Every other weight is a stated deviation
(country 2.4×, net worth 1.6×, DTI 1.4×, volunteering 0.4×, …) justified in its
own `weightRationale` — cited where a citation exists, flagged as editorial
judgment where not. The about page methodology section explains the anchor.

### The constrained-subtractive principle (new, stated in-app)

A rule's lower bound may be negative **only if its citation shows the real
system itself subtracts** (FICO delinquency, license points, underwater assets,
eviction), and the bound must stay asymmetric and tight (a rule may never lose
more than it can gain unless the cited system does exactly that — DTI's
symmetric ±1 stays, per the CFPB cliff). This principle is printed on the about
page. Rules that qualify in v2: dti, networth, utilization, driving,
housing-stability (new), education (reworked).

## 3. Wealth rules go logarithmic, uncapped (amends v1 finance rules)

**Net worth** (weight 16 → 1.6×), `bounds: [-0.5, Infinity]`:

- `nw < median(age)`: position = `max(-0.5, (nw − median) / (2 × median))` —
  identical to v1 (linear drag, floored at half the weight).
- `nw ≥ median(age)`: position = `log10(nw / median)` — 0 at the median,
  +1 per decade above, **no cap**. Continuous at the median (both branches = 0).

**Income** (weight 10 = 1.0× baseline), `bounds: [0, Infinity]`:

- `income ≤ median`: position = `income / (2 × median)` — identical to v1
  (0 → 0.5 at the median).
- `income > median`: position = `0.5 + log10(income / median)` — continuous at
  the median, +1 per decade above, no cap.

Both rules' `logic` text states: *uncapped, because the real world does not cap
the advantage of money.* Citations for the log shape: Bernoulli's log utility;
Kahneman & Deaton (2010) log-income/wellbeing; wealth distributions are
approximately log-normal.

Sanity anchor: a ~$10¹² net worth is ~6.6 decades above its age-median →
≈ +106 points from one rule — money visibly dominates the composite, by design.

### Bar overflow UI

When `|value| > max`, the bar pins at 100% and shows an overflow marker
(`×6.6 over scale`). `Bar.svelte` gains this treatment; everywhere else the
nominal `max` (= weight) remains the scale reference.

### Test invariant changes

`expectRuleInvariants` becomes bounds-aware: score must lie within
`[bounds[0] × w, bounds[1] × w]` (finite-checked when upper bound is Infinity),
integers, zero-weight → 0, describe non-empty, source/accessed checks unchanged.
Add monotonicity probes for the log branches (more money never scores less) and
continuity at the median seam (positions on either side within one rounding
step).

## 4. New rules batch (29 → 31 rules; one reworked)

| Rule | Domain / tier | Weight | Bounds | Evidence |
|---|---|---|---|---|
| **housing-stability** (new) | social / your_moves | 12 (1.2×) | [-0.5, 1] | SOURCED — Desmond eviction research (Eviction Lab) + HUD AHAR: homelessness/eviction measurably destroy employment, health, and credit outcomes. Subtractive bottom qualifies under the principle. Bands: unhoused / insecure (eviction risk, doubled-up) / stable. controllable: false (you don't choose your way out of an eviction mill), no lever. |
| **education** (reworks `degree`) | education / your_moves | 12 (1.2×) | [-0.2, 1] | SOURCED — BLS Education Pays: earnings and unemployment by attainment; <HS unemployment ≈ 2× bachelor's. Ladder: none (−0.2) / hs (0.4) / some college (0.6) / bachelor (1.0) / graduate (1.0 — premium over BA is field-dependent; say so). whatIf lever "Finish a degree" applies to none/hs/some. |
| **banked** (new) | finance / your_moves | 6 (0.6×) | [0, 1] | SOURCED — FDIC National Survey of Unbanked and Underbanked Households: check-cashing/money-order poverty premium, no credit-building rail. Bands: unbanked (0) / underbanked (0.5) / banked (1). |

### Input schema changes

- `degree: boolean` → `education: 'none' | 'hs' | 'some' | 'bachelor' | 'graduate'`
  (default `'hs'` — matches the v1 default `degree: false` son scenario).
- `housing: 'unhoused' | 'insecure' | 'stable'` (default `'stable'`).
- `banking: 'unbanked' | 'underbanked' | 'banked'` (default `'banked'`).
- All three join the STRING_ENUMS repair table; InputsPanel gains the fields
  (housing and banking in the expanded section; education replaces the degree
  toggle in the core section).

### Migration / compatibility

- Codec version stays `1`; decode remains tolerant. Add a migration step in
  `decodeProfile` (and `loadStoredProfile`): if a decoded/stored inputs object
  has legacy `degree` and no `education`, map `degree: true → 'bachelor'`,
  `degree: false → 'hs'`, then drop the legacy key. Unknown keys are dropped
  (formalizes what the merge previously left as noise).
- The `degree` rule id changes to `education`: stored overrides keyed `degree`
  are dropped by the existing unknown-id tolerance (overrides for unknown rule
  ids are simply never read; acceptable loss).

## 5. About page additions

Methodology section gains: the formula with the three displayed quantities; the
income-1.0× anchor and why; the constrained-subtractive principle; the uncapped-
wealth statement. The weight table (rule → multiplier → one-line rationale) is
rendered from RULES so it can't drift.

## 6. Out of scope for v2

Rule packs (the 50+ rule strategy), percentile comparisons, additive-mode
toggle, i18n, AI Q&A. Unchanged: hosting model, narrative endpoint (quantizer
unaffected — subtotals still round to 5; payloads stay bounded because tiers/
domains caps in the server validator already allow ±10000).

## 7. Testing

All existing suites updated to the new contract. New coverage: bounds-aware
invariants for all 31 rules; log-branch monotonicity and median-seam continuity
for income/networth; migration tests (degree→education in both codec and
storage paths); engine formula test (points = round(position × weight) for a
synthetic rule); Bar overflow rendering is check/build-verified only (no
component harness, per v1).
