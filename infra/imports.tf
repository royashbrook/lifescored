# Import blocks: adopt the EXISTING lifescored.com resources into OpenTofu state without
# recreating them. `tofu plan -generate-config-out=generated.tf` reads live reality and writes
# matching HCL, so we don't hand-guess the v5 provider schema. Ids pulled live 2026-06-16.
#
# The apex AAAA 100:: (proxied) is the WORKER custom-domain record, owned by wrangler. It is
# intentionally NOT imported. There is no www AAAA 100::, so www is already a CNAME + redirect
# rule, not a worker custom domain.

# --- DNS records ---
import {
  to = cloudflare_dns_record.www_cname
  id = "2851c4ac578d70bb15dea52d51af2576/5dada2bc63e39df2f99bf0c5f4be4ced"
}
import {
  to = cloudflare_dns_record.mx_route1
  id = "2851c4ac578d70bb15dea52d51af2576/6ffbac66844e0fc0cfde6da121edf3a4"
}
import {
  to = cloudflare_dns_record.mx_route2
  id = "2851c4ac578d70bb15dea52d51af2576/024c732ec69b5b35397bcceaaba745b9"
}
import {
  to = cloudflare_dns_record.mx_route3
  id = "2851c4ac578d70bb15dea52d51af2576/09e38b2e3f48cb29b98506c117cf03a2"
}
import {
  to = cloudflare_dns_record.txt_spf
  id = "2851c4ac578d70bb15dea52d51af2576/6703747dce05ad83eda5afa8b59de818"
}
import {
  to = cloudflare_dns_record.txt_dkim_cf2024
  id = "2851c4ac578d70bb15dea52d51af2576/960d620f71f169e0dbcfe8a8cd61d3ab"
}
import {
  to = cloudflare_dns_record.txt_dmarc
  id = "2851c4ac578d70bb15dea52d51af2576/2d8e807ccd63735c7b2764a9f2e0f897"
}
import {
  to = cloudflare_dns_record.txt_dkim_null
  id = "2851c4ac578d70bb15dea52d51af2576/84ecb2b79f84a7089cc2ab9f76a7211a"
}

# --- redirect rule (www -> apex) + email routing catch-all ---
# NOTE: cloudflare_email_routing_settings (the zone enable/status endpoint, GET /email/routing)
# 403'd on this token even though the catch-all rule read fine, so it is intentionally not
# managed here. The catch-all below is the meaningful forwarding config.
import {
  to = cloudflare_ruleset.www_redirect
  id = "zones/2851c4ac578d70bb15dea52d51af2576/e7b6ae5473f34705a2403e5ead026a6b"
}
import {
  to = cloudflare_email_routing_catch_all.this
  id = "2851c4ac578d70bb15dea52d51af2576"
}
