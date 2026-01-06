variable "project"     { type = string }
variable "environment" { type = string }
variable "vpc_id"      { type = string }
variable "subnet_id"   { type = string }
variable "key_name"    { type = string }
variable "bastion_sg_id" { type = string }

data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]
  filter { 
    name = "name"
    values = ["al2023-ami-*-x86_64"] 
    }
}

resource "aws_security_group" "redis" {
  name   = "${var.project}-${var.environment}-sg-redis"
  vpc_id = var.vpc_id

  ingress {
    description     = "Redis from Bastion"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [var.bastion_sg_id]
  }

  ingress {
    description     = "SSH from Bastion"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [var.bastion_sg_id]
  }

  egress { 
    from_port = 0 
    to_port = 0 
    protocol = "-1" 
    cidr_blocks = ["0.0.0.0/0"] 
    }
}

resource "aws_instance" "redis" {
  ami                    = data.aws_ami.al2023.id
  instance_type          = "t3.micro"
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [aws_security_group.redis.id]
  key_name               = var.key_name

  user_data = base64encode(<<-EOF
    #!/bin/bash
    dnf update -y
  EOF
  )

  tags = { Name = "${var.project}-${var.environment}-redis-host" }
}

output "redis_private_ip" { value = aws_instance.redis.private_ip }
output "redis_sg_id"      { value = aws_security_group.redis.id }
