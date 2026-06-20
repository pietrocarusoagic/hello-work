variable "name" {
  type        = string
  description = "Azure OpenAI account name (full CAF-compliant, e.g. aoai-hellowork)"
}

variable "location" {
  type        = string
  description = "Azure region. GPT-4o is available in swedencentral and eastus."
}

variable "resource_group_name" {
  type        = string
  description = "Resource group name"
}

variable "capacity_tpm" {
  type        = number
  description = "Deployment capacity in thousands of tokens per minute (TPM). 10 = 10K TPM."
  default     = 10
}

variable "tags" {
  type        = map(string)
  description = "Tags to apply to all resources in this module"
  default     = {}
}
