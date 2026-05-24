data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "ubuntu_2404" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
  azs         = slice(data.aws_availability_zones.available.names, 0, length(var.public_subnet_cidrs))
  tags = merge(var.common_tags, {
    Project     = var.project_name
    Environment = var.environment
    Env         = var.environment
    Managed     = "terraform"
  })
  ec2_key_name = var.create_key_pair ? aws_key_pair.staging[0].key_name : var.key_name
}

resource "terraform_data" "safety_guard" {
  input = var.environment

  lifecycle {
    precondition {
      condition     = var.environment == "staging"
      error_message = "staging-zero is allowed only for the staging environment."
    }
    precondition {
      condition     = !var.create_key_pair || trimspace(var.ssh_public_key) != ""
      error_message = "ssh_public_key is required when create_key_pair=true."
    }
    precondition {
      condition     = can(cidrhost(var.admin_ssh_cidr, 0))
      error_message = "admin_ssh_cidr must be a valid CIDR, for example 1.2.3.4/32."
    }
  }
}

resource "aws_key_pair" "staging" {
  count      = var.create_key_pair ? 1 : 0
  key_name   = var.key_name
  public_key = var.ssh_public_key

  tags = merge(local.tags, {
    Name = var.key_name
  })
}

resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-igw"
  })
}

resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.this.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-public-${count.index + 1}"
    Tier = "public"
  })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-public-rt"
  })
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_security_group" "alb" {
  count       = var.create_alb ? 1 : 0
  name        = "${local.name_prefix}-alb-sg"
  description = "Staging ALB security group"
  vpc_id      = aws_vpc.this.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  dynamic "ingress" {
    for_each = var.enable_https_listener ? [1] : []
    content {
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-alb-sg"
  })
}

resource "aws_security_group" "backend" {
  name        = "${local.name_prefix}-backend-sg"
  description = "Staging backend security group"
  vpc_id      = aws_vpc.this.id

  ingress {
    description = "SSH from admin"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_ssh_cidr]
  }

  ingress {
    description = "SSH between staging backend nodes for Ansible ProxyJump"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    self        = true
  }

  ingress {
    description = "Backend from ALB or admin"
    from_port   = 4000
    to_port     = 4000
    protocol    = "tcp"
    cidr_blocks = var.create_alb ? [] : [var.admin_ssh_cidr]
    security_groups = var.create_alb ? [
      aws_security_group.alb[0].id
    ] : []
  }

  ingress {
    description = "Node exporter from admin"
    from_port   = 9100
    to_port     = 9100
    protocol    = "tcp"
    cidr_blocks = [var.admin_ssh_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-backend-sg"
  })
}

resource "aws_iam_role" "ssm" {
  name = "${local.name_prefix}-ec2-ssm-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.ssm.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ssm" {
  name = "${local.name_prefix}-ec2-ssm-profile"
  role = aws_iam_role.ssm.name
}

resource "aws_secretsmanager_secret" "backend" {
  name                    = "${local.name_prefix}/backend"
  description             = "Runtime backend secrets for ${local.name_prefix}. Secret values are managed outside Terraform state."
  recovery_window_in_days = var.secret_recovery_window_in_days

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-backend-secrets"
  })
}

resource "aws_instance" "backend" {
  count                       = var.backend_count
  ami                         = data.aws_ami.ubuntu_2404.id
  instance_type               = var.backend_instance_type
  subnet_id                   = aws_subnet.public[count.index % length(aws_subnet.public)].id
  key_name                    = local.ec2_key_name
  vpc_security_group_ids      = [aws_security_group.backend.id]
  associate_public_ip_address = true
  iam_instance_profile        = aws_iam_instance_profile.ssm.name

  user_data = <<-EOT
    #!/usr/bin/env bash
    set -euxo pipefail
    apt-get update
    apt-get install -y python3 curl ca-certificates gnupg lsb-release
    snap install amazon-ssm-agent --classic || true
    systemctl enable --now snap.amazon-ssm-agent.amazon-ssm-agent.service || systemctl enable --now amazon-ssm-agent || true
  EOT

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-backend-${count.index + 1}"
    Role = "backend"
  })
}

resource "aws_lb" "backend" {
  count              = var.create_alb ? 1 : 0
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb[0].id]
  subnets            = aws_subnet.public[*].id

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-alb"
  })
}

resource "aws_lb_target_group" "backend" {
  count       = var.create_alb ? 1 : 0
  name        = "${local.name_prefix}-tg"
  port        = 4000
  protocol    = "HTTP"
  target_type = "instance"
  vpc_id      = aws_vpc.this.id

  health_check {
    enabled             = true
    path                = "/api/health"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 3
    unhealthy_threshold = 2
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-tg"
  })
}

resource "aws_lb_target_group_attachment" "backend" {
  count            = var.create_alb ? length(aws_instance.backend) : 0
  target_group_arn = aws_lb_target_group.backend[0].arn
  target_id        = aws_instance.backend[count.index].id
  port             = 4000
}

resource "aws_lb_listener" "http" {
  count             = var.create_alb ? 1 : 0
  load_balancer_arn = aws_lb.backend[0].arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend[0].arn
  }
}

resource "aws_lb_listener" "https" {
  count             = var.create_alb && var.enable_https_listener ? 1 : 0
  load_balancer_arn = aws_lb.backend[0].arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.acm_certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend[0].arn
  }

  lifecycle {
    precondition {
      condition     = !var.enable_https_listener || trimspace(var.acm_certificate_arn) != ""
      error_message = "acm_certificate_arn is required when enable_https_listener=true."
    }
  }
}
