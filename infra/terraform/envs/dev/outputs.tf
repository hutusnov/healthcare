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
