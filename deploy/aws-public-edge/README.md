# AWS Public Edge Plan

This directory captures the remaining public-edge pieces from the target architecture that are not yet provisioned in the current runtime:

- `Route 53`
- `CloudFront`
- `WAF`

These pieces are intentionally kept as ready-to-apply templates because they add cost and usually require domain ownership and DNS control.

## Current runtime

Today the system uses:

- AWS ALB DNS directly
- no custom domain
- no CloudFront
- no WAF

## Target runtime

The intended direction is:

```text
Route 53
-> CloudFront
-> WAF
-> ALB
-> AWS backend EC2
```

## Files

- `cloudfront-distribution.example.json`: starter CloudFront distribution shape
- `waf-web-acl.example.json`: starter WAF managed rule layout
- `route53-records.example.md`: what records are typically needed

## When to apply

Apply these only after:

1. custom domain ownership is ready
2. extra AWS cost is acceptable
3. the team wants the production-style public edge
