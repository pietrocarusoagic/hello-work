# ---------------------------------------------------------------------------
# RBAC Assignments
# ---------------------------------------------------------------------------
# All role assignments are collected here for a single authoritative view
# of the permission model. Follows principle of least privilege.
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Terraform caller → Key Vault (write secrets during apply)
# ---------------------------------------------------------------------------
# The current Terraform service principal needs Key Vault Secrets Officer to
# write the db-conn-string, maps-api-key, and appinsights-conn-string secrets
# defined in security.tf.
#
# Note: Azure RBAC propagation takes up to ~5 minutes. If secret writes fail
# with 403 on first apply, wait and re-run `terraform apply`.
# ---------------------------------------------------------------------------

resource "azurerm_role_assignment" "terraform_kv_officer" {
  scope                = module.keyvault.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = data.azurerm_client_config.current.object_id
}

# ---------------------------------------------------------------------------
# Container App identity → Azure services
# ---------------------------------------------------------------------------

# Key Vault: read application secrets at startup
resource "azurerm_role_assignment" "api_identity_kv_secrets_user" {
  scope                = module.keyvault.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = module.api_identity.principal_id
}

# Azure OpenAI: invoke GPT-4o for coffee chat suggestions
resource "azurerm_role_assignment" "api_identity_openai_user" {
  scope                = module.openai.id
  role_definition_name = "Cognitive Services OpenAI User"
  principal_id         = module.api_identity.principal_id
}

# Blob Storage: read/write avatars and AKR attachments
resource "azurerm_role_assignment" "api_identity_storage_blob_contributor" {
  scope                = module.storage.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = module.api_identity.principal_id
}

# Container Registry: pull Docker images
resource "azurerm_role_assignment" "api_identity_acr_pull" {
  scope                = module.acr.id
  role_definition_name = "AcrPull"
  principal_id         = module.api_identity.principal_id
}

# ---------------------------------------------------------------------------
# GitHub Actions service principal → Azure resources
# ---------------------------------------------------------------------------

# Contributor on the resource group: allows terraform apply from CI/CD
resource "azurerm_role_assignment" "github_actions_contributor" {
  scope                = azurerm_resource_group.main.id
  role_definition_name = "Contributor"
  principal_id         = var.github_actions_sp_object_id
}

# AcrPush on ACR: allows the api-deploy pipeline to push Docker images
resource "azurerm_role_assignment" "github_actions_acr_push" {
  scope                = module.acr.id
  role_definition_name = "AcrPush"
  principal_id         = var.github_actions_sp_object_id
}
