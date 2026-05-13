variable "github_owner" {
  type        = string
  description = "GitHub org/user owner"
}

variable "github_repo" {
  type        = string
  description = "GitHub repository name"
}

variable "role_name" {
  type        = string
  description = "IAM role name for GitHub Actions deploy"
  default     = "GitHubActionsHealthcareDeployRole"
}

variable "aws_region" {
  type        = string
  description = "AWS region used by deploy workflows"
}

variable "backend_instance_ids" {
  type        = list(string)
  description = "Allowed backend EC2 instance IDs for SSM deploy"
  default     = []
}
