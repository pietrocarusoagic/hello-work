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
  local_authentication_disabled = true # Production: managed identity only

  tags = local.common_tags
}

# The AGIC application-insights module does not expose connection_string as
# an output. Retrieve it via data source after the resource is provisioned.
data "azurerm_application_insights" "appi" {
  name                = module.appi.name
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
  window_size         = "PT10M"

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
# Note: min_replicas = 1 prevents false alerts during off-hours.
resource "azurerm_monitor_metric_alert" "container_app_replicas" {
  name                = "alert-hellowork-api-no-replicas"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [module.container_app.id]
  description         = "Container App has 0 running replicas — service unavailable"
  severity            = 1
  frequency           = "PT1M"
  window_size         = "PT2M" # Matches architecture doc §7.4 (2 min)

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
  window_size         = "PT1M" # Matches architecture doc §7.4 (1 min)

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

# ---------------------------------------------------------------------------
# OpenAI latency alert — Log Analytics scheduled query
# ---------------------------------------------------------------------------
# The Cognitive Services metric namespace does not expose a percentile latency
# metric. The correct approach is a KQL query over Application Insights
# dependency traces — this fires when p95 duration for OpenAI calls exceeds
# the 15-second threshold defined in architecture doc §7.4.
# ---------------------------------------------------------------------------

resource "azurerm_monitor_scheduled_query_rules_alert_v2" "openai_latency" {
  name                = "alert-hellowork-openai-latency"
  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  description         = "Azure OpenAI p95 dependency latency above 15s — coffee chat suggestions may be slow"
  severity            = 3

  evaluation_frequency = "PT5M"
  window_duration      = "PT10M"

  # Scope: the Log Analytics workspace that backs Application Insights
  scopes = [module.law.id]

  criteria {
    query = <<-KQL
      dependencies
      | where cloud_RoleName == "ca-hellowork-api"
      | where type == "HTTP" and (target contains "openai" or target contains "aoai-hellowork")
      | summarize p95_duration = percentile(duration, 95) by bin(timestamp, 5m)
      | where p95_duration > 15000
    KQL

    time_aggregation_method = "Count"
    operator                = "GreaterThan"
    threshold               = 0

    failing_periods {
      minimum_failing_periods_to_trigger_alert = 1
      number_of_evaluation_periods             = 1
    }
  }

  action {
    action_groups = [module.action_group.id]
  }

  tags = local.common_tags
}
