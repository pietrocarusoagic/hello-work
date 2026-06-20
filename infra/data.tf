# ---------------------------------------------------------------------------
# User-Assigned Managed Identity (for the Container App)
# ---------------------------------------------------------------------------
# Using a user-assigned identity (not system-assigned) because:
#   - Its resource ID is known before the Container App is created, which
#     lets us reference it in `registries` without circular dependencies.
#   - All RBAC assignments target this identity's principal_id.
# ---------------------------------------------------------------------------

module "api_identity" {
  source = "git::https://github.com/AgicCompany/Standard.Terraform-Modules.git//modules/user-assigned-identity?ref=user-assigned-identity/v1.0.0"

  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  name                = "id-hellowork-api"

  tags = local.common_tags
}

# ---------------------------------------------------------------------------
# Azure Container Registry (Basic — POC tier)
# ---------------------------------------------------------------------------
# Basic SKU does not support private endpoints. The Container App pulls images
# over the public ACR endpoint using the user-assigned managed identity
# (AcrPull role assigned in rbac.tf).
# ---------------------------------------------------------------------------

module "acr" {
  source = "git::https://github.com/AgicCompany/Standard.Terraform-Modules.git//modules/container-registry?ref=container-registry/v2.0.0"

  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  # ACR names: globally unique, 5-50 chars, lowercase alphanumeric only (no hyphens)
  name = "acrhellowork"

  sku                     = "Basic"
  enable_private_endpoint = false # Basic SKU does not support PE
  enable_public_access    = true  # Container App pulls via public endpoint + MI auth

  diagnostic_settings = {
    log_analytics_workspace_id = module.law.id
  }

  tags = local.common_tags
}

# ---------------------------------------------------------------------------
# Blob Storage (avatars + AKR attachments)
# ---------------------------------------------------------------------------
# Private blob endpoint in snet-pe. The Container App accesses Blob Storage
# via its user-assigned managed identity (Storage Blob Data Contributor).
# shared_access_key_enabled = false enforces managed identity auth only.
# ---------------------------------------------------------------------------

module "storage" {
  source = "git::https://github.com/AgicCompany/Standard.Terraform-Modules.git//modules/storage-account?ref=storage-account/v2.0.0"

  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  # Storage names: 3-24 chars, lowercase alphanumeric only (no hyphens)
  name = "sthellowork"

  account_replication_type = "LRS"
  access_tier              = "Hot"

  enable_private_endpoint      = true
  enable_blob_private_endpoint = true
  subnet_id                    = module.vnet.subnet_ids["snet-pe"]
  private_dns_zone_ids = {
    blob = module.dns_blob.id
  }

  shared_access_key_enabled = false # Managed identity only

  diagnostic_settings = {
    log_analytics_workspace_id = module.law.id
  }

  tags = local.common_tags
}

# ---------------------------------------------------------------------------
# PostgreSQL Flexible Server (B2ms, VNet delegation)
# ---------------------------------------------------------------------------
# VNet delegation (not private endpoint) as per architecture doc §3.1.
# enable_password_auth = true: FastAPI SQLAlchemy uses connection string.
# enable_entra_auth = false: simplified for POC. Enable for production.
# ---------------------------------------------------------------------------

module "postgresql" {
  source = "git::https://github.com/AgicCompany/Standard.Terraform-Modules.git//modules/postgresql-flexible-server?ref=postgresql-flexible-server/v4.0.0"

  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  name                = "psql-hellowork"

  sku_name       = "B_Standard_B2ms"
  version_number = "16"
  storage_mb     = 32768 # 32 GB

  # Credentials
  administrator_login    = var.postgres_admin_login
  administrator_password = var.postgres_admin_password
  enable_password_auth   = true
  enable_entra_auth      = false

  # VNet delegation mode: PostgreSQL server gets a private IP in snet-postgres.
  # No public endpoint. Private DNS zone required for name resolution.
  enable_private_endpoint = false
  delegated_subnet_id     = module.vnet.subnet_ids["snet-postgres"]
  private_dns_zone_id     = module.dns_postgres.id

  backup_retention_days = 7

  databases = {
    # Creates the 'hellowork' database with UTF8 / en_US.utf8 defaults
    hellowork = {}
  }

  diagnostic_settings = {
    log_analytics_workspace_id = module.law.id
  }

  tags = local.common_tags
}
