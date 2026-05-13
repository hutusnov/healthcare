variable "alb_arn" {
  type        = string
  description = "ALB ARN"
}

variable "target_group_arn" {
  type        = string
  description = "Target group ARN"
}

variable "backend_instance_ids" {
  type        = list(string)
  description = "Backend EC2 instance IDs"
  default     = []
}

variable "alarm_prefix" {
  type        = string
  description = "Prefix for alarm names"
  default     = "uit-healthcare"
}

variable "sns_topic_arn" {
  type        = string
  description = "SNS topic ARN for alarm notifications (optional)"
  default     = ""
}
