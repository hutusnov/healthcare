variable "vpc_id" {
  type        = string
  description = "Existing VPC ID"
}

variable "public_subnet_1_id" {
  type        = string
  description = "Public subnet 1 ID"
}

variable "public_subnet_1_cidr" {
  type        = string
  description = "Public subnet 1 CIDR block"
}

variable "public_subnet_1_az" {
  type        = string
  description = "Public subnet 1 availability zone"
}

variable "public_subnet_2_id" {
  type        = string
  description = "Public subnet 2 ID"
}

variable "public_subnet_2_cidr" {
  type        = string
  description = "Public subnet 2 CIDR block"
}

variable "public_subnet_2_az" {
  type        = string
  description = "Public subnet 2 availability zone"
}

variable "private_subnet_1_id" {
  type        = string
  description = "Private subnet 1 ID"
}

variable "private_subnet_1_cidr" {
  type        = string
  description = "Private subnet 1 CIDR block"
}

variable "private_subnet_1_az" {
  type        = string
  description = "Private subnet 1 availability zone"
}

variable "private_subnet_2_id" {
  type        = string
  description = "Private subnet 2 ID"
}

variable "private_subnet_2_cidr" {
  type        = string
  description = "Private subnet 2 CIDR block"
}

variable "private_subnet_2_az" {
  type        = string
  description = "Private subnet 2 availability zone"
}

variable "igw_id" {
  type        = string
  description = "Internet Gateway ID"
}

variable "nat_gateway_id" {
  type        = string
  description = "NAT Gateway ID"
}

variable "nat_eip_allocation_id" {
  type        = string
  description = "NAT Elastic IP allocation ID"
}

variable "public_route_table_id" {
  type        = string
  description = "Public route table ID"
}

variable "private_route_table_1_id" {
  type        = string
  description = "Private route table 1 ID"
}

variable "private_route_table_2_id" {
  type        = string
  description = "Private route table 2 ID"
}

variable "public_rtb_assoc_1_id" {
  type        = string
  description = "Public subnet 1 route table association ID"
}

variable "public_rtb_assoc_2_id" {
  type        = string
  description = "Public subnet 2 route table association ID"
}

variable "private_rtb_assoc_1_id" {
  type        = string
  description = "Private subnet 1 route table association ID"
}

variable "private_rtb_assoc_2_id" {
  type        = string
  description = "Private subnet 2 route table association ID"
}

variable "common_tags" {
  type        = map(string)
  description = "Common tags for all resources"
  default     = {}
}
