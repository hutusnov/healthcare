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
- `CI Terraform OpenStack` workflow:
  - validates OpenStack Terraform separately so the split workflow is visible in GitHub Actions.
  - runs Checkov in soft mode unless `TF_SECURITY_STRICT=true`.
- `Terraform Drift Detection` workflow:
  - scheduled/manual drift checks.
  - AWS drift check is gated by `TF_DRIFT_AWS_DEV_ENABLED=true`.
  - OpenStack drift check is gated by `TF_DRIFT_OPENSTACK_DEV_ENABLED=true` and requires OpenStack secrets.
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

Quick runbook steps:
- `.\runbook.ps1 -Step staging-init`
- `.\runbook.ps1 -Step staging-plan`
- `.\runbook.ps1 -Step prod-init`
- `.\runbook.ps1 -Step prod-plan`
- `.\runbook.ps1 -Step check-env-isolation`
- `.\discover-aws-network.ps1 -VpcId vpc-xxxxxxxx -Env staging -Region ap-southeast-1`
- `.\runbook.ps1 -Step phase1-safe-complete`
  - Runs fmt/validate/plan checks without apply.
  - Non-dev plan blocked by `non_dev_safety_lock` is treated as expected safe behavior.
  - Allows shared `staging` IDs temporarily to avoid extra cost, but still enforces `prod` isolation from `dev`.

Safe existing AWS adoption:
- Dry-run import commands first:
  - `.\import-aws-existing.ps1 -Env dev`
- Import existing dev AWS resources into Terraform state:
  - `.\import-aws-existing.ps1 -Env dev -Execute`
- Verify state matches real AWS:
  - `cd envs\dev`
  - `terraform plan -lock=false -input=false`
- Expected successful result:
  - `No changes. Your infrastructure matches the configuration.`
- The import script backs up local Terraform metadata/state before execution and does not create, update, stop, start, or delete AWS resources.
- Non-dev import is blocked unless `-AllowNonDev` is explicitly provided.

## Safe remote state migration (dev)
Before migrating local state to S3 backend, ensure bootstrap backend resources exist.

1. Bootstrap backend:
   - `cd infra/terraform/bootstrap`
   - `terraform init`
   - `terraform plan`
   - `terraform apply`
2. Prepare backend config:
   - Copy `infra/terraform/envs/dev/backend.hcl.example` to `infra/terraform/envs/dev/backend.hcl`
   - Fill real values from bootstrap outputs.
3. Migrate with automatic local backup:
   - `cd infra/terraform`
   - `.\runbook.ps1 -Step dev-migrate-state`
4. Verify no infra drift:
   - `.\runbook.ps1 -Step dev-plan`

Notes:
- `dev-migrate-state` creates `infra/terraform/envs/dev/state-backups/*` before migration.
- Migration only moves Terraform state storage. It does not recreate managed resources.
- Equivalent migration steps are available for `staging` and `prod`:
  - `staging-migrate-state`
  - `prod-migrate-state`

## Safe change policy
- Always apply from feature branch first.
- Run Unified pipeline and ensure `CI Terraform` + security jobs pass.
- Merge to `main` only after successful run.
- Prefer import/adopt strategy for existing resources to avoid accidental recreation.
- Non-dev safety lock:
  - `allow_nondev_plan_with_shared_ids = false` by default.
  - Terraform blocks non-dev plan/apply when env still points to shared IDs.
  - Turn it on only for intentional, reviewed migration steps.
- Env isolation check:
  - Run `.\check-env-isolation.ps1` (or `.\runbook.ps1 -Step check-env-isolation`) before any non-dev apply.
  - It compares key IDs/names across `dev/staging/prod` tfvars and fails if staging/prod still match dev.
- Network discovery helper:
  - Run `.\discover-aws-network.ps1` with target VPC id to print a tfvars-ready network block.
  - Script is read-only (`describe*` APIs), no create/update/delete actions.

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
