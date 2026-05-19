locals {
  env_name = lower(lookup(var.common_tags, "Env", "dev"))
}

resource "terraform_data" "non_dev_safety_lock" {
  input = local.env_name

  lifecycle {
    precondition {
      condition     = local.env_name == "dev" || var.allow_nondev_plan_with_shared_ids
      error_message = "Safety lock: non-dev plan/apply is blocked by default. Set allow_nondev_plan_with_shared_ids=true only when you intentionally plan/apply non-dev with shared IDs."
    }
  }
}

module "backend_stack" {
  source = "../../modules/backend_stack"

  vpc_id                       = var.vpc_id
  backend_subnet_id            = var.backend_subnet_id
  backend_ami_id               = var.backend_ami_id
  key_name                     = var.key_name
  backend_instance_type        = var.backend_instance_type
  create_backend_instance      = var.create_backend_instance
  backend_sg_name              = var.backend_sg_name
  backend_sg_description       = var.backend_sg_description
  backend_instance_name        = var.backend_instance_name
  backend_ingress_cidrs        = var.backend_ingress_cidrs
  monitoring_security_group_id = var.monitoring_security_group_id
  common_tags                  = var.common_tags
  adopt_existing_sg_safely     = var.adopt_existing_sg_safely
  manage_alb_sg                = var.manage_alb_sg
  alb_sg_name                  = var.alb_sg_name
  alb_sg_description           = var.alb_sg_description
  manage_vpn_sg                = var.manage_vpn_sg
  vpn_sg_name                  = var.vpn_sg_name
  vpn_sg_description           = var.vpn_sg_description
}

module "network_stack" {
  source = "../../modules/network_stack"

  vpc_id                   = var.vpc_id
  public_subnet_1_id       = var.public_subnet_1_id
  public_subnet_1_cidr     = var.public_subnet_1_cidr
  public_subnet_1_az       = var.public_subnet_1_az
  public_subnet_2_id       = var.public_subnet_2_id
  public_subnet_2_cidr     = var.public_subnet_2_cidr
  public_subnet_2_az       = var.public_subnet_2_az
  private_subnet_1_id      = var.private_subnet_1_id
  private_subnet_1_cidr    = var.private_subnet_1_cidr
  private_subnet_1_az      = var.private_subnet_1_az
  private_subnet_2_id      = var.private_subnet_2_id
  private_subnet_2_cidr    = var.private_subnet_2_cidr
  private_subnet_2_az      = var.private_subnet_2_az
  igw_id                   = var.igw_id
  nat_gateway_id           = var.nat_gateway_id
  nat_eip_allocation_id    = var.nat_eip_allocation_id
  public_route_table_id    = var.public_route_table_id
  private_route_table_1_id = var.private_route_table_1_id
  private_route_table_2_id = var.private_route_table_2_id
  public_rtb_assoc_1_id    = var.public_rtb_assoc_1_id
  public_rtb_assoc_2_id    = var.public_rtb_assoc_2_id
  private_rtb_assoc_1_id   = var.private_rtb_assoc_1_id
  private_rtb_assoc_2_id   = var.private_rtb_assoc_2_id
  common_tags              = var.common_tags
}

module "alb_stack" {
  source = "../../modules/alb_stack"

  vpc_id                    = var.vpc_id
  public_subnet_ids         = [var.public_subnet_1_id, var.public_subnet_2_id]
  alb_security_group_id     = module.backend_stack.alb_security_group_id
  alb_name                  = var.alb_name
  target_group_name         = var.target_group_name
  target_group_port         = var.target_group_port
  target_group_protocol     = var.target_group_protocol
  health_check_path         = var.health_check_path
  http_listener_port        = var.http_listener_port
  https_listener_port       = var.https_listener_port
  https_certificate_arn     = var.https_certificate_arn
  https_ssl_policy          = var.https_ssl_policy
  https_fixed_response_body = var.https_fixed_response_body
  target_instance_ids       = var.target_instance_ids
  common_tags               = var.common_tags
}

module "observability_stack" {
  source = "../../modules/observability_stack"

  alb_arn              = module.alb_stack.alb_arn
  target_group_arn     = module.alb_stack.target_group_arn
  backend_instance_ids = var.target_instance_ids
  alarm_prefix         = var.alarm_prefix
  sns_topic_arn        = var.alarm_sns_topic_arn
}

module "iam_github_actions" {
  source = "../../modules/iam_github_actions"

  github_owner          = var.github_owner
  github_repo           = var.github_repo
  role_name             = var.github_actions_role_name
  aws_region            = var.aws_region
  allowed_workflow_refs = var.allowed_workflow_refs
  backend_instance_ids  = var.target_instance_ids
}

module "frontend_stack" {
  source = "../../modules/frontend_stack"

  common_tags = var.common_tags
}
