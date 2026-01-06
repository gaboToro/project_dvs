output "vpc_id"             { value = module.network.vpc_id }
output "public_subnet_ids"  { value = module.network.public_subnet_ids }
output "private_subnet_ids" { value = module.network.private_subnet_ids }

output "bastion_public_ip"  { value = module.bastion.bastion_public_ip }
output "bastion_sg_id"      { value = module.bastion.bastion_sg_id }
output "key_name"           { value = module.bastion.key_name }
