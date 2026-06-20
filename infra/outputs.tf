# ---------------------------------------------------------------------------
# Outputs
# ---------------------------------------------------------------------------
# Public-facing values useful for CI/CD pipelines, documentation, and
# manual operations. Sensitive values are marked sensitive = true.
# ---------------------------------------------------------------------------

output "front_door_endpoint_hostname" {
  description = "Public HTTPS URL for the Hello Work application (entry point for all users)"
  value       = "https://${module.frontdoor.endpoint_host_names["hellowork"]}"
}

output "container_app_fqdn" {
  description = "Stable Container App hostname (used as Front Door API origin)"
  value       = local.container_app_fqdn
}

output "static_web_app_hostname" {
  description = "Static Web App default hostname (used as Front Door SPA origin)"
  value       = module.stapp.default_host_name
}

output "acr_login_server" {
  description = "ACR login server URL — used by CI/CD to tag and push Docker images"
  value       = module.acr.login_server
}

output "key_vault_uri" {
  description = "Key Vault URI for reference and manual secret management"
  value       = module.keyvault.vault_uri
}

output "postgresql_fqdn" {
  description = "PostgreSQL server FQDN (private — only reachable from within the VNet)"
  value       = module.postgresql.fqdn
  sensitive   = true
}

output "application_insights_connection_string" {
  description = "App Insights connection string — available in Key Vault as 'appinsights-conn-string'"
  value       = data.azurerm_application_insights.appi.connection_string
  sensitive   = true
}

output "openai_endpoint" {
  description = "Azure OpenAI endpoint URL"
  value       = module.openai.endpoint
}

output "resource_group_name" {
  description = "Resource group name for all Hello Work resources"
  value       = azurerm_resource_group.main.name
}
