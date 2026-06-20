# ---------------------------------------------------------------------------
# Core
# ---------------------------------------------------------------------------

variable "subscription_id" {
  type        = string
  description = "Azure subscription ID — Agentic subscription"
  default     = "aa9de1ef-b9ca-4053-88a0-7f11d2a197fa"
}

variable "location" {
  type        = string
  description = "Primary Azure region for all resources (Static Web Apps requires westeurope)"
  default     = "westeurope"
}

variable "env" {
  type        = string
  description = "Environment context injected into ASPNETCORE_ENVIRONMENT and resource tags. Single physical deployment."
  default     = "production"

  validation {
    condition     = contains(["development", "production"], var.env)
    error_message = "env must be 'development' or 'production'."
  }
}

# ---------------------------------------------------------------------------
# Azure SQL Database
# ---------------------------------------------------------------------------

variable "sql_admin_login" {
  type        = string
  description = "Azure SQL Server administrator login name"
  default     = "sqladmin"
}

variable "sql_admin_password" {
  type        = string
  description = "Azure SQL Server administrator password. Min 8 chars; must include upper, lower, digit, and symbol. Injected from GitHub Actions secret in CI/CD."
  sensitive   = true
}

# ---------------------------------------------------------------------------
# Azure Active Directory
# ---------------------------------------------------------------------------

variable "aad_tenant_id" {
  type        = string
  description = "Azure AD tenant ID. Used by the backend API for JWT validation."
  default     = "d5e193bb-0b46-467d-9d95-03eb0d012c42"
}

variable "aad_client_id" {
  type        = string
  description = "Azure AD app registration client ID for the Hello Work API. Used for audience validation (AzureAd:ClientId / AzureAd:Audience)."
}

# ---------------------------------------------------------------------------
# CI/CD & Access
# ---------------------------------------------------------------------------

variable "github_actions_sp_object_id" {
  type        = string
  description = "Object ID of the GitHub Actions service principal. Granted Contributor on the resource group and AcrPush on ACR."
}

# ---------------------------------------------------------------------------
# Monitoring
# ---------------------------------------------------------------------------

variable "alert_email" {
  type        = string
  description = "Email address for monitoring alert notifications (Action Group)"
}

# ---------------------------------------------------------------------------
# Container App image
# ---------------------------------------------------------------------------

variable "api_image" {
  type        = string
  description = "Container image for the ASP.NET Core API Container App. Defaults to Microsoft placeholder on first deploy. CI/CD overrides with: -var='api_image=acrhellowork.azurecr.io/hellowork-api:<sha>'"
  default     = "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"
}
