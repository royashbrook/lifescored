# lifescored.com redirect rules. The www->apex single redirect (CF "Redirect from WWW to root"
# template): wildcard https://www.* -> https://${1}, 301, query string preserved. Fires in CF's
# dynamic-redirect phase, BEFORE the worker, which is why www never needs to be a worker route.
resource "cloudflare_ruleset" "www_redirect" {
  zone_id = local.zone_id
  kind    = "zone"
  name    = "default"
  phase   = "http_request_dynamic_redirect"
  rules = [
    {
      action      = "redirect"
      description = "Redirect from WWW to root [Template]"
      enabled     = true
      expression  = "(http.request.full_uri wildcard r\"https://www.*\")"
      ref         = "cab23b13afc848a1a6ae2c778dad1c99"
      action_parameters = {
        from_value = {
          preserve_query_string = true
          status_code           = 301
          target_url = {
            expression = "wildcard_replace(http.request.full_uri, r\"https://www.*\", r\"https://$${1}\")"
          }
        }
      }
    },
  ]
}
