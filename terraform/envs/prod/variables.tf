variable "appregistry_id" {
  type        = string
  description = "ID da aplicação no Service Catalog App Registry"
}

variable "user_pool_id" {
  type        = string
  description = "ID do User Pool do Cognito"
}
variable "user_pool_client_id" {
  type        = string
  description = "ID do User Pool Client do Cognito"
}
variable "bucket_arquivos" {
  type        = string
  description = "Nome do bucket S3 para recursos"
}
variable "bucket_templates" {
  type        = string
  description = ""
}
variable "logo_content_type" {
  type        = string
  description = ""
}
variable "logo_img" {
  type        = string
  description = ""
}
variable "template_email_confirmation" {
  type        = string
  description = ""
}
variable "template_email_login" {
  type        = string
  description = ""
}
variable "+" {
  type        = string
  description = ""
}
variable "email_about_link" {
  type        = string
  description = ""
}
variable "email_privacy_policy_link" {
  type        = string
  description = ""
}
variable "email_use_term" {
  type        = string
  description = ""
}
