module "backend_stack" {
  source = "../../modules/backend_stack"

  vpc_id                  = var.vpc_id
  backend_subnet_id       = var.backend_subnet_id
  backend_ami_id          = var.backend_ami_id
  key_name                = var.key_name
  backend_instance_type   = var.backend_instance_type
  create_backend_instance = var.create_backend_instance
  backend_sg_name         = var.backend_sg_name
  backend_instance_name   = var.backend_instance_name
  backend_ingress_cidrs   = var.backend_ingress_cidrs
  common_tags             = var.common_tags
}

