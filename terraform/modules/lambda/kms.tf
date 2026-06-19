resource "aws_kms_key" "kms_sender" {
  description = "KMS key for lambda custom sender config"
  tags        = merge(var.application_tags, { Contexto = "Auth" })
}


data "aws_iam_policy_document" "kms_policy_verify" {
  statement {
    sid    = "KMS Lambda Custom Email Sender"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }
    actions   = ["kms:*"]
    resources = ["*"]
  }

  statement {
    sid    = "AllowCognitoUseOfKmsKey"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cognito-idp.amazonaws.com"]
    }
    actions = [
      "kms:Decrypt",
      "kms:DescribeKey",
      "kms:Encrypt",
      "kms:GenerateDataKey",
      "kms:GenerateDataKeyWithoutPlaintext",
      "kms:CreateGrant",
    ]
    resources = ["*"]
  }
}

resource "aws_kms_key_policy" "kms_sender" {
  key_id = aws_kms_key.kms_sender.id
  policy = data.aws_iam_policy_document.kms_policy_verify.json
}

resource "aws_kms_alias" "kms_sender" {
  target_key_id = aws_kms_key.kms_sender.key_id
  name          = "alias/customEmailSender"
}
