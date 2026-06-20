output "id" {
  description = "Azure OpenAI account resource ID (use for role assignments)"
  value       = azurerm_cognitive_account.this.id
}

output "endpoint" {
  description = "Azure OpenAI endpoint URL (inject into Container App env var AZURE_OPENAI_ENDPOINT)"
  value       = azurerm_cognitive_account.this.endpoint
}

output "name" {
  description = "Azure OpenAI account name"
  value       = azurerm_cognitive_account.this.name
}

output "deployment_name" {
  description = "GPT-4o model deployment name (inject into Container App env var AZURE_OPENAI_DEPLOYMENT)"
  value       = azurerm_cognitive_deployment.gpt4o.name
}
