#!/usr/bin/env bash
# Import existing frontend resources vào Terraform state
# Prerequisites:
#   export CLOUDFLARE_API_TOKEN=<token>
# Chạy từ: infra/terraform/envs/dev

set -euo pipefail

echo "=== Import Frontend Stack ==="
echo "⚠️  Chạy 'terraform plan -target=module.frontend_stack' sau khi import"
echo "⚠️  Kết quả phải là 'No changes' mới được apply"
echo ""

# ── S3 Buckets ──
echo "--- S3 Buckets ---"
terraform import module.frontend_stack.aws_s3_bucket.portal \
  uit-healthcare-portal
terraform import module.frontend_stack.aws_s3_bucket.admin \
  uit-healthcare-admin

# ── S3 Website configs ──
echo "--- S3 Website configs ---"
terraform import module.frontend_stack.aws_s3_bucket_website_configuration.portal \
  uit-healthcare-portal
terraform import module.frontend_stack.aws_s3_bucket_website_configuration.admin \
  uit-healthcare-admin

# ── CloudFront OAC ──
echo "--- CloudFront OAC ---"
# Portal OAC: E3KV71D5P81ZBN (confirmed)
terraform import module.frontend_stack.aws_cloudfront_origin_access_control.portal \
  E3KV71D5P81ZBN
# Admin OAC: EDE68REX3J0QX (confirmed)
terraform import module.frontend_stack.aws_cloudfront_origin_access_control.admin \
  EDE68REX3J0QX

# ── CloudFront Distributions ──
echo "--- CloudFront Distributions ---"
terraform import module.frontend_stack.aws_cloudfront_distribution.portal \
  E1HZJ7I8ZTBC5R
terraform import module.frontend_stack.aws_cloudfront_distribution.admin \
  EW3PPLANVICBT

# ── Cloudflare DNS ──
echo "--- Cloudflare DNS Records ---"
ZONE_ID=$(curl -s -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  "https://api.cloudflare.com/client/v4/zones?name=htsnov.com" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['result'][0]['id'])")

echo "Zone ID: ${ZONE_ID}"

PORTAL_ID=$(curl -s -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?name=healthcare.htsnov.com" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['result'][0]['id'])")

ADMIN_ID=$(curl -s -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?name=admin.htsnov.com" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['result'][0]['id'])")

echo "Portal DNS record: ${PORTAL_ID}"
echo "Admin DNS record:  ${ADMIN_ID}"

terraform import module.frontend_stack.cloudflare_record.portal \
  "${ZONE_ID}/${PORTAL_ID}"
terraform import module.frontend_stack.cloudflare_record.admin \
  "${ZONE_ID}/${ADMIN_ID}"

echo ""
echo "=== Import complete ==="
echo ""
echo "BƯỚC TIẾP THEO — BẮT BUỘC:"
echo "  terraform plan -target=module.frontend_stack"
echo "  → Phải thấy: 'No changes. Your infrastructure matches the configuration.'"
echo "  → Nếu có 'destroy' hoặc 'replace' → DỪNG, không apply, báo lại để fix"