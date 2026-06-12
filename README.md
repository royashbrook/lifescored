# life. scored.

**You are already a number.**

A credit score, an actuarial row, a callback probability — this app rebuilds those numbers in the open: every rule cited or flagged as a guess, every weight visible and editable. Transparency, not judgment.

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
evidence tag (`SOURCED`/`SPECULATIVE`), citation with access date, a pure
`position(inputs)` (the measured fact, normalized to a numeric position), declared
`bounds` (negative floors only where the cited system itself subtracts; the wealth
rules are uncapped above), and a `weightRationale` justifying its weight against
the 1.0× income baseline; the engine computes `points = round(position × weight)`.
Add a rule, and the UI, weight editor, share
codec, and about-page source list pick it up automatically. `npm test` enforces
the invariants (bounds, integer scores, citation present).
