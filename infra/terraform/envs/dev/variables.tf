variable "aws_region" {
  type        = string
  description = "AWS region"
  default     = "ap-southeast-1"
}

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
  description = "NAT EIP allocation ID"
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

variable "alb_name" {
  type        = string
  description = "Application Load Balancer name"
}

variable "target_group_name" {
  type        = string
  description = "Target group name"
}

variable "target_group_port" {
  type        = number
  description = "Target group port"
  default     = 4000
}

variable "target_group_protocol" {
  type        = string
  description = "Target group protocol"
  default     = "HTTP"
}

variable "health_check_path" {
  type        = string
  description = "Target group health check path"
  default     = "/api/health"
}

variable "http_listener_port" {
  type        = number
  description = "HTTP listener port"
  default     = 80
}

variable "https_listener_port" {
  type        = number
  description = "HTTPS listener port"
  default     = 443
}

variable "https_certificate_arn" {
  type        = string
  description = "ACM cert ARN for HTTPS listener"
}

variable "https_ssl_policy" {
  type        = string
  description = "SSL policy for HTTPS listener"
}

variable "https_fixed_response_body" {
  type        = string
  description = "HTTPS fixed response body"
}

variable "target_instance_ids" {
  type        = list(string)
  description = "Instance IDs attached to target group"
  default     = []
}

variable "alarm_prefix" {
  type        = string
  description = "Prefix for CloudWatch alarm names"
  default     = "uit-healthcare-dev"
}

variable "alarm_sns_topic_arn" {
  type        = string
  description = "SNS topic ARN for CloudWatch alarms (optional)"
  default     = ""
}

variable "github_owner" {
  type        = string
  description = "GitHub owner/org"
  default     = "hutusnov"
}

variable "github_repo" {
  type        = string
  description = "GitHub repository name"
  default     = "healthcare"
}

variable "github_actions_role_name" {
  type        = string
  description = "IAM role name for GitHub Actions deploy"
  default     = "GitHubActionsHealthcareDeployRole"
}
