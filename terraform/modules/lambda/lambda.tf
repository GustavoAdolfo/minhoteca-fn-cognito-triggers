resource "aws_lambda_function" "cognitoTriggers" {
  function_name                  = "minhoteca-cognitoTriggers"
  description                    = "Minhoteca Cognito cognitoTriggers"
  role                           = aws_iam_role.role_cognitoTriggers.arn
  handler                        = "index.handler"
  runtime                        = var.node_runtime
  architectures                  = var.compatible_architectures
  timeout                        = var.lambda_cognito_triggers_timeout
  memory_size                    = var.lambda_cognito_triggers_memory
  reserved_concurrent_executions = var.lambda_cognito_triggers_reserved_concurrent_executions
  publish                        = false
  kms_key_arn                    = aws_kms_key.kms_sender.arn
  filename                       = data.archive_file.cognitoTriggers_file.output_path
  source_code_hash               = data.archive_file.cognitoTriggers_file.output_base64sha256
  layers = [
    var.coreLayer_arn
  ]
  dead_letter_config {
    target_arn = aws_sqs_queue.cognitoTriggersDL.arn
  }
  environment {
    variables = {
      VERSION                      = data.external.cognitoTriggers_version.result.version
      LINK_SOBRE                   = "www.${var.email_about_link}"
      LINK_POLITICA_DE_PRIVACIDADE = "www.${var.email_privacy_policy_link}"
      LINK_TERMO_DE_USO            = "www.${var.email_use_term}"
      BUCKET_TEMPLATES             = var.bucket_templates
      BUCKET_RESOURCES             = var.bucket_resources
      TEMPLATE_EMAIL_LOGIN         = var.template_email_login
      TEMPLATE_EMAIL_SIGNUP        = var.template_email_signup
      TEMPLATE_EMAIL_CONFIRMATION  = var.template_email_confirmation
      LOGO_IMG                     = var.logo_img
      LOGO_CONTENT_TYPE            = var.logo_content_type
      KEY_ALIAS                    = aws_kms_alias.kms_sender.arn
      KEY_ARN                      = aws_kms_key.kms_sender.arn
      EMAIL_PRINCIPAL              = var.email_principal
    }
  }
  tracing_config {
    mode = "PassThrough"
  }
  tags = merge(var.application_tags, { Contexto = "Auth" })
}

data "external" "cognitoTriggers_version" {
  program = ["node", "${abspath("${path.root}/../../../version.mjs")}"]
}

resource "null_resource" "cognitoTriggers_build" {
  triggers = {
    src_hash = sha256(join("", [for f in sort(fileset("${path.module}/../../../src", "**/*")) : filesha256("${path.module}/../../../src/${f}")]))
  }
  provisioner "local-exec" {
    command = "cd ${abspath("${path.root}/../../..")} && npm install && npm run build"
  }
}

data "archive_file" "cognitoTriggers_file" {
  type        = "zip"
  source_dir  = abspath("${path.root}/../../../dist/")
  output_path = "cognitoTriggers.zip"
}
