variable "project_name" { type = string }
variable "env" { type = string }
variable "region" { type = string }
variable "external_network_id" { type = string }

variable "master_name" { type = string }
variable "data_node_name" { type = string }
variable "worker_name" { type = string }
variable "image_name" { type = string }
variable "flavor_name" { type = string }
variable "keypair_name" { type = string }

variable "existing_network_id" { type = string }
variable "existing_subnet_id" { type = string }
variable "existing_router_id" { type = string }
variable "existing_secgroup_id" { type = string }
variable "existing_master_id" { type = string }
variable "existing_data_node_id" { type = string }
variable "existing_worker_id" { type = string }

variable "adopt_existing_only" { type = bool }
variable "manage_compute_instances" { type = bool }

variable "ssh_allowed_cidr" {
  type        = string
  description = "CIDR allowed to SSH to newly created OpenStack nodes"
  default     = "172.31.65.128/25"
}
