output "bastion_public_ip" { value = module.bastion.bastion_public_ip }
output "rds_endpoint"      { value = module.postgres.rds_endpoint }
output "mongo_private_ip"  { value = module.mongo.mongo_private_ip }
output "redis_private_ip"  { value = module.redis.redis_private_ip }
