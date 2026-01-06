variable "project"     { type = string }
variable "environment" { type = string }
variable "vpc_cidr"    { type = string }
variable "azs"         { type = list(string) }
variable "public_subnet_cidrs"  { type = list(string) }
variable "private_subnet_cidrs" { type = list(string) }

resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = {
    Name = "${var.project}-${var.environment}-vpc"
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.this.id
  tags = { Name = "${var.project}-${var.environment}-igw" }
}

resource "aws_subnet" "public" {
  count                   = length(var.azs)
  vpc_id                  = aws_vpc.this.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.azs[count.index]
  map_public_ip_on_launch = true
  tags = { Name = "${var.project}-${var.environment}-public-${count.index + 1}" }
}

resource "aws_subnet" "private" {
  count             = length(var.azs)
  vpc_id            = aws_vpc.this.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.azs[count.index]
  tags = { Name = "${var.project}-${var.environment}-private-${count.index + 1}" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id
  tags   = { Name = "${var.project}-${var.environment}-rt-public" }
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw.id
}

resource "aws_route_table_association" "public_assoc" {
  count          = length(aws_subnet.public)
  route_table_id = aws_route_table.public.id
  subnet_id      = aws_subnet.public[count.index].id
}

resource "aws_eip" "nat" {
  domain = "vpc"
  tags   = { Name = "${var.project}-${var.environment}-nat-eip" }
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
  tags          = { Name = "${var.project}-${var.environment}-nat" }
  depends_on    = [aws_internet_gateway.igw]
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.this.id
  tags   = { Name = "${var.project}-${var.environment}-rt-private" }
}

resource "aws_route" "private_out" {
  route_table_id         = aws_route_table.private.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat.id
}

resource "aws_route_table_association" "private_assoc" {
  count          = length(aws_subnet.private)
  route_table_id = aws_route_table.private.id
  subnet_id      = aws_subnet.private[count.index].id
}

output "vpc_id"            { value = aws_vpc.this.id }
output "public_subnet_ids" { value = [for s in aws_subnet.public : s.id] }
output "private_subnet_ids"{ value = [for s in aws_subnet.private : s.id] }
