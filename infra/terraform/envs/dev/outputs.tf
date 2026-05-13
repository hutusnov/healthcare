output "backend_security_group_id" {
  value = module.backend_stack.backend_security_group_id
}

output "backend_instance_id" {
  value = module.backend_stack.backend_instance_id
}

output "alb_security_group_id" {
  value = module.backend_stack.alb_security_group_id
}

output "vpn_security_group_id" {
  value = module.backend_stack.vpn_security_group_id
}

output "public_subnet_1_id" {
  value = module.network_stack.public_subnet_1_id
}

output "public_subnet_2_id" {
  value = module.network_stack.public_subnet_2_id
}

output "private_subnet_1_id" {
  value = module.network_stack.private_subnet_1_id
}

output "private_subnet_2_id" {
  value = module.network_stack.private_subnet_2_id
}

output "internet_gateway_id" {
  value = module.network_stack.internet_gateway_id
}

output "nat_gateway_id" {
  value = module.network_stack.nat_gateway_id
}

output "alb_dns_name" {
  value = module.alb_stack.alb_dns_name
}

output "target_group_arn" {
  value = module.alb_stack.target_group_arn
}
