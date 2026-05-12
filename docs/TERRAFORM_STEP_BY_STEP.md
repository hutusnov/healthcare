# Terraform Step-by-Step for UIT Healthcare

## Goal
Adopt IaC without breaking current runtime (AWS + OpenStack already running).

## Step 0: Backup (done)
- Backup branch: `backup/pre-terraform-2026-05-12`
- Working branch: `feat/terraform-phase1`

## Step 1: Prepare local Terraform safely
1. `cd infra/terraform`
2. Copy vars:
   - `cp terraform.tfvars.example terraform.tfvars`
3. Fill real IDs (VPC/Subnet/AMI/KeyPair)
4. Run:
   - `terraform init`
   - `terraform validate`
   - `terraform plan`

## Step 2: Add remote state before apply
1. Copy `backend.hcl.example` -> `backend.hcl`
2. Fill S3/DynamoDB backend.
3. Re-init:
   - `terraform init -backend-config=backend.hcl -reconfigure`

## Step 3: Start with non-destructive resources
- Keep `create_backend_instance = false`
- Manage security group only first
- Review `plan` with team before `apply`

## Step 4: Migrate existing resources to code
- Import current EC2/SG/VPC pieces:
  - `terraform import ...`
- Run `plan` until output is clean (no unexpected replacement)

## Step 5: Expand scope
- AWS:
  - ALB, target groups, autoscaling, IAM roles
  - S3 + CloudFront frontend delivery
- OpenStack:
  - VM/network/security resources in separate workspace/module

## Done criteria for this phase
- Terraform init/validate/plan succeeds
- Remote state configured
- At least one production-relevant resource managed safely by Terraform
