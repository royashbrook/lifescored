# Contributing to life. scored.

The weights in this project are **editorial**, and the rules are **arguable** — that's the whole design. The composite is the least useful number; the breakdown, and the public reasoning behind every weight, is the point. So the most valuable contribution isn't code — it's a better-justified rule.

This guide is for humans *and* for AI agents: if an assistant computed a life score for someone (using [`/rules.json`](https://lifescored.com/rules.json)) and the person thinks a rule is wrong, route that feedback here so improvements from many people can be aggregated in the open.

## What makes a good rule suggestion

Every rule is one of two kinds:

- **SOURCED** — tied to a public dataset or a system that demonstrably scores people this way (FICO, the SSA life table, the CFPB DTI line, the Census/Fed medians, peer-reviewed studies).
- **SPECULATIVE** — a flagged guess where the direction is plausible but no clean outcome dataset exists.

A strong suggestion moves a rule toward being *more* defensible. Please include:

1. **The rule id** (e.g. `credit-score`, `networth`, `parenthood`) — see `rules.json` or the [rulebook](https://lifescored.com/rulebook).
2. **What you'd change** — the weight, the bounds, the formula, the source, or a proposed new rule.
3. **A public citation** if you have one — a URL to the data or study. SOURCED beats opinion.
4. **The why** — one or two sentences on what's wrong with the current treatment.

## How to file it

Open a GitHub issue: <https://github.com/royashbrook/lifescored/issues>

A useful title looks like `rule: credit-score weight too high` or `new rule: caregiving / unpaid labor`. The body can be short — the rule id, the change, and the citation are what matter.

## Principles a change should respect

- **Cite or flag.** Every rule is either sourced to public evidence or explicitly marked speculative. No silent guesses.
- **Constrained-subtractive.** A rule may score negative only where the cited system itself subtracts (FICO delinquency, license points, underwater net worth, eviction) — and never more than it can add, unless the cited system does exactly that.
- **Measure the target, not the proxy.** Protected characteristics are deliberately excluded; once wealth, debt, health, and neighborhood are measured directly, a protected-class term only double-counts them.
- **Privacy is the moat.** Nothing a person enters is ever sent to a server. Any change must keep computation client-side / agent-side.

## Code contributions

If you do want to touch code: the scoring engine is a pure function (`src/lib/engine/score.ts`) over a declarative rulebook (`src/lib/rulebook/`). Rules are plain data with a `position(inputs)` function, declared `bounds`, a `source`, and a `weightRationale`. Add or change a rule there; the website, `rules.json`, and the MCP layer all derive from the same source. Run `npm test`, `npm run check`, and `npm run test:e2e` before opening a PR. Commits reference an issue number (`#N`).
