output "vpc_id" { value = module.network.vpc_id }

output "alb_dns_name"  { value = module.alb_asg.alb_dns_name }
output "api_invoke_url" { value = module.apigw_edge.api_invoke_url }

output "bastion_public_ip" { value = module.bastion.bastion_public_ip }

output "data_private_ip"      { value = module.domain_data.private_ip }

output "business_private_ip" { value = module.domain_business.private_ip }
output "trust_private_ip"    { value = module.domain_trust.private_ip }
output "support_private_ip"  { value = module.domain_support.private_ip }
output "messaging_private_ip" { value = module.domain_messaging.private_ip }
output "frontend_public_ip"  { value = module.frontend.public_ip }
output "frontend_private_ip" { value = module.frontend.private_ip }

output "backup_bucket"     { value = module.backup.bucket_name }
output "log_group_app"     { value = module.cloudwatch.log_group_app }
output "log_group_infra"   { value = module.cloudwatch.log_group_infra }
