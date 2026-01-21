output "vpc_id" { value = module.network.vpc_id }

output "alb_dns_name"  { value = module.alb_asg.alb_dns_name }
output "api_invoke_url" { value = module.apigw_edge.api_invoke_url }

output "bastion_public_ip" { value = module.bastion.bastion_public_ip }

output "rds_endpoint"      { value = module.postgres.rds_endpoint }
output "mongo_private_ip"  { value = module.mongo.mongo_private_ip }
output "redis_private_ip"  { value = module.redis.redis_private_ip }

output "backup_bucket"     { value = module.backup.bucket_name }
output "log_group_app"     { value = module.cloudwatch.log_group_app }
output "log_group_infra"   { value = module.cloudwatch.log_group_infra }
