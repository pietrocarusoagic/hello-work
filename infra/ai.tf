# ---------------------------------------------------------------------------
# Azure OpenAI — GPT-4o (coffee chat suggestions only)
# ---------------------------------------------------------------------------
# Deployed in Sweden Central for GPT-4o regional availability.
# local_auth_enabled = false (set in module): managed identity only.
# The Container App uses the Cognitive Services OpenAI User role (rbac.tf).
# ---------------------------------------------------------------------------

module "openai" {
  source = "./modules/openai"

  resource_group_name = azurerm_resource_group.main.name
  location            = "swedencentral" # GPT-4o availability
  name                = "aoai-hellowork"
  capacity_tpm        = 10 # 10K TPM — sufficient for ~500 suggestions/month at POC scale

  tags = local.common_tags
}

# ---------------------------------------------------------------------------
# Azure Maps Gen 2 — Office Map tile layer + people clustering
# ---------------------------------------------------------------------------
# The primary_access_key is sensitive; it is stored in Key Vault (security.tf)
# and injected into the Container App as a secret (compute.tf).
# ---------------------------------------------------------------------------

module "maps" {
  source = "./modules/maps"

  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  name                = "maps-hellowork"

  tags = local.common_tags
}
