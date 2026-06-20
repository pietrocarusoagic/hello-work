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

  enable_private_endpoints     = true
  enable_blob_private_endpoint = true
  subnet_id                    = module.vnet.subnet_ids["snet-pe"]
  private_dns_zone_ids = {
    blob = module.dns_blob.id
  }

  shared_access_key_enabled = false # Managed identity only

  tags = local.common_tags
}

# ---------------------------------------------------------------------------
# Azure SQL Server (logical server) + Database
# ---------------------------------------------------------------------------
# The backend API uses Microsoft.EntityFrameworkCore.SqlServer — Azure SQL
# is therefore the correct database engine (not PostgreSQL).
#
# Private endpoint in snet-pe keeps the server off the public internet.
# public_network_access_enabled = false: the only path in is via the PE.
#
# enable_entra_auth / azure_ad_administrator: optional future hardening.
# For POC, SQL login (username + password) is used via connection string.
# ---------------------------------------------------------------------------

resource "azurerm_mssql_server" "main" {
  name                         = "sql-hellowork"
  resource_group_name          = azurerm_resource_group.main.name
  location                     = var.location
  version                      = "12.0"
  administrator_login          = var.sql_admin_login
  administrator_login_password = var.sql_admin_password

  # Disable public internet access — all traffic goes through the private endpoint.
  public_network_access_enabled = false

  # Minimum TLS 1.2 as per architecture doc §4.5
  minimum_tls_version = "1.2"

  tags = local.common_tags
}

resource "azurerm_mssql_database" "main" {
  name      = "hellowork"
  server_id = azurerm_mssql_server.main.id

  # S2 (50 DTU) — roughly equivalent in cost to the PostgreSQL B2ms originally specified.
  # Supports ~170 concurrent connections; adequate for 1,000 internal users.
  sku_name = "S2"

  # 7-day point-in-time restore window (matches architecture doc §8.2 RPO target)
  zone_redundant = false

  tags = local.common_tags
}

# ---------------------------------------------------------------------------
# Azure SQL — Private Endpoint
# ---------------------------------------------------------------------------
# Placed in snet-pe alongside the Key Vault and Blob Storage private endpoints.
# Linked to the privatelink.database.windows.net DNS zone (networking.tf).
# ---------------------------------------------------------------------------

resource "azurerm_private_endpoint" "sql" {
  name                = "pe-sql-hellowork"
  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  subnet_id           = module.vnet.subnet_ids["snet-pe"]

  private_service_connection {
    name                           = "psc-sql-hellowork"
    private_connection_resource_id = azurerm_mssql_server.main.id
    subresource_names              = ["sqlServer"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "sql-dns-zone-group"
    private_dns_zone_ids = [module.dns_sql.id]
  }

  tags = local.common_tags
}
