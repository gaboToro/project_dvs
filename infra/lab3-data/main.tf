module "network" {
  source = "../modules/network"

  project     = var.project
  environment = var.environment

  vpc_cidr = "10.30.0.0/16"
  azs      = ["us-east-1a", "us-east-1b"]

  public_subnet_cidrs  = ["10.30.1.0/24", "10.30.2.0/24"]
  private_subnet_cidrs = ["10.30.11.0/24", "10.30.12.0/24"]
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

module "postgres" {
  source = "../modules/rds_postgres"

  project     = var.project
  environment = var.environment

  vpc_id      = module.network.vpc_id
  subnet_ids  = module.network.private_subnet_ids

  my_ip_cidr    = var.my_ip_cidr
  bastion_sg_id = module.bastion.bastion_sg_id

  db_name     = "dvs"
  db_username = "postgres"
  db_password = "ChangeMe123!"  # luego lo movemos a variables/secrets
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
