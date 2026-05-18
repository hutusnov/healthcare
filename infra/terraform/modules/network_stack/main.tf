resource "aws_subnet" "public_1" {
  vpc_id            = var.vpc_id
  cidr_block        = var.public_subnet_1_cidr
  availability_zone = var.public_subnet_1_az

  lifecycle {
    ignore_changes = all
  }
}

resource "aws_subnet" "public_2" {
  vpc_id            = var.vpc_id
  cidr_block        = var.public_subnet_2_cidr
  availability_zone = var.public_subnet_2_az

  lifecycle {
    ignore_changes = all
  }
}

resource "aws_subnet" "private_1" {
  vpc_id            = var.vpc_id
  cidr_block        = var.private_subnet_1_cidr
  availability_zone = var.private_subnet_1_az

  lifecycle {
    ignore_changes = all
  }
}

resource "aws_subnet" "private_2" {
  vpc_id            = var.vpc_id
  cidr_block        = var.private_subnet_2_cidr
  availability_zone = var.private_subnet_2_az

  lifecycle {
    ignore_changes = all
  }
}

resource "aws_internet_gateway" "this" {
  vpc_id = var.vpc_id

  lifecycle {
    ignore_changes = all
  }
}

resource "aws_route_table" "public" {
  vpc_id = var.vpc_id

  lifecycle {
    ignore_changes = all
  }
}

resource "aws_route_table" "private_1" {
  vpc_id = var.vpc_id

  lifecycle {
    ignore_changes = all
  }
}

resource "aws_route_table" "private_2" {
  vpc_id = var.vpc_id

  lifecycle {
    ignore_changes = all
  }
}

resource "aws_route_table_association" "public_1" {
  subnet_id      = var.public_subnet_1_id
  route_table_id = var.public_route_table_id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = var.public_subnet_2_id
  route_table_id = var.public_route_table_id
}

resource "aws_route_table_association" "private_1" {
  subnet_id      = var.private_subnet_1_id
  route_table_id = var.private_route_table_1_id
}

resource "aws_route_table_association" "private_2" {
  subnet_id      = var.private_subnet_2_id
  route_table_id = var.private_route_table_2_id
}
