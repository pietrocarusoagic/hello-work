terraform {
  required_version = ">= 1.10.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 4.0.0"
    }
  }

  # Local state — sufficient for POC/hackathon single-operator usage.
  # terraform.tfstate is created in infra/ and is git-ignored.
}

provider "azurerm" {
  subscription_id = var.subscription_id

  features {
    key_vault {
      purge_soft_delete_on_destroy    = false
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
  name     = "rg-red"
  location = var.location
  tags     = local.common_tags
}

# ---------------------------------------------------------------------------
# Locals
# ---------------------------------------------------------------------------

locals {
  common_tags = {
    Project     = "hello-work"
    Team        = "red"
    Environment = var.env
    ManagedBy   = "Terraform"
  }
}
