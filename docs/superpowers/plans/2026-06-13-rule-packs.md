# Rule Packs + Foundations + Cleanups — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Checkbox steps.

**Goal:** Add a rule-pack architecture (lean Core + opt-in Foundations/Speculative packs), build the Foundations pack (4 sourced rules), and apply the agreed cleanups — all on a local branch for review.

**Architecture:** Each rule declares a `pack`. The engine scores only rules in active packs (default = core). Pack enablement lives in the profile (persists + travels in share links). A Layers toggle row drives it; InputsPanel shows only active-pack fields.

**Spec:** `docs/superpowers/specs/2026-06-13-rule-packs-design.md` — read it; it has the full content (Foundations rule bands/sources/weights, cleanup details, defaults).

**Stack:** unchanged. Commits must reference issue #1 (hook enforces).

---

### Task 1: Pack types + metadata + tag existing rules

**Files:** Modify `src/lib/rulebook/types.ts` (add `PackId` + `pack` to `Rule`), create `src/lib/rulebook/packs.ts` (PACKS metadata), modify all 6 domain files to add `pack: 'core'` to every rule, EXCEPT set `digital` and `voting` to `pack: 'speculative'`. Modify `src/lib/rulebook/index.ts` to `export * from './packs'`. Test: `src/lib/rulebook/packs.test.ts`.

