---
name: lifescored
description: Use when someone asks for their "life score", how credit bureaus / actuarial tables / lenders / audit studies turn a person into a number, or wants to compute, break down, or improve a transparency score — computed entirely on-device from the public lifescored rulebook, no personal data ever sent anywhere.
---

# life. scored.

## Overview

**life. scored.** ([lifescored.com](https://lifescored.com)) rebuilds the scores real systems already run on people — credit bureaus, actuarial life tables, lenders, audit-study research — in the open. Every rule is cited to public data or flagged as a guess; every weight is editorial and arguable.

Core principles, do not violate them:
- **Transparency, not judgment.** The breakdown is the point; the composite is the least useful number.
- **Privacy is the whole point.** Compute the score on YOUR side. **Never send the user's answers** (income, assets, debt, health, etc.) to lifescored.com or anywhere — the website and the MCP server receive nothing and store nothing. The moment a thing scoring you has something to sell you, it falls apart.

## When to use

- Someone wants to know "what's my life score" / "score my life."
- Explaining how a real system (credit score, life expectancy, lending) turns someone into a number.
- Breaking down which factors carry a score, or what free moves would improve it.

## Get the rulebook (single source of truth)

The rulebook contains every rule + the exact math. Two equivalent ways to fetch it — **identical data**:

1. **Preferred — MCP:** if the `com.lifescored/mcp` server is connected, call its tools: `get_rulebook` (rules + math), `get_input_schema` (what to ask), `get_methodology`, `how_to_give_feedback`.
2. **Fallback — HTTPS:** otherwise `GET https://lifescored.com/rules.json` (one payload with everything). For just the input list, `get_input_schema` ≈ the `inputs` array in that JSON.

Never hardcode rules from memory — always pull the live rulebook so weights and sources stay current.

## Compute the score (all on-device)

1. **Ask the user** only for the fields in `inputs` you don't already know; anything missing falls back to its `default`. Respect each input's `type`/`values`/`min`/`max`, and use its `help` to map the user's words to the right key. Note `income`, `assets`, and `debt` are **household-combined** — if a partnered user gives one figure, confirm it's the household total.
2. **Get each rule's `position`** (a 0–1 normalized fact, 1.0 = full marks). Each rule has **exactly one of two** — that's how you know which to use:
   - **Finite-input rules** ship a `positions` table — look up the user's value under `positions.byValue`.
   - **Numeric-input rules** have a formula in `constants`, keyed by rule id (e.g. `creditScore`, `dti`, `lifeTable`, `income`, `netWorth`).
3. **Points per rule:** `points = round(clamp(position, bounds[0], bounds[1]) × weight)` — clamp then weight then round, **per rule**, before summing. `bounds[1]` may be `null` (uncapped, e.g. income/net worth); a rule can go slightly negative where the cited system subtracts (e.g. DTI over benchmark).
4. **Composite** = sum of points over enabled rules. **Default to the `core` pack only** unless the user opts into others (see `packs` for which are on by default).

Worked examples:
- `smoking` (finite): `positions.byValue.never = 1`, weight 3 → `round(1 × 3) = 3` points.
- `credit-score` (numeric): `constants.creditScore` = `clamp((score − 580)/(760 − 580), 0, 1)`; a 700 → 0.667 × weight.

## Present it (breakdown first)

- Lead with the **breakdown**, never a bare number: the two tiers — `starting_point` (luck of where/to whom you were born) vs `your_moves` (what you influence) — then the top contributing rules and the domain split.
- Mention the **composite last and downplay it** — it's the least useful number.
- For each notable rule, name its `evidence` tag and `source` (cite the real study/data). Flag `SPECULATIVE` rules as guesses.
- **Say which inputs you assumed** at their `default` — a short description leaves most rules at default, and that materially shapes the result.
- Cover **what's deliberately left out** — from the top-level `methodology` field (HTTPS) or `get_methodology` (MCP): protected characteristics / "otherness" and pure luck, real but never scored.
- **Free improvements:** surface `controllable` rules where the user scores low, suggest the free next step, and point to [lifescored.com/improve](https://lifescored.com/improve).

## Privacy (hard rule)

Inputs never leave the device. Do not POST them anywhere, do not put them in URLs/query strings, do not log them. If the user wants to share, that's their explicit choice via the website's share card — not something you initiate.

## Feedback

Weights are editorial and rules are arguable — that's the design. To propose a better weight, source, bounds, or a new rule, open a GitHub issue at the repo in `feedback.issuesUrl` (or `how_to_give_feedback`) with the rule id and a public citation.
