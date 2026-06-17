# lifescored.com DNS records, imported from live reality 2026-06-16 (see imports.tf).
# The APEX (lifescored.com) stays a WORKER custom domain owned by wrangler; its proxied AAAA 100::
# record is not managed here. www is a proxied CNAME -> apex that the redirect rule (rules.tf) 301s
# at the edge before any worker runs.
resource "cloudflare_dns_record" "www_cname" {
  zone_id = local.zone_id
  name    = "www.lifescored.com"
  type    = "CNAME"
  content = "lifescored.com"
  proxied = true
  ttl     = 1
}

# --- CF Email Routing records (MX + SPF + the cf2024 DKIM, created by the feature) ---
resource "cloudflare_dns_record" "mx_route1" {
  zone_id  = local.zone_id
  name     = "lifescored.com"
  type     = "MX"
  content  = "route1.mx.cloudflare.net"
  priority = 17
  proxied  = false
  ttl      = 1
}

resource "cloudflare_dns_record" "mx_route2" {
  zone_id  = local.zone_id
  name     = "lifescored.com"
  type     = "MX"
  content  = "route2.mx.cloudflare.net"
  priority = 37
  proxied  = false
  ttl      = 1
}

resource "cloudflare_dns_record" "mx_route3" {
  zone_id  = local.zone_id
  name     = "lifescored.com"
  type     = "MX"
  content  = "route3.mx.cloudflare.net"
  priority = 83
  proxied  = false
  ttl      = 1
}

resource "cloudflare_dns_record" "txt_spf" {
  zone_id = local.zone_id
  name    = "lifescored.com"
  type    = "TXT"
  content = "\"v=spf1 include:_spf.mx.cloudflare.net ~all\""
  proxied = false
  ttl     = 1
}

resource "cloudflare_dns_record" "txt_dkim_cf2024" {
  zone_id = local.zone_id
  name    = "cf2024-1._domainkey.lifescored.com"
  type    = "TXT"
  content = "\"v=DKIM1; h=sha256; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAiweykoi+o48IOGuP7GR3X0MOExCUDY/BCRHoWBnh3rChl7WhdyCxW3jgq1daEjPPqoi7sJvdg5hEQVsgVRQP4DcnQDVjGMbASQtrY4WmB1VebF+RPJB2ECPsEDTpeiI5ZyUAwJaVX7r6bznU67g7LvFq35yIo4sdlmtZGV+i0H4cpYH9+3JJ78k\" \"m4KXwaf9xUJCWF6nxeD+qG6Fyruw1Qlbds2r85U9dkNDVAS3gioCvELryh1TxKGiVTkg4wqHTyHfWsp7KD3WQHYJn0RyfJJu6YEmL77zonn7p2SRMvTMP3ZEXibnC9gz3nnhR6wcYL8Q7zXypKTMD58bTixDSJwIDAQAB\""
  proxied = false
  ttl     = 1
}

# --- anti-spoof (hand-set: DMARC reject + null-DKIM) ---
resource "cloudflare_dns_record" "txt_dmarc" {
  zone_id = local.zone_id
  name    = "_dmarc.lifescored.com"
  type    = "TXT"
  content = "\"v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s;\""
  proxied = false
  ttl     = 1
}

resource "cloudflare_dns_record" "txt_dkim_null" {
  zone_id = local.zone_id
  name    = "*._domainkey.lifescored.com"
  type    = "TXT"
  content = "\"v=DKIM1; p=\""
  proxied = false
  ttl     = 1
}
