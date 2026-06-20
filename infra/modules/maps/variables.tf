variable "name" {
  type        = string
  description = "Azure Maps account name (full CAF-compliant, e.g. maps-hellowork)"
}

variable "resource_group_name" {
  type        = string
  description = "Resource group name"
}

variable "tags" {
  type        = map(string)
  description = "Tags to apply to all resources in this module"
  default     = {}
}
