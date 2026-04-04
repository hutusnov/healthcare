# Route 53 Records Example

When the team is ready to add a custom domain, the usual DNS shape is:

## Example

- `api.example.com` -> Alias `A` record to the CloudFront distribution or directly to the ALB

## Typical order

1. Obtain or import ACM certificate
2. Create CloudFront distribution if used
3. Create WAF Web ACL and attach it
4. Create Route 53 hosted zone or update the existing DNS provider
5. Point the record at CloudFront or ALB
