output "public_subnet_1_id" {
  value = aws_subnet.public_1.id
}

output "public_subnet_2_id" {
  value = aws_subnet.public_2.id
}

output "private_subnet_1_id" {
  value = aws_subnet.private_1.id
}

output "private_subnet_2_id" {
  value = aws_subnet.private_2.id
}

output "internet_gateway_id" {
  value = aws_internet_gateway.this.id
}

output "nat_gateway_id" {
  value = var.nat_gateway_id
}

output "public_route_table_id" {
  value = aws_route_table.public.id
}

output "private_route_table_1_id" {
  value = aws_route_table.private_1.id
}

output "private_route_table_2_id" {
  value = aws_route_table.private_2.id
}
