# Go-to-market plan — lifescored.com on Cloudflare

**Date:** 2026-06-12 · **Decisions locked:** CF Web Analytics (cookieless) · public GitHub repo, MIT · AI narrative live at launch

The growth loop is the share link: someone scores themselves, tunes the weights,
shares the URL; the recipient lands on a working profile and scores themselves.
Everything below either removes friction from that loop or keeps the privacy
story airtight.

---

## Phase 1 — Launch-readiness code (agent work, on a branch)

### 1.1 Social cards (the growth loop depends on these)
- `src/app.html` head: `og:title` ("life. scored."), `og:description` (the
  tagline + one line), `og:image` (`https://lifescored.com/og.png`), `og:url`,
  `og:type=website`, `twitter:card=summary_large_image`.
- `static/og.png` — 1200×630, brand: dark `#14161a` field, Fraunces wordmark
  "life. scored." large, tagline "You are already a number." in Newsreader
  below, thin accent rule in `--moves` gold. Generate by writing a standalone
  `og.html` and screenshotting headless Chrome at exactly 1200×630.
- Note: URL fragments (`#p=…`) never reach servers, so every shared link shows
  the same card — by design (no per-profile leakage into previews).

### 1.2 Branded favicon
- Replace the scaffold `static/favicon.svg`: dark rounded square, white
  "l." (Fraunces, the period in `--moves` gold). Add `static/favicon.png`
  (180×180, same headless-Chrome route) and an `apple-touch-icon` link.

### 1.3 LICENSE + repo hygiene
- `LICENSE` — MIT, "Copyright (c) 2026 Roy Ashbrook".
- README: license section, "deploy your own" pointer, privacy note gains the
  analytics sentence (below).

### 1.4 sitemap + robots
- `static/sitemap.xml` — the three URLs at lifescored.com.
- `static/robots.txt` — keep allow-all, add `Sitemap:` line.

### 1.5 Branded error page
- `src/routes/+error.svelte` — wordmark + "that page doesn't score." + link home.

### 1.6 Analytics disclosure (no code beacon)
- CF Web Analytics will be enabled via dashboard auto-injection (site is CF-proxied),
  so NO snippet in the repo. Add one sentence to the about page privacy section:
  "Traffic is measured with Cloudflare Web Analytics — cookieless and aggregate;
  it cannot see your inputs, which never leave your device anyway."

### 1.7 Verification
- Full suite + check + build; smoke: og tags present in prerendered HTML,
  og.png exists at 1200×630, favicon renders, /nonexistent shows branded error.

## Phase 2 — Ops runbook (Roy's account; agent assists where authorized)

| # | Step | Who |
|---|------|-----|
| 2.1 | Register **lifescored.com** at Cloudflare Registrar | Roy |
| 2.2 | `npx wrangler login` | Roy |
| 2.3 | `npx wrangler kv namespace create NARRATIVE_KV` → paste id into wrangler.jsonc (replacing TO_BE_CREATED_AT_DEPLOY), commit | either |
| 2.4 | `npx wrangler secret put GEMINI_API_KEY` (key from aistudio.google.com) | Roy |
| 2.5 | `npm run deploy` | either |
| 2.6 | Dashboard: Workers → lifescored → Domains & Routes → add lifescored.com (+ www redirect) | Roy |
| 2.7 | Dashboard: Analytics → Web Analytics → enable for lifescored.com (auto-inject) | Roy |
| 2.8 | Create public GitHub repo `royashbrook/lifescored`, push main, set description "You are already a number. Every rule cited, every weight editable." + topics (svelte, cloudflare-workers, transparency) | either (gh CLI) |

## Phase 3 — Production verification (agent, after 2.5)

- All three pages 200 on the workers.dev URL and then the custom domain.
- Share-link round trip on production.
- One real `POST /api/narrative` → AI text; immediate repeat → cache hit
  (same text, fast); confirm `narr:` key visible in KV dashboard.
