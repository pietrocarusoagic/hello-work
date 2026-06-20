# ---------------------------------------------------------------------------
# Log Analytics Workspace
# ---------------------------------------------------------------------------
# internet_ingestion_enabled = true: required so the Container App SDK
# (running inside the VNet but reaching App Insights over the public internet)
# can send telemetry to the workspace ingestion endpoint.
# ---------------------------------------------------------------------------

module "law" {
  source = "git::https://github.com/AgicCompany/Standard.Terraform-Modules.git//modules/log-analytics-workspace?ref=log-analytics-workspace/v1.0.0"

  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  name                = "law-hellowork"

  retention_in_days         = 90
  enable_internet_ingestion = true
  enable_internet_query     = true

  tags = local.common_tags
}

# ---------------------------------------------------------------------------
# Application Insights (workspace-based)
# ---------------------------------------------------------------------------
# local_authentication_disabled = true: enforces managed identity auth only.
# Connection-string-based ingestion is disabled in production — the Container
# App uses DefaultAzureCredential (user-assigned MI) to ship telemetry.
# ---------------------------------------------------------------------------

module "appi" {
  source = "git::https://github.com/AgicCompany/Standard.Terraform-Modules.git//modules/application-insights?ref=application-insights/v1.0.0"

  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  name                = "appi-hellowork"
  workspace_id        = module.law.id

  retention_in_days             = 90
  sampling_percentage           = 100
  internet_ingestion_enabled    = true
  internet_query_enabled        = true
  local_authentication_disabled = false # Connection-string ingestion — simpler for POC

  tags = local.common_tags
}

# The AGIC application-insights module does not expose connection_string as
# an output. Retrieve it via data source after the resource is provisioned.
data "azurerm_application_insights" "appi" {
  name                = "appi-hellowork"
  resource_group_name = azurerm_resource_group.main.name
  depends_on          = [module.appi]
}

# ---------------------------------------------------------------------------
# Action Group
# ---------------------------------------------------------------------------

module "action_group" {
  source = "git::https://github.com/AgicCompany/Standard.Terraform-Modules.git//modules/action-group?ref=action-group/v1.0.0"

  resource_group_name = azurerm_resource_group.main.name
  name                = "ag-hellowork-oncall"
  short_name          = "hw-oncall"

  email_receivers = {
    oncall = {
      email_address           = var.alert_email
      use_common_alert_schema = true
    }
  }

  tags = local.common_tags
}

# ---------------------------------------------------------------------------
# Metric Alerts (§7.4 of architecture doc)
# ---------------------------------------------------------------------------

# Azure SQL Database — CPU sustained above 80% for 10 minutes (Sev 3)
resource "azurerm_monitor_metric_alert" "sql_cpu" {
  name                = "alert-hellowork-sql-cpu"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_mssql_database.main.id]
  description         = "Azure SQL Database CPU utilization sustained above 80%"
  severity            = 3
  frequency           = "PT5M"
  window_size         = "PT15M"

  criteria {
    metric_namespace = "Microsoft.Sql/servers/databases"
    metric_name      = "cpu_percent"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }

  action {
    action_group_id = module.action_group.id
  }
}

# Container App — zero replicas running for more than 2 minutes (Sev 1)
resource "azurerm_monitor_metric_alert" "container_app_replicas" {
  name                = "alert-hellowork-api-no-replicas"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [module.container_app.id]
  description         = "Container App has 0 running replicas — service unavailable"
  severity            = 1
  frequency           = "PT1M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.App/containerApps"
    metric_name      = "RunningReplicas"
    aggregation      = "Average"
    operator         = "LessThan"
    threshold        = 1
  }

  action {
    action_group_id = module.action_group.id
  }
}

# Key Vault — any HTTP 403 Forbidden response (Sev 2)
# window_size matches architecture doc §7.4 (1 min evaluation window)
resource "azurerm_monitor_metric_alert" "kv_access_denied" {
  name                = "alert-hellowork-kv-access-denied"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [module.keyvault.id]
  description         = "Key Vault returned HTTP 403 Forbidden — possible misconfigured RBAC"
  severity            = 2
  frequency           = "PT1M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.KeyVault/vaults"
    metric_name      = "ServiceApiResult"
    aggregation      = "Count"
    operator         = "GreaterThan"
    threshold        = 0

    dimension {
      name     = "StatusCode"
      operator = "Include"
      values   = ["403"]
    }
  }

  action {
    action_group_id = module.action_group.id
  }
}
