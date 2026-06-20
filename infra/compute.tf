# ---------------------------------------------------------------------------
# Container Apps Environment (VNet-integrated, external LB)
# ---------------------------------------------------------------------------
# enable_internal_load_balancer = false (default): environment is externally
# accessible. Front Door is the only permitted ingress path because the
# Container App enforces the X-Azure-FDID header in FastAPI middleware.
#
# infrastructure_subnet_id = snet-cae: VNet integration enables the Container
# App to reach private resources inside the VNet (PostgreSQL delegation,
# Key Vault PE, Blob Storage PE) without traversing the public internet.
# ---------------------------------------------------------------------------

module "cae" {
  source = "git::https://github.com/AgicCompany/Standard.Terraform-Modules.git//modules/container-app-environment?ref=container-app-environment/v1.0.0"

  resource_group_name        = azurerm_resource_group.main.name
  location                   = var.location
  name                       = "cae-hellowork"
  log_analytics_workspace_id = module.law.id

  # /23 subnet dedicated to the CAE (see networking.tf)
  infrastructure_subnet_id = module.vnet.subnet_ids["snet-cae"]

  tags = local.common_tags
}

# ---------------------------------------------------------------------------
# Container App — FastAPI Backend API
# ---------------------------------------------------------------------------
# Secrets are injected directly (not via Key Vault references) because the
# AGIC module uses map(string) for secrets. The values are sourced from
# Terraform outputs of PostgreSQL, Maps, and App Insights modules — they are
# never hardcoded and are marked sensitive in the state.
#
# Image lifecycle note:
#   The initial image is a Microsoft placeholder. CI/CD overrides it with:
#     terraform apply -var="api_image=acr-hellowork.azurecr.io/hellowork-api:<sha>"
#   Do NOT run terraform apply without passing api_image after CI/CD has
#   deployed a real image, or the placeholder will be re-applied.
# ---------------------------------------------------------------------------

module "container_app" {
  source = "git::https://github.com/AgicCompany/Standard.Terraform-Modules.git//modules/container-app?ref=container-app/v1.1.0"

  resource_group_name          = azurerm_resource_group.main.name
  name                         = "ca-hellowork-api"
  container_app_environment_id = module.cae.id

  container = {
    image  = var.api_image
    cpu    = 0.5
    memory = "1Gi"

    env = {
      # Plain-text env vars
      "APP_ENV" = {
        value = var.env
      }
      "AZURE_OPENAI_ENDPOINT" = {
        value = module.openai.endpoint
      }
      "AZURE_OPENAI_DEPLOYMENT" = {
        value = module.openai.deployment_name
      }
      "MATCHING_WEIGHTS_PROFESSIONAL" = {
        value = "0.40"
      }
      "MATCHING_WEIGHTS_AGENTIC" = {
        value = "0.35"
      }
      "MATCHING_WEIGHTS_HUMAN" = {
        value = "0.25"
      }
      "MATCH_CACHE_TTL_MINUTES" = {
        value = "60"
      }
      # Secret-backed env vars (resolved from Container App secret store)
      "DATABASE_URL" = {
        secret_name = "db-conn-string"
      }
      "AZURE_MAPS_KEY" = {
        secret_name = "maps-api-key"
      }
      "APPLICATIONINSIGHTS_CONNECTION_STRING" = {
        secret_name = "appinsights-conn-string"
      }
    }

    liveness_probe = {
      transport               = "HTTP"
      port                    = 8000
      path                    = "/health"
      initial_delay           = 10
      interval_seconds        = 30
      failure_count_threshold = 3
    }

    readiness_probe = {
      transport               = "HTTP"
      port                    = 8000
      path                    = "/health"
      initial_delay           = 5
      interval_seconds        = 10
      failure_count_threshold = 3
    }
  }

  # Secrets stored in the Container App secret store.
  # Values come from Terraform module outputs — never hardcoded.
  secrets = {
    "db-conn-string" = "postgresql+asyncpg://${var.postgres_admin_login}:${var.postgres_admin_password}@${module.postgresql.fqdn}/hellowork?sslmode=require"
    "maps-api-key"   = module.maps.primary_access_key
    "appinsights-conn-string" = data.azurerm_application_insights.appi.connection_string
  }

  # External ingress — Front Door routes /api/* here.
  # FastAPI middleware validates X-Azure-FDID header to reject direct access.
  enable_ingress          = true
  enable_external_ingress = true
  ingress = {
    target_port = 8000
    transport   = "http"
  }

  # User-assigned identity enables ACR image pull and all Azure service calls
  # (Key Vault, OpenAI, Blob Storage) without credentials in env vars.
  user_assigned_identity_ids = [module.api_identity.id]

  registries = [
    {
      server   = module.acr.login_server
      identity = module.api_identity.id
    }
  ]

  scale = {
    min_replicas = 0 # Scale to zero overnight (cost optimisation)
    max_replicas = 5
    rules = [
      {
        name = "http-scaling"
        http_scale_rule = {
          concurrent_requests = "50"
        }
      }
    ]
  }

  diagnostic_settings = {
    log_analytics_workspace_id = module.law.id
  }

  tags = local.common_tags
}

# ---------------------------------------------------------------------------
# Static Web App — React SPA (Free tier)
# ---------------------------------------------------------------------------
# Free tier is always publicly accessible — no mechanism to restrict to
# Front Door only. This is acceptable because the SPA is static HTML/JS and
# contains no sensitive server-side logic. All sensitive operations go
# through the API (Container App), which enforces AAD auth + FDID check.
#
# CI/CD uses the azure/static-web-apps-deploy GitHub Action to publish the
# Vite dist/ output. The deployment token is retrieved via:
#   az staticwebapp secrets list --name stapp-hellowork --query 'properties.apiKey'
# ---------------------------------------------------------------------------

module "stapp" {
  source = "git::https://github.com/AgicCompany/Standard.Terraform-Modules.git//modules/static-web-app?ref=static-web-app/v3.0.0"

  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  name                = "stapp-hellowork"

  sku_tier                = "Free"
  sku_size                = "Free"
  enable_private_endpoint = false # Free tier does not support PE
  enable_public_access    = true

  tags = local.common_tags
}
