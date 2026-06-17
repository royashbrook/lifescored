# lifescored.com email routing: the *@lifescored.com -> gmail catch-all forwarding, as IaC.
# (The MX/SPF/DKIM DNS records the feature creates live in dns.tf. The zone-level
# cloudflare_email_routing_settings resource is intentionally NOT managed here: its read endpoint
# GET /email/routing 403'd on this token even though the catch-all rule below read fine. See
# imports.tf. Email routing is already enabled in the dashboard, so this manages the forwarding.)
resource "cloudflare_email_routing_catch_all" "this" {
  zone_id  = local.zone_id
  enabled  = true
  name     = ""
  matchers = [{ type = "all" }]
  actions  = [{ type = "forward", value = ["royashbrook@gmail.com"] }]
}
