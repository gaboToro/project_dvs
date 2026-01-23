variable "project_name" {
  type    = string
  default = "dvs"
}

variable "environment" {
  type    = string
  default = "qa"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "vpc_cidr" {
  type    = string
  default = "10.10.0.0/16"
}

variable "public_subnet_cidr" {
  type    = string
  default = "10.10.1.0/24"
}

variable "public_subnet_cidr_b" {
  type    = string
  default = "10.10.2.0/24"
}

variable "my_ip_cidr" {
  type        = string
  description = "Your public IP in CIDR format for SSH access (e.g. 1.2.3.4/32)."
}

variable "ssh_public_key" {
  type        = string
  description = "Public SSH key material for the EC2 key pair."
}

variable "site24x7_key" {
  type        = string
  description = "Site24x7 Linux agent key."
}

variable "instance_type_core" {
  type    = string
  default = "t3.medium"
}

variable "instance_type_services" {
  type    = string
  default = "t3.small"
}

variable "core_private_ip" {
  type    = string
  default = "10.10.1.10"
}

variable "identity_private_ip" {
  type    = string
  default = "10.10.1.11"
}

variable "business_private_ip" {
  type    = string
  default = "10.10.1.12"
}

variable "trust_support_private_ip" {
  type    = string
  default = "10.10.1.13"
}

variable "image_repo_prefix" {
  type    = string
  default = "ghcr.io/gabotoro"
}

variable "image_tag" {
  type    = string
  default = "qa"
}

variable "cors_origins" {
  type    = string
  default = "http://localhost"
}

variable "jwt_secret" {
  type    = string
  default = "super-secret-key-for-dev-only"
}

variable "internal_service_token" {
  type    = string
  default = "dev-internal-token"
}

variable "admin_password" {
  type    = string
  default = "admin123"
}

variable "voter_password" {
  type    = string
  default = "voter123"
}

variable "voter_hash_secret" {
  type    = string
  default = "dev-voter-hash-secret"
}

variable "seed_default_users" {
  type    = string
  default = "false"
}

variable "supabase_url" {
  type    = string
  default = "https://ojgzxekngfiejuwunejx.supabase.co"
}

variable "supabase_service_role_key" {
  type    = string
  default = "sb_secret_PtOswQE4FE97KZRGdVV9Fg_0fdDZECf"
}

variable "supabase_pg_uri" {
  type    = string
  default = "postgresql://postgres:Gabichotc17500@db.ojgzxekngfiejuwunejx.supabase.co:5432/postgres"
}

variable "pg_user" {
  type    = string
  default = "dvs"
}

variable "pg_password" {
  type    = string
  default = "dvs"
}

variable "pg_database" {
  type    = string
  default = "dvs"
}

variable "dashboard_mongo_user" {
  type    = string
  default = "dvs_user"
}

variable "dashboard_mongo_pass" {
  type    = string
  default = "dvs_pass_123"
}

variable "dashboard_mongo_db" {
  type    = string
  default = "dvs_dashboard"
}

variable "kafka_topic_votes" {
  type    = string
  default = "votes.cast.v1"
}

variable "rabbitmq_queue_email" {
  type    = string
  default = "emails.send"
}

variable "rate_limiter_enabled" {
  type    = string
  default = "true"
}

variable "rate_limiter_limit" {
  type    = string
  default = "60"
}

variable "rate_limiter_window_sec" {
  type    = string
  default = "60"
}

variable "audit_logger_enabled" {
  type    = string
  default = "true"
}

variable "audit_logger_timeout_ms" {
  type    = string
  default = "800"
}

variable "dashboard_consumer_enabled" {
  type    = string
  default = "true"
}

variable "email_consumer_enabled" {
  type    = string
  default = "true"
}

variable "smtp_host" {
  type    = string
  default = "smtp.gmail.com"
}

variable "smtp_port" {
  type    = string
  default = "587"
}

variable "smtp_secure" {
  type    = string
  default = "false"
}

variable "smtp_user" {
  type    = string
  default = "digitalvotings@gmail.com"
}

variable "smtp_pass" {
  type    = string
  default = "CHANGE_ME"
}

variable "smtp_from" {
  type    = string
  default = "digitalvotings@gmail.com"
}

variable "backup_enabled" {
  type    = string
  default = "true"
}

variable "backup_cron" {
  type    = string
  default = "0 2 * * *"
}

variable "backup_dir" {
  type    = string
  default = "backups"
}

variable "backup_pg_enabled" {
  type    = string
  default = "true"
}

variable "backup_mongo_enabled" {
  type    = string
  default = "true"
}

variable "backup_supabase_enabled" {
  type    = string
  default = "false"
}

variable "backup_use_docker" {
  type    = string
  default = "false"
}

variable "backup_supabase_dns" {
  type    = string
  default = "8.8.8.8"
}

variable "backup_supabase_force_ipv4" {
  type    = string
  default = "true"
}

variable "backup_supabase_host_ip" {
  type    = string
  default = ""
}

variable "n8n_host" {
  type    = string
  default = "0.0.0.0"
}

variable "n8n_timezone" {
  type    = string
  default = "America/Guayaquil"
}
