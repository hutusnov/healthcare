# Terraform Infrastructure (AWS)

This folder provides a baseline IaC structure for the UIT Healthcare hybrid-cloud deployment.

## What is included
- VPC lookup (existing VPC mode)
- Security Group for backend EC2
- Optional backend EC2 instance provisioning

## Quick start
1. Install Terraform `>= 1.6`.
2. Create `terraform.tfvars` from `terraform.tfvars.example`.
3. Run:
   - `terraform init`
   - `terraform plan`
   - `terraform apply`

## Notes
- Current configuration is safe-by-default and does not force replace existing resources.
- For production migration, import existing resources first (`terraform import`) before managing them.
