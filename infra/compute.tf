# ---------------------------------------------------------------------------
# Container Apps Environment (VNet-integrated, external LB)
# ---------------------------------------------------------------------------
# enable_internal_load_balancer = false (default): environment is externally
# accessible. Front Door is the only permitted ingress path because the
# Container App enforces the X-Azure-FDID header in middleware.
#
# infrastructure_subnet_id = snet-cae: VNet integration enables the Container
# App to reach private resources inside the VNet (Azure SQL PE, Key Vault PE,
# Blob Storage PE) without traversing the public internet.
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
# Container App — ASP.NET Core 10 Backend API
# ---------------------------------------------------------------------------
# Port: ASP.NET Core listens on 8080 by default (set by ASPNETCORE_HTTP_PORTS
# or ASPNETCORE_URLS in the base image). The Dockerfile confirms EXPOSE 8080.
#
# Secrets are injected directly into the Container App secret store.
# Values are sourced from Terraform outputs — never hardcoded.
#
# Config injection: ASP.NET Core reads env vars using __ as hierarchy separator.
#   AzureAd__TenantId  →  appsettings.json "AzureAd:TenantId"
#   ConnectionStrings__DefaultConnection  →  appsettings.json connection string
#
# Image lifecycle note:
#   The initial image is a Microsoft placeholder. CI/CD overrides it with:
#     terraform apply -var="api_image=acrhellowork.azurecr.io/hellowork-api:<sha>"
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
      # ---------------------------------------------------------------------------
      # ASP.NET Core runtime
      # ---------------------------------------------------------------------------
      "ASPNETCORE_ENVIRONMENT" = {
        value = "Production" # Disables Swagger UI and detailed error pages
      }
      "ASPNETCORE_HTTP_PORTS" = {
        value = "8080" # Explicit — matches Dockerfile EXPOSE and probe config below
      }

      # ---------------------------------------------------------------------------
      # Azure AD — JWT validation and app registration
      # Uses __ separator for ASP.NET Core hierarchical config binding
      # ---------------------------------------------------------------------------
      "AzureAd__Instance" = {
        value = "https://login.microsoftonline.com/"
      }
      "AzureAd__TenantId" = {
        value = var.aad_tenant_id
      }
      "AzureAd__ClientId" = {
        value = var.aad_client_id
      }
      "AzureAd__Audience" = {
        value = "api://${var.aad_client_id}"
      }

      # ---------------------------------------------------------------------------
      # Azure Managed Identity — user-assigned
      # AZURE_CLIENT_ID is required so DefaultAzureCredential selects the correct
      # user-assigned identity when multiple identities might be present.
      # ---------------------------------------------------------------------------
      "AZURE_CLIENT_ID" = {
        value = module.api_identity.client_id
      }

      # ---------------------------------------------------------------------------
      # Front Door ID — X-Azure-FDID header validation
      # The middleware reads this value to reject requests that bypass Front Door.
      # ---------------------------------------------------------------------------
      "AZURE_FRONT_DOOR_ID" = {
        value = module.frontdoor.resource_id
      }

      # ---------------------------------------------------------------------------
      # Azure OpenAI (coffee chat suggestions)
      # ---------------------------------------------------------------------------
      "AZURE_OPENAI_ENDPOINT" = {
        value = module.openai.endpoint
      }
      "AZURE_OPENAI_DEPLOYMENT" = {
        value = module.openai.deployment_name
      }

      # ---------------------------------------------------------------------------
      # Matching algorithm weights (configurable without redeployment)
      # ---------------------------------------------------------------------------
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

      # ---------------------------------------------------------------------------
      # CORS — allow the Front Door endpoint only (not the raw Static Web App URL)
      # Uses __ separator for ASP.NET Core array config binding
      # ---------------------------------------------------------------------------
      "Cors__AllowedOrigins__0" = {
        value = "https://${module.frontdoor.endpoint_host_names["hellowork"]}"
      }

      # ---------------------------------------------------------------------------
      # Secret-backed env vars (resolved from Container App secret store)
      # ConnectionStrings__ prefix used for ASP.NET Core connection string binding
      # ---------------------------------------------------------------------------
      "ConnectionStrings__DefaultConnection" = {
        secret_name = "db-conn-string"
      }
      "AzureMaps__SubscriptionKey" = {
        secret_name = "maps-api-key"
      }
      "ApplicationInsights__ConnectionString" = {
        secret_name = "appinsights-conn-string"
      }
    }

    liveness_probe = {
      transport               = "HTTP"
      port                    = 8080 # ASP.NET Core default port
      path                    = "/health"
      initial_delay           = 15
      interval_seconds        = 30
      failure_count_threshold = 3
    }

    readiness_probe = {
      transport               = "HTTP"
      port                    = 8080 # ASP.NET Core default port
      path                    = "/health"
      initial_delay           = 10
      interval_seconds        = 10
      failure_count_threshold = 3
    }
  }

  # Secrets stored in the Container App secret store.
  # Values come from Terraform module outputs — never hardcoded.
  secrets = {
    "db-conn-string"          = "Server=tcp:${azurerm_mssql_server.main.fully_qualified_domain_name},1433;Initial Catalog=${azurerm_mssql_database.main.name};Persist Security Info=False;User ID=${var.sql_admin_login};Password=${var.sql_admin_password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
    "maps-api-key"            = module.maps.primary_access_key
    "appinsights-conn-string" = data.azurerm_application_insights.appi.connection_string
  }

  # External ingress — Front Door routes /api/* here.
  # Middleware validates X-Azure-FDID header (value from AZURE_FRONT_DOOR_ID env var).
  enable_ingress          = true
  enable_external_ingress = true
  ingress = {
    target_port = 8080 # ASP.NET Core default — Dockerfile EXPOSE 8080
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
    min_replicas = 1 # Keep at least 1 replica running — prevents false "unavailable" alerts
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

  tags = local.common_tags
}

# ---------------------------------------------------------------------------
# Static Web App
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
