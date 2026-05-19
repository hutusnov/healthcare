output "portal_cloudfront_domain" {
  value = aws_cloudfront_distribution.portal.domain_name
}

output "admin_cloudfront_domain" {
  value = aws_cloudfront_distribution.admin.domain_name
}

output "portal_s3_bucket" {
  value = aws_s3_bucket.portal.id
}

output "admin_s3_bucket" {
  value = aws_s3_bucket.admin.id
}
