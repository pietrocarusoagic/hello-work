# ---------------------------------------------------------------------------
# Key Vault
# ---------------------------------------------------------------------------
# enable_purge_protection = true: production hardening — once enabled, the
# vault cannot be purged even after deletion. Prevents accidental permanent
# data loss. This is a one-way door and cannot be reverted.
# ---------------------------------------------------------------------------

module "keyvault" {
  source = "git::https://github.com/AgicCompany/Standard.Terraform-Modules.git//modules/key-vault?ref=key-vault/v2.0.0"

  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  name                = "kv-hellowork"

  enable_private_endpoint    = true
  subnet_id                  = module.vnet.subnet_ids["snet-pe"]
  private_dns_zone_id        = module.dns_keyvault.id

  enable_purge_protection    = true # Production: must be enabled; cannot be reverted
  soft_delete_retention_days = 7

  diagnostic_settings = {
    log_analytics_workspace_id = module.law.id
  }

  tags = local.common_tags
}

# ---------------------------------------------------------------------------
# Key Vault Secrets
# ---------------------------------------------------------------------------
# Terraform writes these secrets during apply so that:
#   1. The Container App can resolve them at runtime via its managed identity.
#   2. Ops staff have a single authoritative source for connection details.
#
# The Terraform caller SP needs Key Vault Secrets Officer for this to succeed.
# That role assignment lives in rbac.tf (terraform_kv_officer).
#
# Note: RBAC propagation in Azure can take up to ~5 minutes. If secret writes
# fail with 403 on first apply, re-run `terraform apply` once the role has
# propagated.
# ---------------------------------------------------------------------------

# ADO.NET SQL Server connection string (matches EF Core UseSqlServer expectation).
# The ConnectionStrings__DefaultConnection env var is injected into the Container
# App and overrides appsettings.json at runtime.
resource "azurerm_key_vault_secret" "db_conn_string" {
  name  = "db-conn-string"
  value = "Server=tcp:${azurerm_mssql_server.main.fully_qualified_domain_name},1433;Initial Catalog=${azurerm_mssql_database.main.name};Persist Security Info=False;User ID=${var.sql_admin_login};Password=${var.sql_admin_password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

  key_vault_id = module.keyvault.id

  depends_on = [
    module.keyvault,
    azurerm_role_assignment.terraform_kv_officer,
  ]
}

resource "azurerm_key_vault_secret" "maps_api_key" {
  name         = "maps-api-key"
  value        = module.maps.primary_access_key
  key_vault_id = module.keyvault.id

  depends_on = [
    module.keyvault,
    azurerm_role_assignment.terraform_kv_officer,
  ]
}

resource "azurerm_key_vault_secret" "appinsights_conn_string" {
  name         = "appinsights-conn-string"
  value        = data.azurerm_application_insights.appi.connection_string
  key_vault_id = module.keyvault.id

  depends_on = [
    module.keyvault,
    module.appi,
    azurerm_role_assignment.terraform_kv_officer,
  ]
}