- [ ] Test first: every rule has a `pack` that exists in PACKS; exactly `digital`+`voting` are 'speculative'; all others 'core' (foundations rules added in Task 2). PACKS has core(defaultOn true, toggleable false), foundations/speculative (defaultOn false, toggleable true), underwriting (declared).
- [ ] `types.ts`: `export type PackId = 'core' | 'foundations' | 'underwriting' | 'speculative';` and add `pack: PackId;` to the `Rule` interface (required).
- [ ] `packs.ts`:
```ts
import type { PackId } from './types';
export interface PackMeta { label: string; blurb: string; defaultOn: boolean; toggleable: boolean; }
export const PACKS: Record<PackId, PackMeta> = {
	core: { label: 'Core', blurb: 'The default set — concrete, cited, and surveillance-free.', defaultOn: true, toggleable: false },
	foundations: { label: 'Foundations', blurb: 'The floor you were handed — water, power, food, peace. You were born ahead of most of human history.', defaultOn: false, toggleable: true },
	underwriting: { label: 'Underwriting', blurb: 'How a life insurer prices you. (Coming soon.)', defaultOn: false, toggleable: true },
	speculative: { label: 'Speculative', blurb: 'Flagged guesses — real signals, but no clean per-person dataset.', defaultOn: false, toggleable: true }
};
export const TOGGLEABLE_PACKS = (Object.keys(PACKS) as PackId[]).filter((id) => PACKS[id].toggleable && PACKS[id].label && id !== 'underwriting');
```
(underwriting excluded from the visible toggles until it has rules.)
- [ ] Add `pack: 'core'` to all 31 existing rule objects; `digital` and `voting` get `pack: 'speculative'`.
- [ ] The shared invariant helper `expectRuleInvariants` (rule-test-utils.ts): add `expect(PACKS[rule.pack]).toBeDefined()`.
- [ ] Verify `npm test` (note: index count test + computeScore tests will be updated in later tasks — if they fail on the pack changes alone, only `pack` additions shouldn't break counts yet; digital/voting still exist in RULES). `npm run check` 0 errors. Commit `(#1)`.

---

### Task 2: Foundations pack rules + inputs

**Files:** Create `src/lib/rulebook/foundations.ts` (FOUNDATIONS_RULES, 4 rules per spec §5), modify `types.ts` (add 4 inputs: wash, infrastructure, foodSecurity, stability), `inputs.ts` (DEFAULT_INPUTS defaults + STRING_ENUMS), `help.ts` (FIELD_HELP entries), `index.ts` (spread FOUNDATIONS_RULES into RULES), `rule-test-utils.ts` (SAMPLE_INPUTS get the new fields). Test: `foundations.test.ts`.

- [ ] Read spec §5 for exact bands/sources/weights/bounds. Each rule: pack 'foundations', tier 'starting_point', controllable false, evidence 'SOURCED', accessed '2026-06-13', position from the band, bounds per table, weightRationale vs 1.0× income baseline.
- [ ] Inputs added to `Inputs`: `wash: 'none'|'basic'|'safe'`, `infrastructure: 'neither'|'electricity'|'both'`, `foodSecurity: 'insecure'|'marginal'|'secure'`, `stability: 'conflict'|'fragile'|'stable'`. DEFAULT_INPUTS: `wash:'safe', infrastructure:'both', foodSecurity:'secure', stability:'stable'`. STRING_ENUMS: add all four. FIELD_HELP: one sentence each with ruleId.
- [ ] SAMPLE_INPUTS (rule-test-utils): adverse profile gets worst bands (none/neither/insecure/conflict); favorable gets best (safe/both/secure/stable); default profile picks up defaults.
- [ ] foundations.test.ts: 4 rules satisfy `expectRuleInvariants`; each is pack 'foundations', tier 'starting_point'; monotonicity per band; the two with negative floors (food-security, peace) go negative at worst band.
- [ ] `npm test`, `npm run check`. Commit `(#1)`.

---

### Task 3: Cleanups — nicotine relabel + sleep demote

**Files:** Modify `src/lib/rulebook/health.ts` (smoking→nicotine copy; sleep weight 6→3), `src/lib/rulebook/help.ts` (smoker help mentions vaping). Test: update `health.test.ts` if it asserts sleep weight.

- [ ] `smoking` rule: change `label` to 'Nicotine use'; update `logic` and `describe` to cover vaping/cigars/chew (cotinine-based insurer classification); keep id `smoking`, enum unchanged. Update FIELD_HELP.smoker help to "...any nicotine — cigarettes, vaping, cigars, chew...".
- [ ] `sleep` rule: `defaultWeight` 6 → 3; update `weightRationale` to note the demotion (no life insurer prices sleep; rule is confounded).
- [ ] If any test asserts sleep's weight or smoking's label, update it. `npm test`, `npm run check`. Commit `(#1)`.

---

### Task 4: Engine — active-pack filtering

**Files:** Modify `src/lib/engine/score.ts`. Test: `score.test.ts`.

- [ ] `computeScore(inputs, overrides = {}, activePacks: Set<string> = new Set(['core']))`. In the rule loop and in `compositeOf`, skip a rule when `!activePacks.has(rule.pack)`. Inactive-pack rules are excluded from `perRule`, subtotals, and whatIfs.
- [ ] Tests: default (no activePacks) → perRule excludes digital, voting, and all foundations (count = 29 core). Passing `new Set(['core','foundations'])` → includes the 4 foundations. Passing `new Set(['core','speculative'])` → includes digital+voting. Per-rule `overrides.enabled:false` still excludes within an active pack.
- [ ] Update any existing computeScore test that assumed 31 rules in perRule (now 29 core by default). The "never NaN"/highlights/quantize tests use defaults → core-only → fine, but verify counts.
- [ ] `npm test`, `npm run check`. Commit `(#1)`.

---

### Task 5: State + activePacks helper

**Files:** Modify `src/lib/state/profile.svelte.ts`, `src/lib/share/codec.ts` (Profile type gains `packs`).

- [ ] `Profile` (in codec.ts): add `packs: Record<string, boolean>`.
- [ ] Store `createProfileState`: add `let packs = $state(initial.packs ?? {})`; getter; `setPack(id, on) { packs = { ...packs, [id]: on }; }`; include `packs` in `snapshot()` and `replace()`; `setInputs` unchanged.
- [ ] Export an `activePacks(profile)` helper (in profile.svelte.ts or a small module): `new Set(['core', ...Object.entries(profile.packs).filter(([, on]) => on).map(([id]) => id)])`.
- [ ] `loadStoredProfile`: default `packs: {}`; include in the returned Profile (and the `fresh` fallback).
- [ ] Test (profile.test.ts): stored packs round-trip; missing packs → {}.
- [ ] `npm test`, `npm run check`. Commit `(#1)`.

---

### Task 6: Codec — packs round-trip + sanitize + migrate

**Files:** Modify `src/lib/share/codec.ts`. Test: `codec.test.ts`.

- [ ] `encodeProfile`: include `packs` (already in Profile). `decodeProfile`: after sanitizing inputs/overrides, sanitize packs: keep only known PackId keys with boolean values; default `{}`. Import PACKS for the known-id check.
- [ ] Tests: a profile with `packs: { foundations: true }` round-trips; hostile `packs: { foundations: 'yes', bogus: true }` → sanitized to `{}` (non-boolean dropped, unknown id dropped). Missing packs → `{}`.
- [ ] `npm test`, `npm run check`. Commit `(#1)`.

---

### Task 7: UI — Layers toggle + pack-gated inputs + wire activePacks

**Files:** Create `src/lib/ui/PackBar.svelte`; modify `src/lib/ui/InputsPanel.svelte` (gate fields by active pack), `src/routes/+page.svelte` (mount PackBar; pass activePacks to computeScore).

- [ ] `+page.svelte`: import `activePacks` helper + PACKS; `const packs = $derived(activePacks(profile))`; pass to both computeScore calls: `computeScore(profile.inputs, profile.overrides, packs)` and the effective/result ones. Mount `<PackBar {profile} />` below `<PresetBar>`.
- [ ] `PackBar.svelte`: toggle chips for TOGGLEABLE_PACKS; active = `profile.packs[id] === true` (gold); onclick `profile.setPack(id, !on)`; a one-line blurb under the row. Match the PresetBar aesthetic.
- [ ] `InputsPanel.svelte`: gate the foundations fields and the speculative fields by pack. Add a `packs` prop (the active set) OR read it from the profile. Render foundations inputs (wash, infrastructure, foodSecurity, stability) in a labelled sub-group only when foundations active; render digital + voter fields only when speculative active. Core fields unchanged. (digital footprint + voter registration inputs currently live in the expanded grid — gate those two.)
- [ ] Verify `npm run check`, `npm run build`; browser-smoke: toggling Foundations on shows the 4 new inputs + raises the composite; the two speculative fields hidden until Speculative on. Commit `(#1)`.

---

### Task 8: e2e + verification

**Files:** `e2e/packs.spec.ts` (new); verification.

- [ ] e2e: load `/`; assert no "Voter registration"/"Digital footprint" rows by default; click the Foundations layer chip → composite increases AND a foundations input (e.g. "Clean water") appears; toggle off → reverts. Click Speculative → the two speculative inputs appear.
- [ ] Full gate: `npm test` (all green), `npm run check` (0), `npm run test:e2e` (all green incl. new), `npm run build` (clean).
- [ ] Commit `(#1)`. Do NOT merge or push — leave on `feat/rule-packs` for Roy's review.

---

## Self-review notes
- Default-user impact: digital+voting+sleep changes mean the default composite shifts; documented, intended.
- `activePacks` default `Set(['core'])` keeps every existing engine caller lean without code changes.
- Foundations defaults (developed-world) make enabling the pack *raise* the score — the born-ahead point.
- Underwriting + ChexSystems explicitly deferred.
