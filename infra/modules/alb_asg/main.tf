variable "project"     { type = string }
variable "environment" { type = string }
variable "vpc_id"      { type = string }
variable "public_subnet_ids"  { type = list(string) }
variable "private_subnet_ids" { type = list(string) }
variable "key_name"    { type = string }
variable "bastion_sg_id"{ type = string }
variable "user_data" {
  type    = string
  default = ""
}

locals {
  default_user_data = <<-EOF
    #!/bin/bash
    dnf update -y
    dnf install -y docker docker-compose-plugin
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
    name = "name"
    values = ["al2023-ami-*-x86_64"] 
    }
}

resource "aws_security_group" "alb" {
  name   = "${var.project}-${var.environment}-sg-alb"
  vpc_id = var.vpc_id

  ingress { 
    from_port = 80 
    to_port = 80 
    protocol = "tcp" 
    cidr_blocks = ["0.0.0.0/0"] 
    }

  egress  { 
    from_port = 0  
    to_port = 0  
    protocol = "-1"  
    cidr_blocks = ["0.0.0.0/0"] 
    }
}

resource "aws_security_group" "app" {
  name   = "${var.project}-${var.environment}-sg-app"
  vpc_id = var.vpc_id

  ingress {
    description     = "HTTP from ALB to app port 3000"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
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

resource "aws_lb" "alb" {
  name               = "${var.project}-${var.environment}-alb"
  load_balancer_type = "application"
  subnets            = var.public_subnet_ids
  security_groups    = [aws_security_group.alb.id]
}

resource "aws_lb_target_group" "tg" {
  name     = "${var.project}-${var.environment}-tg"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    path = "/"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.alb.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.tg.arn
  }
}

resource "aws_launch_template" "lt" {
  name_prefix   = "${var.project}-${var.environment}-lt-"
  image_id      = data.aws_ami.al2023.id
  instance_type = "t3.micro"
  key_name      = var.key_name

  vpc_security_group_ids = [aws_security_group.app.id]

  # Prepara el host y, si se define, ejecuta user_data personalizado.
  user_data = base64encode(local.effective_user_data)
}

resource "aws_autoscaling_group" "asg" {
  name                = "${var.project}-${var.environment}-asg"
  desired_capacity    = 1
  min_size            = 1
  max_size            = 2
  vpc_zone_identifier = var.private_subnet_ids

  launch_template {
    id      = aws_launch_template.lt.id
    version = "$Latest"
  }

  target_group_arns = [aws_lb_target_group.tg.arn]
  health_check_type = "ELB"
}

output "alb_dns_name" { value = aws_lb.alb.dns_name }
output "app_sg_id"    { value = aws_security_group.app.id }
