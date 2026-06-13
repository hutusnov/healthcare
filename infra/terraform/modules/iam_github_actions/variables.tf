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

variable "allowed_workflow_refs" {
  type        = list(string)
  description = "Allowed GitHub workflow refs that can assume the role (job_workflow_ref claim)"
  default     = []
}

variable "backend_instance_ids" {
  type        = list(string)
  description = "Allowed backend EC2 instance IDs for SSM deploy"
  default     = []
}

variable "extra_ssm_instance_ids" {
  type        = list(string)
  description = "Additional EC2 instance IDs allowed for SSM deploy workflows, such as monitoring or VPN nodes"
  default     = []
}
