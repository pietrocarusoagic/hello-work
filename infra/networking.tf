# ---------------------------------------------------------------------------
# Virtual Network
# ---------------------------------------------------------------------------
# Subnet sizing change from architecture doc §3 (v0.3):
#   snet-containerapp /24  →  snet-cae /23
# The Container Apps Environment requires a dedicated subnet of at least /23
# (512 addresses) delegated to Microsoft.App/environments.
# ---------------------------------------------------------------------------

module "vnet" {
  source = "git::https://github.com/AgicCompany/Standard.Terraform-Modules.git//modules/virtual-network?ref=virtual-network/v1.0.0"

  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  name                = "vnet-hellowork"
  address_space       = ["10.0.0.0/16"]

  subnets = {
    # Dedicated to Container Apps Environment — no other resources allowed.
    # Must be /23 minimum; delegated to Microsoft.App/environments.
    "snet-cae" = {
      address_prefixes                  = ["10.0.0.0/23"]
      private_endpoint_network_policies = "Disabled"
      delegation = {
        name = "delegation-cae"
        service_delegation = {
          name    = "Microsoft.App/environments"
          actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
        }
      }
    }

    # PostgreSQL VNet delegation — delegated to DBforPostgreSQL/flexibleServers.
    "snet-postgres" = {
      address_prefixes                  = ["10.0.2.0/24"]
      private_endpoint_network_policies = "Disabled"
      delegation = {
        name = "delegation-postgres"
        service_delegation = {
          name    = "Microsoft.DBforPostgreSQL/flexibleServers"
          actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
        }
      }
    }

    # Shared private endpoints subnet: Key Vault + Blob Storage.
    "snet-pe" = {
      address_prefixes                  = ["10.0.3.0/24"]
      private_endpoint_network_policies = "Disabled"
    }
  }

  tags = local.common_tags
}

# ---------------------------------------------------------------------------
# Private DNS Zones
# One zone per service that uses a private endpoint or VNet delegation.
# Each zone is linked to vnet-hellowork for DNS resolution within the VNet.
# ---------------------------------------------------------------------------

module "dns_keyvault" {
  source = "git::https://github.com/AgicCompany/Standard.Terraform-Modules.git//modules/private-dns-zone?ref=private-dns-zone/v1.0.0"

  resource_group_name = azurerm_resource_group.main.name
  name                = "privatelink.vaultcore.azure.net"

  virtual_network_links = {
    vnet-hellowork = { virtual_network_id = module.vnet.id }
  }

  tags = local.common_tags
}

module "dns_blob" {
  source = "git::https://github.com/AgicCompany/Standard.Terraform-Modules.git//modules/private-dns-zone?ref=private-dns-zone/v1.0.0"

  resource_group_name = azurerm_resource_group.main.name
  name                = "privatelink.blob.core.windows.net"

  virtual_network_links = {
    vnet-hellowork = { virtual_network_id = module.vnet.id }
  }

  tags = local.common_tags
}

# Required even with VNet delegation (not PE): Azure uses this zone for
# private name resolution of the delegated PostgreSQL server FQDN.
module "dns_postgres" {
  source = "git::https://github.com/AgicCompany/Standard.Terraform-Modules.git//modules/private-dns-zone?ref=private-dns-zone/v1.0.0"

  resource_group_name = azurerm_resource_group.main.name
  name                = "privatelink.postgres.database.azure.com"

  virtual_network_links = {
    vnet-hellowork = { virtual_network_id = module.vnet.id }
  }

  tags = local.common_tags
}
