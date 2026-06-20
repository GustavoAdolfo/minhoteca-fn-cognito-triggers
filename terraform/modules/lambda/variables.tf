variable "account_id" { type = string }
variable "region_name" { type = string }
variable "application_tags" { type = map(string) }

variable "email_principal" {
  type        = string
  description = "Email principal para envio dos emails e contato nos templates"
}
variable "lambda_cognito_triggers_log_retention" {
  type    = number
  default = 5
}
variable "bucket_resources" { type = string }
variable "bucket_templates" { type = string }
variable "logo_content_type" { type = string }
variable "logo_img" { type = string }
variable "template_email_confirmation" { type = string }
variable "template_email_login" { type = string }
variable "template_email_signup" { type = string }
variable "email_about_link" { type = string }
variable "email_privacy_policy_link" { type = string }
variable "email_use_term" { type = string }
variable "node_runtime" {
  type    = string
  default = "nodejs22.x"
}
variable "compatible_architectures" {
  type    = list(string)
  default = ["x86_64"]
}
variable "lambda_cognito_triggers_timeout" {
  type    = number
  default = 300
}
variable "lambda_cognito_triggers_memory" {
  type    = number
  default = 256
}
variable "lambda_cognito_triggers_reserved_concurrent_executions" {
  type    = number
  default = 10
}
variable "coreLayer_arn" {
  type = string
}


