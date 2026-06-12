# Addendum: wealth goes power-law (v2.1)

**Date:** 2026-06-12 · **Status:** Approved (design review with Roy)
**Amends:** `2026-06-12-scoring-v2-design.md` §3 (wealth rules)

## Why

The v2 log scale measured how money *feels* to its holder (utility), not how it
*positions you in the world* (power). +10 points between $100k/yr and $1M/yr, and
a trillionaire at 1.7× a comfortable professional's composite, understate the gap
the app exists to expose. Wealth tails follow power laws (Pareto); the score now
does too.

## The curve

Below the median: **unchanged** (linear, same floors). At the median: unchanged
anchors (networth 0, income 0.5). Above the median, both wealth rules grow as the
**square root of the multiple of the median**, uncapped:

- `networth` (nw ≥ median): `position = sqrt(nw / median) − 1`
- `income` (income > median): `position = 0.5 + (sqrt(income / MEDIAN_INCOME) − 1)`

Relatable statement (goes in the logic text): *quadruple your money to double
your points.* Sanity anchors: $1M/yr ≈ +36 (vs +8 at $100k); $10M net worth at
40 ≈ +121; $1T at 54 ≈ +32,170 — a trillionaire composite runs ≈175× an ordinary
one. Both branches remain continuous at the median seam and monotonic.

## The dominance line

`describe()` for both rules always states the **raw multiple of the median**
when above it (e.g. "4,046,000× your age-band median") — the most visceral
number survives any compression in the points. Formatting: one decimal below
10×, thousands-separated integer above.

## Consequences

- **About page:** the uncapped-wealth principle paragraph replaces the
  "each 10× adds the full weight again" sentence with the power-law statement
  (square root of the multiple, Pareto framing, still uncapped).
- **Narrative endpoint:** the payload validator's ±10,000 bound rises to
  ±10,000,000 (quantization and cache behavior otherwise unchanged).
- **Display formatting:** composite, tier subtotals, and per-rule values render
  with thousands separators (`toLocaleString`), since five-digit scores are now
  reachable.
- **Tests:** the v2 log-branch assertions (decade arithmetic) are replaced by
  sqrt anchors; seam-continuity, monotonicity, floor, and trillionaire-magnitude
  tests keep their meaning. New: describe() contains the dominance multiple.

Everything else in the v2 spec stands, including bounds `[−0.5, ∞)` / `[0, ∞)`,
weights, and the over-scale marker (which now reads e.g. ×2011 for the
trillionaire — working as intended).
