# Terraform Infrastructure (AWS first, then Hybrid)

This folder is the Infrastructure-as-Code starting point for UIT Healthcare.
We keep the current runtime architecture (AWS + OpenStack) and use Terraform to
manage AWS resources first in a controlled way.

## Current scope (safe first step)
- Lookup existing AWS VPC (`vpc_id`)
- Create/manage backend Security Group
- Optional backend EC2 creation (`create_backend_instance = true/false`)

## Why this is useful for this project
- AWS/OpenStack is the runtime platform.
- Terraform is the **management method** (versioned, reviewable, repeatable).
- This lets us move from manual console changes to code-managed infra.

## Quick start (non-destructive)
1. Install Terraform `>= 1.6`.
2. Copy `terraform.tfvars.example` -> `terraform.tfvars`.
3. Fill real values for your AWS environment.
4. Run:
   - `terraform init`
   - `terraform validate`
   - `terraform plan`

## Remote state (recommended)
Use remote state before real apply:
1. Copy `backend.hcl.example` -> `backend.hcl`
2. Fill real S3 bucket / DynamoDB table.
3. Re-init with backend:
   - `terraform init -backend-config=backend.hcl -reconfigure`

## Apply strategy for this repo
- Phase 1: Manage SG first (`create_backend_instance = false`).
- Phase 2: Import existing EC2/network resources.
- Phase 3: Extend to full AWS modules (subnet/route/ALB/ASG).
- Phase 4: Add OpenStack Terraform workspace/modules.

## Notes
- Do not commit `terraform.tfvars` or state files.
- For existing production resources, use `terraform import` before changes.
