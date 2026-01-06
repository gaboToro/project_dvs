variable "aws_region" {
  type        = string
  description = "AWS region"
}

variable "project" {
  type        = string
  description = "Project name"
}

variable "environment" {
  type        = string
  description = "Environment name (dev/qa/prod)"
}

variable "aws_profile" {
  type        = string
  description = "AWS CLI profile name for this lab"
}

variable "my_ip_cidr"     { type = string }
variable "ssh_public_key" { type = string }