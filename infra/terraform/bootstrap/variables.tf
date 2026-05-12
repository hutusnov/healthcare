variable "aws_region" {
  type        = string
  description = "AWS region"
  default     = "ap-southeast-1"
}

variable "project_name" {
  type        = string
  description = "Short project slug used in resource names"
  default     = "uit-healthcare"
}

variable "state_bucket_name" {
  type        = string
  description = "Unique S3 bucket name for Terraform state"
}

variable "lock_table_name" {
  type        = string
  description = "DynamoDB table name for state locking"
  default     = "uit-healthcare-tf-lock"
}

