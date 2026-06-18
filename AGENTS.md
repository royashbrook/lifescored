# AGENTS.md

[lifescored.com](https://lifescored.com) — a Svelte 5 / SvelteKit transparency app on Cloudflare
Workers that rebuilds the scores real systems already run on people (credit bureaus, actuarial life
tables, lenders, audit studies), in the open: every rule cited or flagged as a guess, every weight
editable. This is the vendor-neutral guide for any agent. (Claude Code reads `CLAUDE.md`, which points
here.)

## Using lifescored AS an agent (to compute a score)

You don't need this repo, and you must never send a person's answers to lifescored.com — it computes
on your side:

- **Skill:** [`skills/lifescored/SKILL.md`](skills/lifescored/SKILL.md) — drop it into your agent's skills directory.
- **Rulebook + exact math:** `https://lifescored.com/rules.json` · index `…/llms.txt` · full prose `…/llms-full.txt`
- **MCP server:** `com.lifescored/mcp` (tools: `get_rulebook`, `get_input_schema`, `get_methodology`, `how_to_give_feedback`)

## Working ON this repo

### Setup
```
npm install        # also installs the commit-msg hook (core.hooksPath → .githooks)
```

### The gate — all must pass before a PR merges
```
npm run check      # svelte-check + types
npm test           # vitest: rulebook invariants, engine, codec, worker handler
npm run test:e2e   # playwright
npm run build
```

### Conventions
- **Every commit references a GitHub issue**, e.g. `feat: add presets (#2)`. A `commit-msg` hook enforces it (merges/reverts exempt). Find or open one: `gh issue list` / `gh issue create`.
- **Branch → PR → merge to `main`.** CI runs the full gate, then builds and deploys ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)). Don't commit straight to `main`.
- **Single source of truth:** `rules.json`, `llms-full.txt`, and the MCP server are all generated from [`src/lib/rulebook/export.ts`](src/lib/rulebook/export.ts). Never hand-edit a generated output — change the rulebook or the generator and they all update together.

### The rulebook
Rules live in `src/lib/rulebook/<domain>.ts`, declarative: a pure `position(inputs)` (the measured
fact, normalized 0–1), `bounds` (negative only where the cited system itself subtracts), a
`defaultWeight`, an evidence tag (`SOURCED` / `SPECULATIVE`), a cited `source` with an access date,
and a `weightRationale`. Add a rule and the UI, weight editor, share codec, and exports pick it up
automatically. `npm test` enforces the invariants (bounds, integer points, citation present).

### Privacy invariants (non-negotiable — this is the product)
- Inputs **never leave the device**; the site computes client-side.
- `/api/narrative` sends only **rounded, quantized subtotals** to the LLM — never raw inputs.
- Share links encode answers in the URL **fragment** (never sent to the server) and are stripped on load.
- No tracking, accounts, data sales, or affiliate links.

### Secrets
Managed with [hush](https://github.com/royashbrook/hush) (see the README "Deploy" setup): stored once
in the keychain, piped straight into `wrangler` / `gh`, never printed or committed. `.env` and
`.dev.vars` are gitignored.

### Infra
Cloudflare free tier. OpenTofu owns DNS / zone settings / redirect / email (`infra/`, plan-on-PR /
apply-on-merge). Wrangler owns the Worker and the apex custom domain — never import those into OpenTofu.
