variable "aws_region" {
  type        = string
  description = "AWS region for the clean staging environment"
  default     = "ap-southeast-2"
}

variable "project_name" {
  type        = string
  description = "Project name used in resource names"
  default     = "uit-healthcare"
}

variable "environment" {
  type        = string
  description = "Environment name"
  default     = "staging"
}

variable "vpc_cidr" {
  type        = string
  description = "VPC CIDR"
  default     = "10.30.0.0/16"
}

variable "public_subnet_cidrs" {
  type        = list(string)
  description = "Public subnet CIDRs"
  default     = ["10.30.0.0/24", "10.30.1.0/24"]
}

variable "admin_ssh_cidr" {
  type        = string
  description = "CIDR allowed to SSH into staging nodes. Use your current public IP /32."
}

variable "create_key_pair" {
  type        = bool
  description = "Create an EC2 key pair from ssh_public_key"
  default     = false
}

variable "key_name" {
  type        = string
  description = "Existing or created EC2 key pair name"
  default     = "healthcare-staging-key"
}

variable "ssh_public_key" {
  type        = string
  description = "Public SSH key material used only when create_key_pair=true"
  default     = ""
  sensitive   = true
}

variable "backend_instance_type" {
  type        = string
  description = "Backend EC2 instance type"
  default     = "t3.micro"
}

variable "backend_count" {
  type        = number
  description = "Number of backend nodes"
  default     = 2
}

variable "create_alb" {
  type        = bool
  description = "Create an Application Load Balancer for staging backend"
  default     = true
}

variable "enable_https_listener" {
  type        = bool
  description = "Create HTTPS listener. Requires acm_certificate_arn."
  default     = false
}

variable "acm_certificate_arn" {
  type        = string
  description = "ACM certificate ARN for HTTPS listener"
  default     = ""
}

variable "secret_recovery_window_in_days" {
  type        = number
  description = "Secrets Manager recovery window. Use 0 for disposable staging."
  default     = 0
}

variable "common_tags" {
  type        = map(string)
  description = "Additional tags"
  default     = {}
}
