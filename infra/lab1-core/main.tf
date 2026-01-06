module "network" {
  source = "../modules/network"

  project     = var.project
  environment = var.environment

  vpc_cidr = "10.10.0.0/16"
  azs      = ["us-east-1a", "us-east-1b"]

  public_subnet_cidrs  = ["10.10.1.0/24", "10.10.2.0/24"]
  private_subnet_cidrs = ["10.10.11.0/24", "10.10.12.0/24"]
}

module "bastion" {
  source = "../modules/bastion"

  project     = var.project
  environment = var.environment

  vpc_id          = module.network.vpc_id
  subnet_id       = module.network.public_subnet_ids[0]
  my_ip_cidr      = var.my_ip_cidr
  ssh_public_key  = var.ssh_public_key
}