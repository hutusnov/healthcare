variable "vpc_id" {
  type        = string
  description = "VPC ID"
}

variable "public_subnet_ids" {
  type        = list(string)
  description = "Public subnet IDs for ALB"
}

variable "alb_security_group_id" {
  type        = string
  description = "Security group ID attached to ALB"
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
  description = "Health check path"
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
  description = "ACM certificate ARN for HTTPS listener"
}

variable "https_ssl_policy" {
  type        = string
  description = "SSL policy for HTTPS listener"
}

variable "https_fixed_response_body" {
  type        = string
  description = "Fixed response body for HTTPS listener"
}

variable "target_instance_ids" {
  type        = list(string)
  description = "Instance IDs registered to target group"
  default     = []
}

variable "common_tags" {
  type        = map(string)
  description = "Common tags"
  default     = {}
}
