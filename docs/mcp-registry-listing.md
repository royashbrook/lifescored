# MCP registry listing — life. scored.

**Status: PUBLISHED to the official registry** as `com.lifescored/mcp` (v1.0.0, active).
Source of truth is [`server.json`](../server.json) at the repo root.

## How it's published / how to re-publish

- **Namespace:** `com.lifescored/mcp` (reverse-DNS of the domain we own).
- **Ownership proof:** HTTP file auth — `static/.well-known/mcp-registry-auth` serves the Ed25519
  **public** key at https://lifescored.com/.well-known/mcp-registry-auth. No DNS record involved.
- **Signing key:** the private seed lives only in the macOS Keychain as `mcp-registry-signing-key`
  (minted via the secrets skill; never committed, never printed). Re-mint = re-prove (regenerate the
  proof file from the new seed and redeploy).
- **Re-publish (CI — the normal path):** edit `server.json`, **bump `version`**, and merge to `main`.
  `.github/workflows/publish-mcp.yml` runs on `server.json` changes (and manual dispatch),
  authenticates with the `MCP_PRIVATE_KEY` repo secret, and publishes. A guard skips the publish if
  the version is already live, so re-runs and non-version edits don't fail.
- **Re-publish (local fallback):**
  ```bash
  SECRET=/Users/roy/.claude/skills/secrets/scripts/secret
  $SECRET run KEY=mcp-registry-signing-key -- bash -c \
    'mcp-publisher login http --domain lifescored.com --private-key "$KEY"'
  mcp-publisher publish
  ```
- **Rotate the signing key:** re-mint locally, regenerate the proof file (`static/.well-known/mcp-registry-auth`)
  and redeploy, then push the new key to GitHub: `$SECRET pipe mcp-registry-signing-key -- gh secret set MCP_PRIVATE_KEY`.
- Verify any publish: `curl -s "https://registry.modelcontextprotocol.io/v0/servers?search=lifescored"`.

## Other directories

Only **PulseMCP** auto-mirrors the official registry (≈weekly) — no action needed; we appear there
automatically and updates flow through. The rest are independent, one-time submissions (not per-change
maintenance), and most are account/OAuth-gated web forms:

- **PulseMCP** — automatic (mirrors the official registry). Nothing to do.
- **Glama** — crawls public GitHub on its own; *claiming/verifying* the listing is a one-time web form + build checks.
- **Smithery** — independent submission; oriented to hosted HTTP endpoints.
- **mcp.so** — web form + GitHub login.
- **awesome-mcp-servers** — GitHub PR (wants a Glama badge).

`server.json` is a stable remote URL + description that essentially never changes, so there's no
ongoing cross-directory sync to keep up with. The metadata below is kept for any manual form.

## Core fields

- **Name:** life. scored.
- **Slug / id:** `lifescored` (or `io.lifescored/mcp` namespaced)
- **Endpoint URL:** `https://lifescored.com/mcp`
- **Transport:** Streamable HTTP (stateless; no SSE, no sessions)
- **Auth:** none
- **Homepage:** https://lifescored.com
- **Source:** https://github.com/royashbrook/lifescored
- **License:** (match the repo's license)

## Short description (one line)

> Rebuilds the scores real systems already run on you — credit, actuarial, lending — in the open, with every rule cited. The server relays the rulebook and math; your agent computes the score locally, so no personal data is ever sent.

## Long description

life. scored. is a transparency tool that exposes how real-world systems (credit bureaus, actuarial life tables, lenders, audit-study research) turn a person into a number. This MCP server is a **discovery and relay layer**: it performs no computation and accepts no personal data. It hands an agent the complete rulebook, the input schema, the exact math, and the methodology, so the agent can ask the user what's needed and compute a life score entirely on its own side. Inputs never reach the server — the same privacy guarantee as the website.

## Tools

| Tool | Args | Purpose |
|------|------|---------|
| `get_rulebook` | none | Full rulebook + math: rules (weight, bounds, evidence, source, formula), input schema, engine constants. |
| `get_input_schema` | none | Just the fields to ask the user for (types, ranges, defaults, help). |
| `get_methodology` | none | How scoring works, governing principles, what's left out, privacy. |
| `how_to_give_feedback` | none | How to propose a better weight, source, or new rule via GitHub. |

Every tool takes **no arguments** — the server cannot receive personal data by design.

## Tags / categories

`transparency`, `finance`, `credit-score`, `personal-data`, `privacy`, `education`, `civic`

## Privacy note (for registries that surface one)

No authentication, no data collection, no storage, no logging of inputs. The server only serves public rules; all scoring happens client/agent-side.
