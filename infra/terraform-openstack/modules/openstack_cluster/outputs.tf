output "create_mode" {
  value = local.create_mode
}

output "intended_nodes" {
  value = {
    master    = var.master_name
    data_node = var.data_node_name
    worker    = var.worker_name
  }
}
