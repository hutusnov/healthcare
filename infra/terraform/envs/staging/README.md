# AWS Staging Environment

This environment is for the separate AWS staging account in `ap-southeast-2`.

## Dev vs Staging

- `dev`: fast iteration, unstable changes, can be recreated when needed.
- `staging`: pre-production validation, separate secrets/state/account, closer to production behavior, used before promotion.

For this project, use the new AWS account as `staging`. Keep the existing running AWS/OpenStack environment untouched.

## Safety Rules

- Do not commit `terraform.tfvars`, `backend.hcl`, state files, or private keys.
- Do not reuse dev/prod resource IDs in staging.
- Keep `allow_nondev_plan_with_shared_ids = false` until all IDs are confirmed as staging-only.
- Run `terraform plan` first. Apply only after reviewing that it does not touch old account resources.

## Bootstrap Order

1. Create the remote state bucket and lock table in the staging account.
2. Copy `backend.hcl.example` to `backend.hcl` and replace placeholders.
3. Copy `terraform.tfvars.example` to `terraform.tfvars` and replace staging-only IDs.
4. Run:

```bash
terraform init -backend-config=backend.hcl
terraform validate
terraform plan -lock=false
```

5. Review the plan before any apply.

## Current Limitation

The AWS Terraform code is adoption/reproduction-oriented. It expects baseline AWS IDs such as VPC, subnets, route tables, AMI, key pair, and ACM certificate. It can manage the project resources after those inputs exist, but it is not yet a one-command account-from-zero bootstrap.
