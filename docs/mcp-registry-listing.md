# MCP registry listing — life. scored.

Ready-to-submit metadata for listing the life. scored. MCP server in public registries
(e.g. the official MCP registry at https://registry.modelcontextprotocol.io, Smithery,
PulseMCP, Glama). **Submitting is a publish action — do it when you're ready.**

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
