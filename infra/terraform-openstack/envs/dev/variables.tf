variable "project_name" {
  type    = string
  default = "uit-healthcare"
}

variable "env" {
  type    = string
  default = "dev"
}

variable "region" {
  type    = string
  default = "RegionOne"
}

variable "external_network_id" {
  type    = string
  default = ""
}

variable "master_name" {
  type    = string
  default = "k3s-master-vpn"
}

variable "data_node_name" {
  type    = string
  default = "data-core-node"
}

variable "worker_name" {
  type    = string
  default = "ai-ocr-worker"
}

variable "image_name" {
  type    = string
  default = ""
}

variable "flavor_name" {
  type    = string
  default = ""
}

variable "keypair_name" {
  type    = string
  default = ""
}

variable "existing_network_id" {
  type    = string
  default = ""
}

variable "existing_subnet_id" {
  type    = string
  default = ""
}

variable "existing_router_id" {
  type    = string
  default = ""
}

variable "existing_secgroup_id" {
  type    = string
  default = ""
}

variable "existing_master_id" {
  type    = string
  default = ""
}

variable "existing_data_node_id" {
  type    = string
  default = ""
}

variable "existing_worker_id" {
  type    = string
  default = ""
}

variable "adopt_existing_only" {
  type    = bool
  default = true
}

variable "manage_compute_instances" {
  type    = bool
  default = false
}
