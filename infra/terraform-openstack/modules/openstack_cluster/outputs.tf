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

output "adopted_inventory" {
  value = {
    network = try({
      id     = data.openstack_networking_network_v2.existing_cluster[0].id
      name   = data.openstack_networking_network_v2.existing_cluster[0].name
      status = data.openstack_networking_network_v2.existing_cluster[0].status
    }, null)
    subnet = try({
      id   = data.openstack_networking_subnet_v2.existing_cluster[0].id
      name = data.openstack_networking_subnet_v2.existing_cluster[0].name
      cidr = data.openstack_networking_subnet_v2.existing_cluster[0].cidr
    }, null)
    router = try({
      id     = data.openstack_networking_router_v2.existing_cluster[0].id
      name   = data.openstack_networking_router_v2.existing_cluster[0].name
      status = data.openstack_networking_router_v2.existing_cluster[0].status
    }, null)
    security_group = try({
      id   = data.openstack_networking_secgroup_v2.existing_cluster[0].id
      name = data.openstack_networking_secgroup_v2.existing_cluster[0].name
    }, null)
    instances = {
      master = try({
        id          = data.openstack_compute_instance_v2.existing_master[0].id
        name        = data.openstack_compute_instance_v2.existing_master[0].name
        power_state = data.openstack_compute_instance_v2.existing_master[0].power_state
      }, null)
      data_node = try({
        id          = data.openstack_compute_instance_v2.existing_data_node[0].id
        name        = data.openstack_compute_instance_v2.existing_data_node[0].name
        power_state = data.openstack_compute_instance_v2.existing_data_node[0].power_state
      }, null)
      worker = try({
        id          = data.openstack_compute_instance_v2.existing_worker[0].id
        name        = data.openstack_compute_instance_v2.existing_worker[0].name
        power_state = data.openstack_compute_instance_v2.existing_worker[0].power_state
      }, null)
    }
  }
}