- OG card check via opengraph validator (or curl + eyeball the tags).
- Lighthouse pass (expect high 90s — static, self-hosted fonts).

## Phase 4 — Launch checklist (content, Roy's voice, drafts provided)

- **Show HN** draft: "Show HN: life. scored. – the rulebook behind credit
  scores, actuarial tables, and audit studies, with every weight editable".
  Body: the thesis (you're already a number), what's cited vs flagged
  speculative, the privacy design (fragment share links, local-first), the
  uncapped-wealth rule as the hook ("a trillionaire scores 175× you — we show
  the math"). Open-source link.
- **Reddit**: r/personalfinance (rules-permitting), r/dataisbeautiful (the
  breakdown screenshot), r/InternetIsBeautiful.
- **X/LinkedIn**: the Musk receipt screenshot ("position 66.1 × weight 1.6× =
  +106 — ×6.6 over scale") is the single most shareable artifact.
- Week 1: watch CF analytics + KV budget counter daily; the Gemini budget guard
  caps worst-case at 200 calls/day regardless of traffic.

## Out of scope (post-launch backlog)
Rule packs, percentile comparisons, per-profile OG images (would require
server-side rendering of fragments — privacy tradeoff, currently rejected),
newsletter/domain email.

---

## Phase 2b — CI/CD via GitHub Actions (supersedes manual `npm run deploy`)

Deploy is now GitHub-driven: push to `main` → `.github/workflows/deploy.yml`
runs `npm ci && npm test && npm run check` (gate), then `npm run build` +
`cloudflare/wrangler-action@v3` (deploy). Manual `npm run deploy` remains as a
fallback.

**Files prepped (committed):** `.github/workflows/deploy.yml`, `wrangler.jsonc`
(KV id placeholder + loud comment), README deploy section + CI badge.

**Runbook (order matters — repo must exist before secrets/Actions):**

| # | Step | Who | Command / location |
|---|------|-----|--------------------|
| 1 | Create public repo `royashbrook/lifescored`, push `main` | agent (gh authed) | `gh repo create royashbrook/lifescored --public --source . --remote origin --description "You are already a number. Every rule cited, every weight editable." --push` |
| 2 | Add repo topics | agent | `gh repo edit --add-topic svelte,cloudflare-workers,transparency,life-score` |
| 3 | Create KV namespace, paste id into `wrangler.jsonc`, commit + push | Roy creates / agent commits | `npx wrangler kv namespace create NARRATIVE_KV` |
| 4 | Set Worker secret `GEMINI_API_KEY` (one-time, persists) | Roy | `npx wrangler secret put GEMINI_API_KEY` |
| 5 | Add GitHub Actions secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | Roy (or agent via gh) | `gh secret set CLOUDFLARE_API_TOKEN` / `gh secret set CLOUDFLARE_ACCOUNT_ID` |
| 6 | Trigger first deploy | either | push any commit, or `gh workflow run deploy.yml` |
| 7 | Attach `lifescored.com` to the Worker | Roy | CF dashboard → Workers → lifescored → Domains & Routes |
| 8 | Enable Web Analytics for the domain | Roy | CF dashboard → Analytics → Web Analytics |

**Notes.**
- The CF API token needs the *Edit Cloudflare Workers* template (Workers Scripts
  + Workers KV write + the account/zone it runs in). Roy has tokens already from
  other projects — reuse one with that scope or mint a fresh scoped token.
- KV namespace ids are **not** secret and belong in `wrangler.jsonc`. Only the
  API token, account id, and Gemini key are secrets.
- `wrangler deploy` does not wipe Worker secrets, so `GEMINI_API_KEY` (step 4)
  survives every CI deploy — it is never referenced in the workflow.
- First push will **fail at the deploy job** until steps 3 (KV id) and 5 (CF
  secrets) are done; the test job still runs and gates. This is expected — fix
  forward by completing setup, then re-run.
