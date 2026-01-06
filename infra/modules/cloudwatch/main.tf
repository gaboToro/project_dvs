variable "project"     { type = string }
variable "environment" { type = string }

resource "aws_cloudwatch_log_group" "app" {
  name              = "/${var.project}/${var.environment}/app"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "infra" {
  name              = "/${var.project}/${var.environment}/infra"
  retention_in_days = 7
}

output "log_group_app"  { value = aws_cloudwatch_log_group.app.name }
output "log_group_infra"{ value = aws_cloudwatch_log_group.infra.name }
