module "openstack_cluster" {
  source = "../../modules/openstack_cluster"

  project_name        = var.project_name
  env                 = var.env
  region              = var.region
  external_network_id = var.external_network_id

  master_name    = var.master_name
  data_node_name = var.data_node_name
  worker_name    = var.worker_name
  image_name     = var.image_name
  flavor_name    = var.flavor_name
  keypair_name   = var.keypair_name

  existing_network_id   = var.existing_network_id
  existing_subnet_id    = var.existing_subnet_id
  existing_router_id    = var.existing_router_id
  existing_secgroup_id  = var.existing_secgroup_id
  existing_master_id    = var.existing_master_id
  existing_data_node_id = var.existing_data_node_id
  existing_worker_id    = var.existing_worker_id

  adopt_existing_only = var.adopt_existing_only
}
