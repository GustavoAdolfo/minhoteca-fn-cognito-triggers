resource "aws_cognito_user_pool" "existing" {
  name = var.user_pool_name

  lambda_config {
    define_auth_challenge          = aws_lambda_function.cognitoTriggers.arn # (Optional) Defines the authentication challenge.
    create_auth_challenge          = aws_lambda_function.cognitoTriggers.arn # (Optional) ARN of the lambda creating an authentication challenge.
    verify_auth_challenge_response = aws_lambda_function.cognitoTriggers.arn # (Optional) Verifies the authentication challenge response.
    pre_sign_up                    = aws_lambda_function.cognitoTriggers.arn # (Optional) Pre-registration AWS Lambda trigger.
    post_confirmation              = aws_lambda_function.cognitoTriggers.arn # (Optional) Post-confirmation AWS Lambda trigger.
    pre_authentication             = aws_lambda_function.cognitoTriggers.arn # (Optional) Pre-authentication AWS Lambda trigger.
    pre_token_generation           = aws_lambda_function.cognitoTriggers.arn # (Optional) Allow to customize identity token claims before token generation.
    post_authentication            = aws_lambda_function.cognitoTriggers.arn # (Optional) Post-authentication AWS Lambda trigger.
    kms_key_id                     = aws_kms_key.kms_sender.arn              # Cognito uses this key to encrypt codes for custom email/sms sender flows.
    custom_email_sender {
      lambda_arn     = aws_lambda_function.cognitoTriggers.arn
      lambda_version = "V1_0"
    }
  }
}
