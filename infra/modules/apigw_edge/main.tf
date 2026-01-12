variable "project"     { type = string }
variable "environment" { type = string }

# DNS público del ALB del LAB2, ej: xxx.us-east-1.elb.amazonaws.com
variable "alb_dns_name" {
  type        = string
  description = "Public DNS name of the ALB"
}

resource "aws_apigatewayv2_api" "http_api" {
  name          = "${var.project}-${var.environment}-http-api"
  protocol_type = "HTTP"
}

# Integración HTTP hacia el ALB (sin VPC Link)
resource "aws_apigatewayv2_integration" "alb" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "HTTP_PROXY"
  integration_method     = "ANY"
  integration_uri        = "http://${var.alb_dns_name}"
  payload_format_version = "1.0"
}

# Ruta catch-all: /{proxy+}
resource "aws_apigatewayv2_route" "proxy" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.alb.id}"
}

# Ruta raíz /
resource "aws_apigatewayv2_route" "root" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /"
  target    = "integrations/${aws_apigatewayv2_integration.alb.id}"
}

# Stage con auto-deploy y throttling básico (control compensatorio a falta de WAF)
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true

  # Throttling por defecto (ajusta si necesitas)
  default_route_settings {
    throttling_burst_limit = 50
    throttling_rate_limit  = 25
  }
}

output "api_invoke_url" {
  value = aws_apigatewayv2_api.http_api.api_endpoint
}
