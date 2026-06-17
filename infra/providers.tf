# OpenTofu config for the lifescored.com Cloudflare zone: the "clicky layer" (DNS, zone
# settings, redirect rules, email routing) as declarative IaC. wrangler still owns the worker
# code deploy and the apex custom domain; this owns everything around it.
#
# Auth: the CF API token is injected from the keychain at run time, never written here:
#   secret run CLOUDFLARE_API_TOKEN=lifescored-iac-token -- tofu plan
# (the cloudflare provider reads CLOUDFLARE_API_TOKEN from the env automatically.)

terraform {
  required_version = ">= 1.9"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }

  # State lives in an R2 bucket (S3-compatible), per-project and locked so CI and any other
  # applier agree on reality. The R2 S3 creds come from the env (AWS_ACCESS_KEY_ID /
  # AWS_SECRET_ACCESS_KEY) at run time, never hardcoded. The skip_*/use_path_style/
  # skip_s3_checksum flags are the standard "this is R2, not real AWS S3" set; use_lockfile is
  # S3-native locking (no DynamoDB).
  backend "s3" {
    bucket                      = "lifescored-tfstate"
    key                         = "lifescored.tfstate"
    region                      = "auto"
    endpoints                   = { s3 = "https://b13c1cf2483bdad430b91ae25126e984.r2.cloudflarestorage.com" }
    skip_credentials_validation = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
    skip_s3_checksum            = true
    use_path_style              = true
    use_lockfile                = true
  }
}

provider "cloudflare" {}

# Stable identifiers for lifescored.com (zone) + Roy's account. Not secret.
locals {
  account_id = "b13c1cf2483bdad430b91ae25126e984"
  zone_id    = "2851c4ac578d70bb15dea52d51af2576"
}
