# ---------------------------------------------------------------------------
# Azure Front Door Standard + WAF Policy
# ---------------------------------------------------------------------------
# Single public ingress point for both the SPA (/*) and the API (/api/*).
#
# Routing:
#   /api/*  →  api-origins  →  ca-hellowork-api Container App  (priority 100)
#   /*      →  spa-origins  →  stapp-hellowork Static Web App  (priority 200)
#
# The lower priority number wins when both patterns match a request.
# A request to /api/profiles matches api-route (100) not spa-route (200).
#
# WAF: Prevention mode + Microsoft_DefaultRuleSet 2.1 (OWASP 3.2 equivalent)
#      + custom rate-limit rule: 100 req/min per client IP.
#
# X-Azure-FDID header: Azure Front Door automatically adds this header to
# every forwarded request. The Container App middleware validates it against
# the expected Front Door profile ID (AZURE_FRONT_DOOR_ID env var) to reject
# direct-to-origin requests.
# ---------------------------------------------------------------------------

# Stable Container App FQDN (app-level, not revision-specific).
# Format: <app-name>.<cae-default-domain>
# This does not change between revisions in Single revision mode.
locals {
  container_app_fqdn = "${module.container_app.name}.${module.cae.default_domain}"
}

module "frontdoor" {
  source = "git::https://github.com/AgicCompany/Standard.Terraform-Modules.git//modules/front-door?ref=front-door/v1.1.0"

  resource_group_name = azurerm_resource_group.main.name
  name                = "afd-hellowork"

  endpoints = {
    hellowork = {}
  }

  origin_groups = {
    api-origins = {
      health_probe = {
        path                = "/health"
        protocol            = "Https"
        interval_in_seconds = 30
        request_type        = "HEAD"
      }
    }
    spa-origins = {
      health_probe = {
        path                = "/"
        protocol            = "Https"
        interval_in_seconds = 60
        request_type        = "HEAD"
      }
    }
  }

  origins = {
    ca-api = {
      origin_group_name              = "api-origins"
      host_name                      = local.container_app_fqdn
      certificate_name_check_enabled = true
    }
    stapp-spa = {
      origin_group_name              = "spa-origins"
      host_name                      = module.stapp.default_host_name
      certificate_name_check_enabled = true
    }
  }

  routes = {
    # /api/* → Container App (higher priority = lower number)
    api-route = {
      endpoint_name          = "hellowork"
      origin_group_name      = "api-origins"
      patterns_to_match      = ["/api/*"]
      forwarding_protocol    = "HttpsOnly"
      https_redirect_enabled = true
      supported_protocols    = ["Http", "Https"]
    }
    # /* → Static Web App (lower priority = higher number)
    spa-route = {
      endpoint_name          = "hellowork"
      origin_group_name      = "spa-origins"
      patterns_to_match      = ["/*"]
      forwarding_protocol    = "HttpsOnly"
      https_redirect_enabled = true
      supported_protocols    = ["Http", "Https"]
    }
  }

  waf = {
    name          = "wafpolhellowork"
    mode          = "Prevention"
    managed_rules = []
  }

  tags = local.common_tags
}
