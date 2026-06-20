# ---------------------------------------------------------------------------
# Core
# ---------------------------------------------------------------------------

variable "subscription_id" {
  type        = string
  description = "Azure subscription ID"
}

variable "location" {
  type        = string
  description = "Primary Azure region for all resources (Static Web Apps requires westeurope)"
  default     = "westeurope"
}

variable "env" {
  type        = string
  description = "Environment context injected into APP_ENV and resource tags. Single physical deployment; isolation is config-level."
  default     = "production"

  validation {
    condition     = contains(["development", "production"], var.env)
    error_message = "env must be 'development' or 'production'."
  }
}

# ---------------------------------------------------------------------------
# PostgreSQL
# ---------------------------------------------------------------------------

variable "postgres_admin_login" {
  type        = string
  description = "PostgreSQL administrator login name"
  default     = "psqladmin"
}

variable "postgres_admin_password" {
  type        = string
  description = "PostgreSQL administrator password. Min 12 chars; must include upper, lower, digit, and symbol. Injected from GitHub Actions secret in CI/CD."
  sensitive   = true
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
  description = "Container image for the FastAPI API Container App. Defaults to Microsoft placeholder on first deploy. CI/CD overrides with: -var='api_image=acr-hellowork.azurecr.io/hellowork-api:<sha>'"
  default     = "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"
}
