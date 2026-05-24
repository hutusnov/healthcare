output "vpc_id" {
  value = aws_vpc.this.id
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "backend_instance_ids" {
  value = aws_instance.backend[*].id
}

output "backend_public_ips" {
  value = aws_instance.backend[*].public_ip
}

output "backend_private_ips" {
  value = aws_instance.backend[*].private_ip
}

output "backend_security_group_id" {
  value = aws_security_group.backend.id
}

output "backend_secret_name" {
  value = aws_secretsmanager_secret.backend.name
}

output "backend_secret_arn" {
  value = aws_secretsmanager_secret.backend.arn
}

output "alb_dns_name" {
  value = try(aws_lb.backend[0].dns_name, null)
}

output "target_group_arn" {
  value = try(aws_lb_target_group.backend[0].arn, null)
}

output "ansible_inventory_hint" {
  value = {
    inventory = "infra/ansible/inventory/staging.yml"
    hosts     = aws_instance.backend[*].public_ip
  }
}
