# UIT Healthcare OpenStack Terraform

## Goal
- Manage the OpenStack side of the hybrid infrastructure with Terraform.
- Keep rollout safe for existing running systems by default.

## Safety model
- `adopt_existing_only = true` by default.
- No compute/network resources are created unless you explicitly set:
  - `adopt_existing_only = false`
  - required IDs, names, and image/flavor values.

## Layout
- `envs/dev` (initial OpenStack environment)
- `modules/openstack_cluster` (reusable module)

## First-time usage (safe)
```powershell
cd infra/terraform-openstack/envs/dev
terraform init -backend=false
terraform validate
terraform plan -lock=false
```

If OpenStack auth is not configured yet, use runbook safe mode:
```powershell
cd infra/terraform-openstack
.\runbook.ps1 -Step phase-safe-complete
```
- Runs `init` + `validate`.
- Runs `plan` only when `OS_AUTH_URL` or `OS_CLOUD` is set.
- Avoids false failures in local/CI safe checks.

## Optional adopt/import flow
1. Fill `terraform.tfvars` with your existing OpenStack IDs.
2. Dry-run import commands:
   ```powershell
   .\import-openstack-existing.ps1 -Env dev
   ```
3. Import safe network-layer resources:
   ```powershell
   .\import-openstack-existing.ps1 -Env dev -Execute
   ```
4. Re-run `terraform plan` and confirm no destructive drift.

Current safe import scope:
- private network
- private subnet
- router
- internal security group

Compute instances are still read as adopted inventory first. Importing them will be handled in a later step after boot-from-volume and per-node flavor values are modeled, so Terraform does not accidentally plan VM replacement.

## Compute discovery before VM import
Before importing OpenStack instances as managed Terraform resources, collect the exact live VM shape:

```powershell
.\discover-openstack-compute.ps1 -Env dev
```

This script is read-only. It prints each server's status, flavor, image, key pair, attached volumes, and addresses. Use the output to model boot-from-volume instances safely before any compute import.

If discovery confirms the live VMs are the intended cluster nodes, import compute with the explicit compute flag:

```powershell
.\import-openstack-existing.ps1 -Env dev -Execute -IncludeCompute
```

This backs up local `terraform.tfvars`, enables `manage_compute_instances = true`, imports the three existing VMs, and then runs `terraform plan`. The adopted compute resources use `ignore_changes = all` during the initial migration phase to prevent Terraform from replacing boot-from-volume nodes.

## CI and drift checks
- `CI Terraform OpenStack` validates formatting and Terraform syntax for OpenStack IaC.
- `Terraform Drift Detection` can run scheduled/manual drift checks.
- OpenStack drift plan is disabled by default and must be enabled with `TF_DRIFT_OPENSTACK_DEV_ENABLED=true` plus OpenStack credentials in GitHub Secrets.
- Drift checks do not apply changes; they only run `terraform plan`.

## Notes
- Keep credentials in environment variables or a local `terraform.tfvars` file (ignored by git).
- Do not run `apply` until `plan` is reviewed and expected.
