terraform {
  required_version = "~> 1"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5"
    }
  }
}

provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Terraform = true
      Projeto   = "Minhoteca"
    }
  }
}

module "lambda" {
  source                      = "../../modules/lambda"
  account_id                  = local.account_id
  region_name                 = local.region
  application_tags            = data.aws_servicecatalogappregistry_application.minhoteca_application.tags
  user_pool_name              = var.user_pool_name
  user_pool_id                = var.user_pool_id
  user_pool_client_id         = var.user_pool_client_id
  bucket_resources            = var.bucket_arquivos
  bucket_templates            = var.bucket_templates
  logo_content_type           = var.logo_content_type
  logo_img                    = var.logo_img
  template_email_confirmation = var.template_email_confirmation
  template_email_login        = var.template_email_login
  template_email_signup       = var.template_email_signup
  email_about_link            = var.email_about_link
  email_privacy_policy_link   = var.email_privacy_policy_link
  email_use_term              = var.email_use_term
  coreLayer_arn               = local.coreLayer_arn
}
