variable "project"     { type = string }
variable "environment" { type = string }
variable "vpc_id"      { type = string }
variable "subnet_ids"  { type = list(string) }

# Para Academy/labs separados: permitimos acceso desde tu IP (opcional) y desde bastion.
variable "my_ip_cidr"     { type = string }
variable "bastion_sg_id"  { type = string }

variable "db_name"     { type = string }
variable "db_username" { type = string }
variable "db_password" { type = string }

resource "aws_db_subnet_group" "this" {
  name       = "${var.project}-${var.environment}-dbsubnets"
  subnet_ids = var.subnet_ids
}

resource "aws_security_group" "rds" {
  name   = "${var.project}-${var.environment}-sg-rds"
  vpc_id = var.vpc_id

  ingress {
    description = "Postgres from my IP (temporary)"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.my_ip_cidr]
  }

  ingress {
    description     = "Postgres from Bastion"
    from_port       = 5432
    to_port         = 5432
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

resource "aws_db_instance" "this" {
  identifier             = "${var.project}-${var.environment}-pg"
  engine                 = "postgres"
  engine_version         = "15"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  db_name                = var.db_name
  username               = var.db_username
  password               = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  publicly_accessible    = true
  skip_final_snapshot    = true
  deletion_protection    = false
}

output "rds_endpoint" { value = aws_db_instance.this.address }
output "rds_sg_id"    { value = aws_security_group.rds.id }
