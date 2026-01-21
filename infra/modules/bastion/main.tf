variable "project"     { type = string }
variable "environment" { type = string }
variable "vpc_id"      { type = string }
variable "subnet_id"   { type = string }
variable "my_ip_cidr"  { type = string } # tu IP/32
variable "ssh_public_key" { type = string } # tu llave pública

data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

resource "aws_key_pair" "this" {
  key_name   = "${var.project}-${var.environment}-key"
  public_key = var.ssh_public_key
}

resource "aws_security_group" "bastion" {
  name        = "${var.project}-${var.environment}-sg-bastion"
  description = "Bastion SG"
  vpc_id      = var.vpc_id

  ingress {
    description = "SSH from my IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_ip_cidr]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "bastion" {
  ami                         = data.aws_ami.al2023.id
  instance_type               = "t3.micro"
  subnet_id                   = var.subnet_id
  vpc_security_group_ids      = [aws_security_group.bastion.id]
  key_name                    = aws_key_pair.this.key_name
  associate_public_ip_address = true

  tags = { Name = "${var.project}-${var.environment}-bastion" }
}

resource "aws_eip" "bastion" {
  domain = "vpc"
}

resource "aws_eip_association" "bastion" {
  instance_id   = aws_instance.bastion.id
  allocation_id = aws_eip.bastion.id
}

output "bastion_public_ip" { value = aws_eip.bastion.public_ip }
output "bastion_sg_id"      { value = aws_security_group.bastion.id }
output "key_name"           { value = aws_key_pair.this.key_name }
