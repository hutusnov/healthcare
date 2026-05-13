# UIT Healthcare Terraform Runbook

## Scope
- AWS Infrastructure-as-Code for UIT Healthcare.
- Current modules in use:
  - `modules/network_stack`
  - `modules/backend_stack`
  - `modules/alb_stack`
  - `modules/observability_stack`
  - `modules/iam_github_actions`
- Environment:
  - `envs/dev`
  - `envs/staging`
  - `envs/prod`

## What is managed now
- VPC networking objects (adopted/imported safely).
- Backend, ALB, target group, listeners.
- CloudWatch alarms for backend and ALB.
- GitHub OIDC deploy role for AWS SSM-based CD backend.

## CI/CD guardrails
- `CI Terraform` workflow:
  - `terraform fmt -check`
  - `terraform validate` for `envs/dev`
  - optional PR `terraform plan` (only when enabled and `terraform.tfvars` exists)
- `CD Backend AWS EC2`:
  - OIDC-only authentication (no static AWS key fallback).

## Local operations
From repo root:

```powershell
cd infra/terraform/envs/dev
terraform init -backend-config=backend.hcl -reconfigure
terraform validate
terraform plan
terraform apply
```

For `staging` or `prod`, run the same commands in:
- `infra/terraform/envs/staging`
- `infra/terraform/envs/prod`

## Safe change policy
- Always apply from feature branch first.
- Run Unified pipeline and ensure `CI Terraform` + security jobs pass.
- Merge to `main` only after successful run.
- Prefer import/adopt strategy for existing resources to avoid accidental recreation.

## Rollback
- Infra rollback:
  - Revert commit in Git.
  - Re-run `terraform plan` and `terraform apply` from `envs/dev`.
- Deployment rollback:
  - Re-run `CD Backend AWS EC2` with previous image tag commit.

## Secrets and state
- Never commit:
  - `terraform.tfvars`
  - `.tfstate*`
  - provider credentials
- Use remote state backend and locking for team operations.
