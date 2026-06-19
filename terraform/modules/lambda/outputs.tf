output "kms_key_alias_arn" {
  value = aws_kms_alias.kms_sender.arn
}

output "kms_key_arn" {
  value = aws_kms_key.kms_sender.arn
}
