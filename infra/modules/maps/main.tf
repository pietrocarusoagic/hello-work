terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 4.0.0"
    }
  }
}

# Azure Maps Gen 2 (S0) for the Office Map feature.
# The primary_access_key is stored in Key Vault and injected into the
# Container App at startup (see security.tf and compute.tf).
resource "azurerm_maps_account" "this" {
  name                = var.name
  resource_group_name = var.resource_group_name
  sku_name            = "G2"

  tags = var.tags
}
