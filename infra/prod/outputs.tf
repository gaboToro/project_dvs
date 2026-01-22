output "core_public_ip" {
  value = aws_instance.core.public_ip
}


output "business_public_ip" {
  value = aws_instance.business.public_ip
}

output "trust_support_public_ip" {
  value = aws_instance.trust_support.public_ip
}

output "core_private_ip" {
  value = aws_instance.core.private_ip
}

output "business_private_ip" {
  value = aws_instance.business.private_ip
}

output "trust_support_private_ip" {
  value = aws_instance.trust_support.private_ip
}

output "api_gateway_url" {
  value = "http://${aws_lb.qa.dns_name}/api/health"
}

output "frontend_url" {
  value = "http://${aws_lb.qa.dns_name}"
}

output "n8n_url" {
  value = "http://${aws_instance.core.public_ip}:5678"
}

output "alb_dns_name" {
  value = aws_lb.qa.dns_name
}

output "alb_url" {
  value = "http://${aws_lb.qa.dns_name}"
}
