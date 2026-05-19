terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

# Provider riêng cho us-east-1 (ACM CloudFront bắt buộc)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# Cloudflare provider should be passed from caller or configured via required_providers
