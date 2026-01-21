variable "project"     { type = string }
variable "environment" { type = string }
variable "name"        { type = string }
variable "vpc_id"      { type = string }
variable "subnet_id"   { type = string }
variable "key_name"    { type = string }
variable "bastion_sg_id" { type = string }
variable "instance_type" {
  type    = string
  default = "t3.micro"
}
variable "user_data" {
  type    = string
  default = ""
}

locals {
  default_user_data = <<-EOF
    #!/bin/bash
    dnf update -y
    dnf install -y docker git docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    usermod -aG docker ec2-user
  EOF
  effective_user_data = var.user_data != "" ? var.user_data : local.default_user_data
}

data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

resource "aws_security_group" "frontend" {
  name   = "${var.project}-${var.environment}-sg-${var.name}"
  vpc_id = var.vpc_id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description     = "SSH from Bastion"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [var.bastion_sg_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "frontend" {
  ami                    = data.aws_ami.al2023.id
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [aws_security_group.frontend.id]
  key_name               = var.key_name

  user_data = base64encode(local.effective_user_data)

  tags = { Name = "${var.project}-${var.environment}-${var.name}-host" }
}

output "public_ip"  { value = aws_instance.frontend.public_ip }
output "private_ip" { value = aws_instance.frontend.private_ip }
output "sg_id"      { value = aws_security_group.frontend.id }
