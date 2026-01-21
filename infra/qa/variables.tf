variable "aws_region" {
  type        = string
  description = "AWS region"
}

variable "aws_profile" {
  type        = string
  description = "AWS CLI profile name"
}

variable "project" {
  type        = string
  description = "Project name"
}

variable "environment" {
  type        = string
  description = "Environment name (qa/prod)"
}

variable "my_ip_cidr" {
  type        = string
  description = "Your public IP (x.x.x.x/32) for temporary access"
}

variable "ssh_public_key" {
  type        = string
  description = "SSH public key for bastion access"
}

variable "vpc_cidr" {
  type        = string
  description = "VPC CIDR"
}

variable "azs" {
  type        = list(string)
  description = "Availability zones"
}

variable "public_subnet_cidrs" {
  type        = list(string)
  description = "Public subnet CIDRs"
}

variable "private_subnet_cidrs" {
  type        = list(string)
  description = "Private subnet CIDRs"
}

variable "db_name" {
  type        = string
  description = "Postgres database name"
}

variable "db_username" {
  type        = string
  description = "Postgres master username"
}

variable "db_password" {
  type        = string
  description = "Postgres master password"
}
