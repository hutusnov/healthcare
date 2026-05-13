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

Quick helper steps:
- `.\check-env-isolation.ps1`
- `.\discover-aws-network.ps1 -VpcId vpc-xxxxxxxx -Env staging -Region ap-southeast-1`
- `.\runbook.ps1 -Step phase1-safe-complete`
  - Runs fmt/validate/plan checks without apply.
  - Non-dev plan blocked by `non_dev_safety_lock` is treated as expected safe behavior.

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
   - `cd infra/terraform/envs/dev`
   - backup local state files, then run:
   - `terraform init -backend-config=backend.hcl -reconfigure -migrate-state`
4. Verify no infra drift:
   - `terraform plan`

Notes:
- Create local backup copy before migrate (for example `terraform.tfstate.bak` and `.terraform/terraform.tfstate.bak`).
- Migration only moves Terraform state storage. It does not recreate managed resources.
- Equivalent migration steps are available for `staging` and `prod`:
  - run the same `terraform init ... -migrate-state` in each env directory.

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
  - Run `.\check-env-isolation.ps1` before any non-dev apply.
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
