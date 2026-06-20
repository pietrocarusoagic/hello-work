output "id" {
  description = "Azure Maps account resource ID"
  value       = azurerm_maps_account.this.id
}

output "name" {
  description = "Azure Maps account name"
  value       = azurerm_maps_account.this.name
}

output "primary_access_key" {
  description = "Primary access key for Azure Maps (stored in Key Vault, never logged)"
  value       = azurerm_maps_account.this.primary_access_key
  sensitive   = true
}
