terraform {
  required_version = ">= 1.10.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 4.0.0"
    }
  }

  # Remote state: Azure Storage Account pre-created outside this stack.
  # Create manually once:
  #   az group create -n rg-hellowork-tfstate -l westeurope
  #   az storage account create -n sthelloworktfstate -g rg-hellowork-tfstate --sku Standard_LRS
  #   az storage container create -n tfstate --account-name sthelloworktfstate
  backend "azurerm" {
    resource_group_name  = "rg-hellowork-tfstate"
    storage_account_name = "sthelloworktfstate"
    container_name       = "tfstate"
    key                  = "hellowork.tfstate"
  }
}

provider "azurerm" {
  subscription_id = var.subscription_id

  features {
    key_vault {
      # Allow easy vault deletion during development (disable in production)
      purge_soft_delete_on_destroy    = true
      recover_soft_deleted_key_vaults = true
    }
  }
}

# Used in rbac.tf to grant Terraform SP Key Vault Secrets Officer
# so the apply run can write secrets to Key Vault.
data "azurerm_client_config" "current" {}

# ---------------------------------------------------------------------------
# Resource Group
# ---------------------------------------------------------------------------

resource "azurerm_resource_group" "main" {
  name     = "rg-hellowork"
  location = var.location
  tags     = local.common_tags
}

# ---------------------------------------------------------------------------
# Locals
# ---------------------------------------------------------------------------

locals {
  common_tags = {
    Project     = "hello-work"
    Environment = var.env
    ManagedBy   = "Terraform"
  }
}
