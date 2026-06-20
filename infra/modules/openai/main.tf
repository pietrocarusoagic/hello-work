terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 4.0.0"
    }
  }
}

# Azure OpenAI account.
# GPT-4o availability: swedencentral or eastus (pass via var.location).
# local_auth_enabled = false enforces managed identity only — no API keys emitted.
resource "azurerm_cognitive_account" "this" {
  name                  = var.name
  location              = var.location
  resource_group_name   = var.resource_group_name
  kind                  = "OpenAI"
  sku_name              = "S0"
  custom_subdomain_name = var.name

  public_network_access_enabled = true  # No PE support on Standard S0 OpenAI
  local_auth_enabled            = false # Managed identity only; no API key auth

  tags = var.tags
}

# GPT-4o model deployment.
# capacity = var.capacity_tpm × 1000 tokens per minute.
# For POC coffee chat suggestions (~500 calls/month), 10K TPM is sufficient.
resource "azurerm_cognitive_deployment" "gpt4o" {
  name                 = "gpt-4o"
  cognitive_account_id = azurerm_cognitive_account.this.id

  model {
    format  = "OpenAI"
    name    = "gpt-4o"
    version = "2024-11-20"
  }

  sku {
    name     = "Standard"
    capacity = var.capacity_tpm
  }
}
