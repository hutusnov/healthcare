# =============================================
# Frontend Stack — Patient Portal + Admin Panel
# S3 + CloudFront (OAC) + Cloudflare DNS
# Adopts existing resources via import
# =============================================

data "aws_caller_identity" "current" {}

# ── S3 Buckets ────────────────────────────────
resource "aws_s3_bucket" "portal" {
  bucket = var.portal_bucket_name
  lifecycle {
    ignore_changes  = all
    prevent_destroy = true
  }
}

resource "aws_s3_bucket" "admin" {
  bucket = var.admin_bucket_name
  lifecycle {
    ignore_changes  = all
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_website_configuration" "portal" {
  bucket = aws_s3_bucket.portal.id
  index_document { suffix = "index.html" }
  error_document { key    = "index.html" }
  lifecycle { ignore_changes = all }
}

resource "aws_s3_bucket_website_configuration" "admin" {
  bucket = aws_s3_bucket.admin.id
  index_document { suffix = "index.html" }
  error_document { key    = "index.html" }
  lifecycle { ignore_changes = all }
}

# ── ACM Certificate (us-east-1) ───────────────
data "aws_acm_certificate" "cloudfront" {
  provider = aws.us_east_1
  domain   = var.root_domain
  statuses = ["ISSUED"]
}

# ── CloudFront Origin Access Control (OAC) ────
# Portal dùng OAC E3KV71D5P81ZBN — adopt existing
resource "aws_cloudfront_origin_access_control" "portal" {
  name                              = "portal-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
  lifecycle {
    ignore_changes  = all
    prevent_destroy = true
  }
}

# Admin — check OAC sau khi có output lệnh check admin distribution
resource "aws_cloudfront_origin_access_control" "admin" {
  name                              = "admin-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
  lifecycle {
    ignore_changes  = all
    prevent_destroy = true
  }
}

# ── CloudFront — Patient Portal ───────────────
resource "aws_cloudfront_distribution" "portal" {
  enabled             = true
  aliases             = [var.portal_domain]
  default_root_object = "index.html"
  price_class         = "PriceClass_200"

  # S3 origin — dùng OAC thay vì OAI
  origin {
    domain_name              = aws_s3_bucket.portal.bucket_regional_domain_name
    origin_id                = aws_s3_bucket.portal.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.portal.id
    # KHÔNG dùng s3_origin_config khi đã có OAC
  }

  # API origin — không cần OAC (custom origin)
  origin {
    domain_name = var.api_domain
    origin_id   = var.api_domain
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id       = aws_s3_bucket.portal.bucket_regional_domain_name
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
  }

  ordered_cache_behavior {
    path_pattern           = "/api/*"
    target_origin_id       = var.api_domain
    viewer_protocol_policy = "https-only"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Content-Type"]
      cookies { forward = "all" }
    }
    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  viewer_certificate {
    acm_certificate_arn      = data.aws_acm_certificate.cloudfront.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  tags = merge(var.common_tags, { Name = "portal-cloudfront" })

  lifecycle {
    ignore_changes  = all
    prevent_destroy = true
  }
}

# ── CloudFront — Admin Panel ──────────────────
resource "aws_cloudfront_distribution" "admin" {
  enabled             = true
  aliases             = [var.admin_domain]
  default_root_object = "index.html"
  price_class         = "PriceClass_200"

  origin {
    domain_name              = aws_s3_bucket.admin.bucket_regional_domain_name
    origin_id                = aws_s3_bucket.admin.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.admin.id
  }

  origin {
    domain_name = var.api_domain
    origin_id   = var.api_domain
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id       = aws_s3_bucket.admin.bucket_regional_domain_name
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
  }

  ordered_cache_behavior {
    path_pattern           = "/api/*"
    target_origin_id       = var.api_domain
    viewer_protocol_policy = "https-only"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Content-Type"]
      cookies { forward = "all" }
    }
    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  viewer_certificate {
    acm_certificate_arn      = data.aws_acm_certificate.cloudfront.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  tags = merge(var.common_tags, { Name = "admin-cloudfront" })

  lifecycle {
    ignore_changes  = all
    prevent_destroy = true
  }
}

# ── Cloudflare DNS Records ────────────────────
data "cloudflare_zone" "main" {
  name = var.root_domain
}

resource "cloudflare_record" "portal" {
  zone_id = data.cloudflare_zone.main.id
  name    = "healthcare"
  type    = "CNAME"
  content = aws_cloudfront_distribution.portal.domain_name
  proxied = false
  ttl     = 1
  lifecycle { ignore_changes = all }
}

resource "cloudflare_record" "admin" {
  zone_id = data.cloudflare_zone.main.id
  name    = "admin"
  type    = "CNAME"
  content = aws_cloudfront_distribution.admin.domain_name
  proxied = false
  ttl     = 1
  lifecycle { ignore_changes = all }
}
