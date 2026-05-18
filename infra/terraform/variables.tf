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

variable "backend_instance_type" {
  type        = string
  description = "Backend EC2 instance type"
  default     = "t3.micro"
}

variable "backend_ami_id" {
  type        = string
  description = "AMI ID for backend EC2"
}

variable "key_name" {
  type        = string
  description = "EC2 key pair name"
}

variable "create_backend_instance" {
  type        = bool
  description = "Create backend EC2 or only manage security group"
  default     = false
}
