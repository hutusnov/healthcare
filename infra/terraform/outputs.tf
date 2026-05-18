output "backend_security_group_id" {
  value = aws_security_group.backend_sg.id
}

output "backend_instance_id" {
  value = try(aws_instance.backend[0].id, null)
}
