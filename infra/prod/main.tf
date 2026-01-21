module "network" {
  source = "../modules/network"

  project     = var.project
  environment = var.environment

  vpc_cidr             = var.vpc_cidr
  azs                  = var.azs
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

module "bastion" {
  source = "../modules/bastion"

  project     = var.project
  environment = var.environment

  vpc_id         = module.network.vpc_id
  subnet_id      = module.network.public_subnet_ids[0]
  my_ip_cidr     = var.my_ip_cidr
  ssh_public_key = var.ssh_public_key
}

module "alb_asg" {
  source = "../modules/alb_asg"

  project     = var.project
  environment = var.environment

  vpc_id             = module.network.vpc_id
  public_subnet_ids  = module.network.public_subnet_ids
  private_subnet_ids = module.network.private_subnet_ids

  key_name      = module.bastion.key_name
  bastion_sg_id = module.bastion.bastion_sg_id
}

module "apigw_edge" {
  source = "../modules/apigw_edge"

  project      = var.project
  environment  = var.environment
  alb_dns_name = module.alb_asg.alb_dns_name
}

module "postgres" {
  source = "../modules/rds_postgres"

  project     = var.project
  environment = var.environment

  vpc_id      = module.network.vpc_id
  subnet_ids  = module.network.private_subnet_ids

  my_ip_cidr    = var.my_ip_cidr
  bastion_sg_id = module.bastion.bastion_sg_id

  db_name     = var.db_name
  db_username = var.db_username
  db_password = var.db_password
}

module "mongo" {
  source = "../modules/ec2_mongo"

  project     = var.project
  environment = var.environment

  vpc_id        = module.network.vpc_id
  subnet_id     = module.network.private_subnet_ids[0]
  key_name      = module.bastion.key_name
  bastion_sg_id = module.bastion.bastion_sg_id
}

module "redis" {
  source = "../modules/ec2_redis"

  project     = var.project
  environment = var.environment

  vpc_id        = module.network.vpc_id
  subnet_id     = module.network.private_subnet_ids[1]
  key_name      = module.bastion.key_name
  bastion_sg_id = module.bastion.bastion_sg_id
}

module "backup" {
  source = "../modules/s3_backup"

  project     = var.project
  environment = var.environment
}

module "cloudwatch" {
  source = "../modules/cloudwatch"

  project     = var.project
  environment = var.environment
}
