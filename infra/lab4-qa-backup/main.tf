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
