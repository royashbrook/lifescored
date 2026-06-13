# Rule Packs + Foundations Layer — Design Spec

**Date:** 2026-06-13 · **Status:** Approved (panel synthesis + Roy's decisions)
**Tracks:** issue #1 · **Branch:** `feat/rule-packs` (local, NOT pushed — for review)

## Decisions

From the four-lens adversarial panel and Roy's calls:
- **Adopt rule packs**: a lean default **Core** + opt-in toggleable packs. This resolves the
  expansionist-vs-skeptic tension (completeness without a 50-field form or health-surveillance
  by default) and is the scaling mechanism toward a "marketable number across packs."
- **Build now**: the pack *architecture* + the **Foundations** pack + the agreed **cleanups**.
- **Defer**: the Underwriting pack (actuary's clinical items) and the ChexSystems banking
  enhancement — both noted as follow-ups, not built here.
- This is a local-branch build for Roy to test before any push.

## 1. Pack model

- `PackId = 'core' | 'foundations' | 'underwriting' | 'speculative'`.
- Each `Rule` gains a `pack: PackId`. Existing 31 rules → `'core'`, EXCEPT `digital` and
  `voting`, which move to `'speculative'` (the panel's quarantine, not deletion).
- `PACKS` metadata: `Record<PackId, { label, blurb, defaultOn, toggleable }>`.
  - `core`: defaultOn true, toggleable false (always on).
  - `foundations`: defaultOn false, toggleable true.
  - `speculative`: defaultOn false, toggleable true.
  - `underwriting`: declared but no rules yet (deferred).
- A rule is **active** when its pack is enabled. Enabled = `PACKS[pack].defaultOn` (core) OR the
  user toggled it on. The existing per-rule `overrides.enabled` still applies on top of an active
  rule (you can disable an individual rule within an active pack).

## 2. Engine (`engine/score.ts`)

- `computeScore(inputs, overrides, activePacks?)` — `activePacks` is a `Set<PackId>` of enabled
  packs; defaults to `new Set(['core'])` (so existing callers get the lean default).
- A rule contributes only if `activePacks.has(rule.pack)`. Inactive-pack rules are **excluded
  entirely** from `perRule` (no input, no row) — not greyed (greying is reserved for
  individually-disabled active rules).
- Everything downstream (`topMovers`, quantize, narrative, tier/domain subtotals) consumes
  `perRule` and is automatically scoped — no change needed.

## 3. State, persistence, sharing

- `Profile` gains `packs: Record<string, boolean>` (enabled opt-in packs; core implicit). Default `{}`.
- Store: add `packs` rune + `setPack(id, on)`; include in `snapshot()`/`replace()`.
- `activePacks` helper: `new Set(['core', ...Object.entries(profile.packs).filter(([,on]) => on).map(([id]) => id)])`.
- Codec: include `packs` in encode/decode; **sanitize** (only known pack ids, boolean values);
  migrate missing → `{}`. So a shared link carries which packs the sharer had on (a recipient
  opening a Foundations-on profile sees Foundations).
- `loadStoredProfile`: default `packs: {}`; legacy stored profiles get `{}`.

## 4. UI

- **Layers row** (new `PackBar.svelte`), placed just below the presets: toggle chips for each
  `toggleable` pack (Foundations, Speculative). On = gold, like an active preset. Toggling calls
  `profile.setPack`. A one-line blurb under the row explains "opt-in layers; off by default."
- **InputsPanel**: render a field only if its rule's pack is active. Foundations fields appear
  (in their own labelled sub-group) when Foundations is on; the two speculative fields
  (digital footprint, voter registration) appear only when Speculative is on. Core fields
  unchanged.
- Breakdown / TopMovers / narrative: already scoped via `perRule`.
- The composite and "what's moving" update live as packs toggle.

## 5. Foundations pack (`rulebook/foundations.ts`)

Four rules, `pack: 'foundations'`, `tier: 'starting_point'`, `controllable: false`, `evidence: 'SOURCED'`.
Defaults (in `DEFAULT_INPUTS`) reflect the typical app user (developed-world) so enabling the pack
*raises* the starting-point tier — the "you were born ahead" point, made of receipts.

| id | input | bands | source | bounds | weight |
|---|---|---|---|---|---|
| `water-sanitation` | `wash: 'none'\|'basic'\|'safe'` | unsafe / basic / safely-managed | WHO/UNICEF JMP (2.2B lack safe water) | [0,1] | 14 (1.4×) |
| `utilities` | `infrastructure: 'neither'\|'electricity'\|'both'` | electricity + internet access | IEA SDG7 + ITU (2.6B offline) | [0,1] | 12 (1.2×) |
| `food-security` | `foodSecurity: 'insecure'\|'marginal'\|'secure'` | FAO SOFI / USDA module | [-0.2,1] | 12 (1.2×) |
| `peace-rule-of-law` | `stability: 'conflict'\|'fragile'\|'stable'` | born outside active conflict, under rule of law | UCDP/PRIO + World Bank WGI | [-0.3,1] | 14 (1.4×) |

Negative floors on food-security and peace qualify under the constrained-subtractive principle
(famine and war actively destroy human capital — FAO/UCDP both document it).

New inputs join `DEFAULT_INPUTS` (defaults: `wash:'safe'`, `infrastructure:'both'`,
`foodSecurity:'secure'`, `stability:'stable'`), `STRING_ENUMS` (so `clampInputs` repairs them),
and `FIELD_HELP` (one sentence each). A foundations input is only *shown* when the pack is on, but
it always exists on the type and is always clamped.

## 6. Cleanups

- **Quarantine `digital` + `voting`**: change their `pack` to `'speculative'`. They leave the
  default form but remain available (opt-in). No score change for default users except those two
  rules no longer contribute.
- **Broaden tobacco → nicotine**: relabel the `smoker` rule to "Nicotine use" and update
  `logic`/`describe`/help to cover vaping/cigars/chew (matching cotinine-based insurer
  classification). Input key and enum unchanged (`never`/`former`/`current`).
- **Demote `sleep`**: `defaultWeight` 6 → 3 (no life insurer prices sleep; the rule's own
  rationale concedes confounding). Update its `weightRationale` to state the demotion.

## 7. Out of scope (noted follow-ups)

- Underwriting pack (family history, chronic conditions, BP/cholesterol, occupation/avocation
  hazard) — opt-in, deferred; tracked under #1.
- ChexSystems "banking access" enhancement — deferred to a future Finance pack.
- A "speculative" pack is the new home for any future flagged-guess rules.

## 8. Testing

- Engine: pack filtering (active vs inactive excluded; default = core only; per-rule disable still
  applies within an active pack).
- Codec/state: `packs` round-trip + sanitize + migrate.
- Foundations rules: the shared invariant suite (bounds, integer, zero-weight→0, sourced URL,
  weightRationale) + monotonicity per band.
- Updated existing tests: index rule count (31 → 35), `topMovers`/`quantize`/score tests now
  default to core-only (29) — assertions updated where they counted rules.
- e2e: toggle Foundations on → composite rises and Foundations inputs appear; toggle off →
  reverts. The two speculative rules absent by default.
- Default-user score parity: with no packs on, the composite equals the pre-change core set
  (current minus digital+voting+sleep-demote effects) — documented, not silently changed.
