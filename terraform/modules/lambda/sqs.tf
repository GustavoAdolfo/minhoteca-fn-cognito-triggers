resource "aws_sqs_queue" "cognitoTriggersDL" {
  name                              = "minhoteca-cognitoTriggers-dl"
  tags                              = merge(var.application_tags, { Contexto = "Auth" })
  kms_master_key_id                 = aws_kms_key.kms_sender.key_id
  kms_data_key_reuse_period_seconds = 300
}
