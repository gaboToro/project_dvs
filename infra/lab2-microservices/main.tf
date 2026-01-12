module "network" {
  source = "../modules/network"

  project     = var.project
  environment = var.environment

  vpc_cidr = "10.20.0.0/16"
  azs      = ["us-east-1a", "us-east-1b"]

  public_subnet_cidrs  = ["10.20.1.0/24", "10.20.2.0/24"]
  private_subnet_cidrs = ["10.20.11.0/24", "10.20.12.0/24"]
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

  project     = var.project
  environment = var.environment
  alb_dns_name = module.alb_asg.alb_dns_name
}