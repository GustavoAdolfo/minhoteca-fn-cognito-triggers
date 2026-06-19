data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}


data "aws_iam_policy_document" "lambda_invoke" {
  statement {
    effect  = "Allow"
    actions = ["lambda:InvokeFunction"]
    resources = [
      "arn:aws:lambda:${var.region_name}:${var.account_id}:*",
    ]
  }
}

data "aws_iam_policy_document" "lambda_cognito" {
  statement {
    effect = "Allow"
    actions = [
      "cognito-idp:ListUsers",
      "cognito-idp:AdminCreateUser",
      "cognito-idp:AdminEnableUser",
      "cognito-idp:AdminGetUser",
      "cognito-idp:AdminResetUserPassword",
      "cognito-idp:AdminSetUserPassword",
      "cognito-idp:GetUser",
      "cognito-idp:ListUserPools",
      "cognito-idp:AdminInitiateAuth",
      "cognito-idp:AdminUpdateUserAttributes",
      "cognito-idp:AdminRespondToAuthChallenge",
      "cognito-idp:AdminUserGlobalSignOut",
    ]
    resources = ["*"]
  }
}

data "aws_iam_policy_document" "lambda_logging" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:aws:logs:${var.region_name}:${var.account_id}:*"]
  }
}

data "aws_iam_policy_document" "lambda_s3" {
  statement {
    effect = "Allow"
    actions = [
      "s3:ListBucket",
      "s3:ListAllMyBuckets",
      "s3:GetObject",
      "s3:PutObject",
      "S3:DeleteObject",
      "s3:PutObjectAcl",
      "s3:GetObjectAcl",
    ]
    resources = [
      "arn:aws:s3:::*"
    ]
  }
}

data "aws_iam_policy_document" "lambda_ses" {
  statement {
    effect = "Allow"
    actions = [
      "ses:SendEmail"
    ]
    resources = ["*"]
  }
}

data "aws_iam_policy_document" "lambda_kms" {
  statement {
    effect  = "Allow"
    actions = ["kms:Decrypt", "kms:GenerateDataKey"]
    resources = [
      "arn:aws:kms:${var.region_name}:${var.account_id}:key/*"
    ]
  }
}

data "aws_iam_policy_document" "lambda_dynamodb" {
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:PutItem",
      "dynamodb:GetItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem",
      "dynamodb:GetRecords",
      "dynamodb:GetShardIterator",
      "dynamodb:DescribeStream",
      "dynamodb:ListStreams"
    ]
    resources = [
      "arn:aws:dynamodb:${var.region_name}:${var.account_id}:table/*"
    ]
  }
}

data "aws_iam_policy_document" "lambda_mensageria" {
  statement {
    effect  = "Allow"
    actions = ["sqs:*", "sns:*"]
    resources = [
      "arn:aws:sqs:${var.region_name}:${var.account_id}:*",
      "arn:aws:sns:${var.region_name}:${var.account_id}:*",
    ]
  }
}
