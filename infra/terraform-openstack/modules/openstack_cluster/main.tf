locals {
  create_mode = var.adopt_existing_only == false
  base_tags = [
    var.project_name,
    var.env,
    "managed-by-terraform"
  ]
}

check "create_mode_inputs" {
  assert {
    condition = local.create_mode == false || (
      trim(var.external_network_id) != "" &&
      trim(var.image_name) != "" &&
      trim(var.flavor_name) != "" &&
      trim(var.keypair_name) != ""
    )
    error_message = "Create mode requires external_network_id, image_name, flavor_name, and keypair_name."
  }
}

resource "openstack_networking_network_v2" "cluster" {
  count          = local.create_mode ? 1 : 0
  name           = "${var.project_name}-${var.env}-net"
  admin_state_up = true
}

resource "openstack_networking_subnet_v2" "cluster" {
  count      = local.create_mode ? 1 : 0
  name       = "${var.project_name}-${var.env}-subnet"
  network_id = openstack_networking_network_v2.cluster[0].id
  cidr       = "192.168.120.0/24"
  ip_version = 4
  enable_dhcp = true
}

resource "openstack_networking_router_v2" "cluster" {
  count               = local.create_mode ? 1 : 0
  name                = "${var.project_name}-${var.env}-router"
  admin_state_up      = true
  external_network_id = var.external_network_id
}

resource "openstack_networking_router_interface_v2" "cluster" {
  count     = local.create_mode ? 1 : 0
  router_id = openstack_networking_router_v2.cluster[0].id
  subnet_id = openstack_networking_subnet_v2.cluster[0].id
}

resource "openstack_networking_secgroup_v2" "cluster" {
  count       = local.create_mode ? 1 : 0
  name        = "${var.project_name}-${var.env}-sg"
  description = "Base security group for UIT Healthcare cluster"
}

resource "openstack_networking_secgroup_rule_v2" "ssh" {
  count             = local.create_mode ? 1 : 0
  direction         = "ingress"
  ethertype         = "IPv4"
  protocol          = "tcp"
  port_range_min    = 22
  port_range_max    = 22
  remote_ip_prefix  = "0.0.0.0/0"
  security_group_id = openstack_networking_secgroup_v2.cluster[0].id
}

resource "openstack_compute_instance_v2" "master" {
  count       = local.create_mode ? 1 : 0
  name        = var.master_name
  image_name  = var.image_name
  flavor_name = var.flavor_name
  key_pair    = var.keypair_name
  security_groups = [openstack_networking_secgroup_v2.cluster[0].name]
  network {
    uuid = openstack_networking_network_v2.cluster[0].id
  }
  metadata = {
    role = "master"
  }
}

resource "openstack_compute_instance_v2" "data_node" {
  count       = local.create_mode ? 1 : 0
  name        = var.data_node_name
  image_name  = var.image_name
  flavor_name = var.flavor_name
  key_pair    = var.keypair_name
  security_groups = [openstack_networking_secgroup_v2.cluster[0].name]
  network {
    uuid = openstack_networking_network_v2.cluster[0].id
  }
  metadata = {
    role = "data"
  }
}

resource "openstack_compute_instance_v2" "worker" {
  count       = local.create_mode ? 1 : 0
  name        = var.worker_name
  image_name  = var.image_name
  flavor_name = var.flavor_name
  key_pair    = var.keypair_name
  security_groups = [openstack_networking_secgroup_v2.cluster[0].name]
  network {
    uuid = openstack_networking_network_v2.cluster[0].id
  }
  metadata = {
    role = "worker"
  }
}
