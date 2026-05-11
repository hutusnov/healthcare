data "aws_vpc" "selected" {
  id = var.vpc_id
}

resource "aws_security_group" "backend_sg" {
  name        = "healthcare-backend-sg-tf"
  description = "Backend SG managed by Terraform"
  vpc_id      = data.aws_vpc.selected.id

  ingress {
    from_port       = 4000
    to_port         = 4000
    protocol        = "tcp"
    security_groups = []
    cidr_blocks     = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "healthcare-backend-sg-tf"
  }
}

resource "aws_instance" "backend" {
  count                       = var.create_backend_instance ? 1 : 0
  ami                         = var.backend_ami_id
  instance_type               = var.backend_instance_type
  subnet_id                   = var.backend_subnet_id
  key_name                    = var.key_name
  vpc_security_group_ids      = [aws_security_group.backend_sg.id]
  associate_public_ip_address = false

  tags = {
    Name = "NodeJS-Backend-Terraform"
  }
}
