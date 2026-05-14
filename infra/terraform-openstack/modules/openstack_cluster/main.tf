locals {
  create_mode            = var.adopt_existing_only == false
  adopt_mode             = var.adopt_existing_only == true
  manage_core            = local.create_mode || local.adopt_mode
  manage_compute_adopted = local.adopt_mode && var.manage_compute_instances
  base_tags = [
    var.project_name,
    var.env,
    "managed-by-terraform"
  ]
}

check "create_mode_inputs" {
  assert {
    condition = local.create_mode == false || (
      trimspace(var.external_network_id) != "" &&
      trimspace(var.image_name) != "" &&
      trimspace(var.flavor_name) != "" &&
      trimspace(var.keypair_name) != ""
    )
    error_message = "Create mode requires external_network_id, image_name, flavor_name, and keypair_name."
  }
}

data "openstack_networking_network_v2" "existing_cluster" {
  count      = local.adopt_mode && trimspace(var.existing_network_id) != "" ? 1 : 0
  network_id = var.existing_network_id
  region     = var.region
}

data "openstack_networking_subnet_v2" "existing_cluster" {
  count     = local.adopt_mode && trimspace(var.existing_subnet_id) != "" ? 1 : 0
  subnet_id = var.existing_subnet_id
  region    = var.region
}

data "openstack_networking_router_v2" "existing_cluster" {
  count     = local.adopt_mode && trimspace(var.existing_router_id) != "" ? 1 : 0
  router_id = var.existing_router_id
  region    = var.region
}

data "openstack_networking_secgroup_v2" "existing_cluster" {
  count       = local.adopt_mode && trimspace(var.existing_secgroup_id) != "" ? 1 : 0
  secgroup_id = var.existing_secgroup_id
  region      = var.region
}

data "openstack_compute_instance_v2" "existing_master" {
  count  = local.adopt_mode && trimspace(var.existing_master_id) != "" ? 1 : 0
  id     = var.existing_master_id
  region = var.region
}

data "openstack_compute_instance_v2" "existing_data_node" {
  count  = local.adopt_mode && trimspace(var.existing_data_node_id) != "" ? 1 : 0
  id     = var.existing_data_node_id
  region = var.region
}

data "openstack_compute_instance_v2" "existing_worker" {
  count  = local.adopt_mode && trimspace(var.existing_worker_id) != "" ? 1 : 0
  id     = var.existing_worker_id
  region = var.region
}

resource "openstack_networking_network_v2" "cluster" {
  count          = local.manage_core ? 1 : 0
  name           = "${var.project_name}-${var.env}-net"
  admin_state_up = true

  lifecycle {
    ignore_changes = all
  }
}

resource "openstack_networking_subnet_v2" "cluster" {
  count       = local.manage_core ? 1 : 0
  name        = "${var.project_name}-${var.env}-subnet"
  network_id  = openstack_networking_network_v2.cluster[0].id
  cidr        = "192.168.120.0/24"
  ip_version  = 4
  enable_dhcp = true

  lifecycle {
    ignore_changes = all
  }
}

resource "openstack_networking_router_v2" "cluster" {
  count               = local.manage_core ? 1 : 0
  name                = "${var.project_name}-${var.env}-router"
  admin_state_up      = true
  external_network_id = var.external_network_id

  lifecycle {
    ignore_changes = all
  }
}

resource "openstack_networking_router_interface_v2" "cluster" {
  count     = local.create_mode ? 1 : 0
  router_id = openstack_networking_router_v2.cluster[0].id
  subnet_id = openstack_networking_subnet_v2.cluster[0].id
}

resource "openstack_networking_secgroup_v2" "cluster" {
  count       = local.manage_core ? 1 : 0
  name        = "${var.project_name}-${var.env}-sg"
  description = "Base security group for UIT Healthcare cluster"

  lifecycle {
    ignore_changes = all
  }
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
  count           = local.create_mode ? 1 : 0
  name            = var.master_name
  image_name      = var.image_name
  flavor_name     = var.flavor_name
  key_pair        = var.keypair_name
  security_groups = [openstack_networking_secgroup_v2.cluster[0].name]
  network {
    uuid = openstack_networking_network_v2.cluster[0].id
  }
  metadata = {
    role = "master"
  }
}

resource "openstack_compute_instance_v2" "data_node" {
  count           = local.create_mode ? 1 : 0
  name            = var.data_node_name
  image_name      = var.image_name
  flavor_name     = var.flavor_name
  key_pair        = var.keypair_name
  security_groups = [openstack_networking_secgroup_v2.cluster[0].name]
  network {
    uuid = openstack_networking_network_v2.cluster[0].id
  }
  metadata = {
    role = "data"
  }
}

resource "openstack_compute_instance_v2" "worker" {
  count           = local.create_mode ? 1 : 0
  name            = var.worker_name
  image_name      = var.image_name
  flavor_name     = var.flavor_name
  key_pair        = var.keypair_name
  security_groups = [openstack_networking_secgroup_v2.cluster[0].name]
  network {
    uuid = openstack_networking_network_v2.cluster[0].id
  }
  metadata = {
    role = "worker"
  }
}

resource "openstack_compute_instance_v2" "adopted_master" {
  count = local.manage_compute_adopted ? 1 : 0
  name  = var.master_name

  lifecycle {
    ignore_changes = all
  }
}

resource "openstack_compute_instance_v2" "adopted_data_node" {
  count = local.manage_compute_adopted ? 1 : 0
  name  = var.data_node_name

  lifecycle {
    ignore_changes = all
  }
}

resource "openstack_compute_instance_v2" "adopted_worker" {
  count = local.manage_compute_adopted ? 1 : 0
  name  = var.worker_name

  lifecycle {
    ignore_changes = all
  }
}
