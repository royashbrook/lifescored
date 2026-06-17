# infra — lifescored.com Cloudflare config as IaC (OpenTofu)

The Cloudflare config *around* the worker, managed declaratively with [OpenTofu](https://opentofu.org)
and the `cloudflare` provider. The worker code itself is **not** here — wrangler owns that.

## the ownership boundary (important)

Each Cloudflare resource has exactly **one** owner, so the two tools never fight:

| Owner        | Owns                                                                          |
|--------------|-------------------------------------------------------------------------------|
| **wrangler** | the worker code + bindings (`wrangler.jsonc`) and the **apex** custom domain   |
| **OpenTofu** | DNS records, zone settings (HSTS, Always Use HTTPS), the `www`→apex redirect rule, email routing catch-all |

`www` is deliberately **not** a worker custom domain — it's a proxied `CNAME` → apex (managed here)
that the redirect rule 301s at the edge before any worker runs. Don't add `www` to `wrangler.jsonc`.
The apex's proxied `AAAA 100::` record is wrangler's and is intentionally not imported here.

## what's managed

- `dns.tf` — the `www` CNAME, the email MX + SPF/DKIM records, and the anti-spoof TXT (DMARC + null-DKIM).
- `settings.tf` — HSTS + Always Use HTTPS zone settings.
- `rules.tf` — the `www`→apex single redirect (dynamic-redirect phase).
- `email.tf` — the `*@lifescored.com` → gmail catch-all.
- `imports.tf` — import blocks used to adopt the existing resources (kept as the bootstrap record).

Not managed: `cloudflare_email_routing_settings` (the zone enable/status endpoint). Its read
(`GET /email/routing`) 403'd on the IaC token even though the catch-all rule read fine. Email
routing is already enabled in the dashboard; the catch-all (the actual forwarding) is managed here.

## auth

The CF API token is account-owned, scoped to the `lifescored.com` zone, with: DNS:Edit,
Zone Settings:Edit, Dynamic URL Redirects:Edit, Email Routing Rules. It is injected from the
keychain at run time and never written to disk. The R2 state-bucket creds come the same way.

```sh
SECRET=/Users/roy/.claude/skills/secrets/scripts/secret
RUN="$SECRET run CLOUDFLARE_API_TOKEN=lifescored-iac-token \
  AWS_ACCESS_KEY_ID=lifescored-r2-access-key-id \
  AWS_SECRET_ACCESS_KEY=lifescored-r2-secret-access-key --"
$RUN tofu -chdir=infra plan     # review the diff
$RUN tofu -chdir=infra apply    # apply it
```

## state

State lives in the R2 bucket `lifescored-tfstate` (S3-compatible backend, locked via `use_lockfile`).
The provider lock file (`.terraform.lock.hcl`) **is** committed — it pins the version.

## adding/changing a resource

1. edit (or add) the `.tf` file.
2. `tofu plan` — read the diff. zone-setting resources can't be destroyed from TF, only re-set.
3. `tofu apply` (or just merge — CI applies on push to main).

To **adopt** an existing CF resource instead of recreating it: add an `import` block, run
`tofu plan -generate-config-out=generated.tf` (the provider writes matching HCL from live reality —
don't hand-author the v5 schema), tidy it into the right file, then `apply`. A `cloudflare_ruleset`
import id needs the `zones/<zone_id>/<ruleset_id>` prefix; DNS records use the plain
`<zone_id>/<record_id>` form. The token's permissions grow per resource type — if a step returns an
`Authentication error` / 403, Cloudflare is naming a permission to add to the same token.

## CI

`.github/workflows/infra.yml`: PRs touching `infra/**` get a `tofu plan` posted as a comment; merges
to main run `tofu apply`. Reads `TF_CLOUDFLARE_API_TOKEN` + `R2_ACCESS_KEY_ID` +
`R2_SECRET_ACCESS_KEY` from repo secrets. `deploy.yml` ignores `infra/**` so a tofu change doesn't
rebuild the worker.
