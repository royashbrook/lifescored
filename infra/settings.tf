# lifescored.com zone settings as IaC.

# Always Use HTTPS — CF edge 301s any http:// to https:// before the worker runs. Already on in the
# dashboard; declared here so it is tracked and enforced declaratively.
resource "cloudflare_zone_setting" "always_use_https" {
  zone_id    = local.zone_id
  setting_id = "always_use_https"
  value      = "on"
}

# HSTS (HTTP Strict Transport Security). This is the ONE real change in this adoption: every other
# resource is an import of what already exists. Browsers that have seen this header refuse plain
# http for lifescored.com + its subdomains for max_age, hardening the https-everywhere posture
# (Always Use HTTPS sets the edge redirect; HSTS pins it browser-side). preload is deliberately OFF
# — it is the genuinely hard-to-undo browser-preload-list commitment, kept as an escape hatch.
resource "cloudflare_zone_setting" "hsts" {
  zone_id    = local.zone_id
  setting_id = "security_header"
  value = {
    strict_transport_security = {
      enabled            = true
      max_age            = 15552000 # 6 months
      include_subdomains = true
      nosniff            = true
      preload            = false
    }
  }
}
