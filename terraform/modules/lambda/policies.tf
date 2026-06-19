resource "aws_iam_role" "role_cognitoTriggers" {
  name               = "minhoteca-cognitoTriggers"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  tags               = merge(var.application_tags, { Contexto = "Auth" })
}

resource "aws_iam_policy" "invoke_cognitoTriggers" {
  name        = "minhoteca-cognitoTriggers-invoke-policy"
  description = "IAM policy lambda cognitoTriggers invoke"
  policy      = data.aws_iam_policy_document.lambda_invoke.json
  tags        = merge(var.application_tags, { Contexto = "Auth" })
}

resource "aws_iam_role_policy_attachment" "cognitoTriggers_role_invoke" {
  role       = aws_iam_role.role_cognitoTriggers.name
  policy_arn = aws_iam_policy.invoke_cognitoTriggers.arn
}

resource "aws_iam_policy" "lbd_cognitoTriggers_policy" {
  name        = "minhoteca-cognitoTriggers-policy"
  description = "IAM policy Minhoteca cognitoTriggers"
  policy      = data.aws_iam_policy_document.lambda_cognito.json
  tags        = merge(var.application_tags, { Contexto = "Auth" })
}

resource "aws_iam_role_policy_attachment" "lbd_cognitoTriggers_role" {
  role       = aws_iam_role.role_cognitoTriggers.name
  policy_arn = aws_iam_policy.lbd_cognitoTriggers_policy.arn
}

resource "aws_iam_role_policy_attachment" "cognitoTriggers_role_ses" {
  role       = aws_iam_role.role_cognitoTriggers.name
  policy_arn = aws_iam_policy.ses_cognitoTriggers.arn
}

resource "aws_iam_policy" "ses_cognitoTriggers" {
  name        = "minhoteca-lambda-cognitoTriggers-ses"
  path        = "/"
  description = "IAM policy para lambda cognito cognitoTriggers ses"
  policy      = data.aws_iam_policy_document.lambda_ses.json
  tags        = merge(var.application_tags, { Contexto = "Auth" })
}

resource "aws_iam_role_policy_attachment" "cognitoTriggers_role_s3" {
  role       = aws_iam_role.role_cognitoTriggers.name
  policy_arn = aws_iam_policy.s3_cognitoTriggers.arn
}

resource "aws_iam_policy" "s3_cognitoTriggers" {
  name        = "minhoteca-lambda-cognitoTriggers-s3"
  path        = "/"
  description = "IAM policy para lambda cognito cognitoTriggers S3"
  policy      = data.aws_iam_policy_document.lambda_s3.json
  tags        = merge(var.application_tags, { Contexto = "Auth" })
}

resource "aws_iam_role_policy_attachment" "cognitoTriggers_role_kms" {
  role       = aws_iam_role.role_cognitoTriggers.name
  policy_arn = aws_iam_policy.kms_cognitoTriggers.arn
}

resource "aws_iam_policy" "kms_cognitoTriggers" {
  name        = "minhoteca-lambda-cognitoTriggers-kms"
  path        = "/"
  description = "IAM policy para lambda cognito cognitoTriggers KMS"
  policy      = data.aws_iam_policy_document.lambda_kms.json
  tags        = merge(var.application_tags, { Contexto = "Auth" })
}

resource "aws_iam_role_policy_attachment" "cognitoTriggers_role_logs" {
  role       = aws_iam_role.role_cognitoTriggers.name
  policy_arn = aws_iam_policy.log_cognitoTriggers.arn
}

resource "aws_iam_policy" "log_cognitoTriggers" {
  name        = "minhoteca-lambda-cognitoTriggers-logging"
  path        = "/"
  description = "IAM policy para lambda cognito cognitoTriggers logging"
  policy      = data.aws_iam_policy_document.lambda_logging.json
  tags        = merge(var.application_tags, { Contexto = "Auth" })
}

resource "aws_cloudwatch_log_group" "log_cognitoTriggers" {
  #checkov:skip=CKV_AWS_158:Ignorando por ser log provisório
  name              = "/aws/lambda/minhoteca-cognitoTriggers"
  retention_in_days = var.lambda_cognito_triggers_log_retention
  tags              = merge(var.application_tags, { Contexto = "Auth" })
}

resource "aws_iam_policy" "lbd_mensageria_policy_cognitoTriggers" {
  name        = "minhoteca-cognitoTriggers-mensageria-policy"
  description = "IAM policy mensageria lambda Library Service"
  policy      = data.aws_iam_policy_document.lambda_mensageria.json
  tags        = merge(var.application_tags, { Contexto = "Borrow Service" })
}

resource "aws_iam_role_policy_attachment" "lbd_mensageria_role_cognitoTriggers" {
  role       = aws_iam_role.role_cognitoTriggers.name
  policy_arn = aws_iam_policy.lbd_mensageria_policy_cognitoTriggers.arn
}
