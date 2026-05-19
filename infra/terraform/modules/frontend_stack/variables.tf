variable "root_domain" {
  type        = string
  description = "Root domain (e.g. htsnov.com)"
  default     = "htsnov.com"
}

variable "portal_domain" {
  type        = string
  description = "Patient portal domain"
  default     = "healthcare.htsnov.com"
}

variable "admin_domain" {
  type        = string
  description = "Admin panel domain"
  default     = "admin.htsnov.com"
}

variable "api_domain" {
  type        = string
  description = "Backend API domain"
  default     = "api.htsnov.com"
}

variable "portal_bucket_name" {
  type        = string
  description = "S3 bucket for patient portal"
  default     = "uit-healthcare-portal"
}

variable "admin_bucket_name" {
  type        = string
  description = "S3 bucket for admin panel"
  default     = "uit-healthcare-admin"
}

variable "route53_zone_id" {
  type        = string
  description = "Route53 hosted zone ID"
  default     = "Z07318311M9HQNABJ9Y2Q"
}

variable "common_tags" {
  type        = map(string)
  description = "Common tags"
  default = {
    Project = "uit-healthcare"
    Managed = "terraform"
  }
}

variable "cloudflare_zone_id" {
  type        = string
  description = "Cloudflare Zone ID cho htsnov.com (lấy từ Cloudflare dashboard)"
  default     = "" # Điền vào sau khi có API token
}
