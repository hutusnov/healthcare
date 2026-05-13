output "openstack_summary" {
  value = {
    project            = var.project_name
    env                = var.env
    adopt_existing_only = var.adopt_existing_only
    master_name        = var.master_name
    data_node_name     = var.data_node_name
    worker_name        = var.worker_name
  }
}
