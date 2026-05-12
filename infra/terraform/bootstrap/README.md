# Terraform Bootstrap (Remote State)

This stack creates the shared backend used by the main Terraform stack:
- S3 bucket for `terraform.tfstate`
- DynamoDB table for state locking

## Usage
1. `cd infra/terraform/bootstrap`
2. Copy vars:
   - `cp terraform.tfvars.example terraform.tfvars`
3. Set a globally unique `state_bucket_name`
4. Run:
   - `terraform init`
   - `terraform plan`
   - `terraform apply`

## After apply
Use the created names in `infra/terraform/backend.hcl`:
- `bucket`
- `dynamodb_table`

Then in main stack:
- `cd ../`
- `terraform init -backend-config=backend.hcl -reconfigure`

