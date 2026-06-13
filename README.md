# life. scored.

[![deploy](https://github.com/royashbrook/lifescored/actions/workflows/deploy.yml/badge.svg)](https://github.com/royashbrook/lifescored/actions/workflows/deploy.yml)

**You are already a number.**

A credit score, an actuarial row, a callback probability — this app rebuilds those numbers in the open: every rule cited or flagged as a guess, every weight visible and editable. Transparency, not judgment.

## Stack

- Svelte 5 + SvelteKit, prerendered static pages, deployed to Cloudflare Workers
- One dynamic endpoint: `POST /api/narrative` — KV-cached Gemini narratives with a
  deterministic local fallback (the app is fully functional with no API key at all)
- All user data stays in the browser (localStorage + URL-fragment share links)
- Traffic is measured with Cloudflare Web Analytics — cookieless and aggregate; it cannot see your inputs, which never leave your device anyway.

## Develop

    npm install
    npm run dev      # app at localhost:5173 (narrative falls back to local composer)
    npm test         # vitest suite: rulebook invariants, engine, codec, worker handler
    npm run check    # svelte-check

## Deploy (Cloudflare free tier)

Deploys run automatically from GitHub Actions on every push to `main`
([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)): the workflow
runs the full test suite + typecheck, and only then builds and deploys.

**One-time setup:**

1. Create the KV namespace and paste its id into `wrangler.jsonc`:

       npx wrangler kv namespace create NARRATIVE_KV

2. Set the Gemini key as a Worker secret (persists across deploys; optional —
   omit to run AI-free with the local narrative fallback):

       npx wrangler secret put GEMINI_API_KEY

3. Add two repository secrets in GitHub
   (Settings → Secrets and variables → Actions):

   - `CLOUDFLARE_API_TOKEN` — a token with the *Edit Cloudflare Workers* template
   - `CLOUDFLARE_ACCOUNT_ID` — your account id

Push to `main` and the action ships it. To deploy by hand instead:

       npm run deploy

## Deploy your own

Fork the repo, do the one-time setup above with your own Cloudflare account, and
push. The app is fully functional with no Gemini key at all.

## Editing the rulebook

Rules live in `src/lib/rulebook/<domain>.ts`. Each rule is declarative: logic,
evidence tag (`SOURCED`/`SPECULATIVE`), citation with access date, a pure
`position(inputs)` (the measured fact, normalized to a numeric position), declared
`bounds` (negative floors only where the cited system itself subtracts; the wealth
rules are uncapped above), and a `weightRationale` justifying its weight against
the 1.0× income baseline; the engine computes `points = round(position × weight)`.
Add a rule, and the UI, weight editor, share
codec, and about-page source list pick it up automatically. `npm test` enforces
the invariants (bounds, integer scores, citation present).

## Contributing

Every commit must reference a GitHub issue number, e.g. `feat: add presets (#2)` or `refs #5`. A `commit-msg` hook enforces this automatically — it is installed via `core.hooksPath` pointing to `.githooks/`, which activates on `npm install` (the `prepare` script runs `git config core.hooksPath .githooks`). Merge commits and reverts are exempt. To find or open an issue: `gh issue list` / `gh issue create`.

## License

MIT — see LICENSE.
