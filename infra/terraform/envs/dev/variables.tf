variable "aws_region" {
  type        = string
  description = "AWS region"
  default     = "ap-southeast-1"
}

variable "vpc_id" {
  type        = string
  description = "Existing VPC ID"
}

variable "backend_subnet_id" {
  type        = string
  description = "Subnet where backend EC2 will run"
}

variable "backend_ami_id" {
  type        = string
  description = "AMI ID for backend EC2"
}

variable "key_name" {
  type        = string
  description = "EC2 key pair name"
}

variable "backend_instance_type" {
  type        = string
  description = "Backend EC2 instance type"
  default     = "t3.micro"
}

variable "create_backend_instance" {
  type        = bool
  description = "Create backend EC2 or only manage security group"
  default     = false
}

variable "backend_sg_name" {
  type        = string
  description = "Name for backend security group"
  default     = "healthcare-backend-sg-tf"
}

variable "backend_sg_description" {
  type        = string
  description = "Description for backend security group"
  default     = "for Backend"
}

variable "backend_instance_name" {
  type        = string
  description = "Tag name for backend instance"
  default     = "NodeJS-Backend-Terraform"
}

variable "backend_ingress_cidrs" {
  type        = list(string)
  description = "CIDR blocks allowed to reach backend port 4000"
  default     = ["10.0.0.0/16"]
}

variable "common_tags" {
  type        = map(string)
  description = "Common tags for all resources"
  default = {
    Project = "uit-healthcare"
    Env     = "dev"
    Managed = "terraform"
  }
}

variable "adopt_existing_sg_safely" {
  type        = bool
  description = "When true, ignore SG rule/description drift during initial import phase"
  default     = true
}

variable "manage_alb_sg" {
  type        = bool
  description = "Whether to manage/import ALB security group"
  default     = false
}

variable "alb_sg_name" {
  type        = string
  description = "ALB security group name"
  default     = "ALB-SG"
}

variable "alb_sg_description" {
  type        = string
  description = "ALB security group description"
  default     = "for Load Balancer"
}

variable "manage_vpn_sg" {
  type        = bool
  description = "Whether to manage/import VPN security group"
  default     = false
}

variable "vpn_sg_name" {
  type        = string
  description = "VPN security group name"
  default     = "VPN-SG"
}

variable "vpn_sg_description" {
  type        = string
  description = "VPN security group description"
  default     = "for VPN"
}
