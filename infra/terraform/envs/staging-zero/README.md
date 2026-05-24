# Staging Zero AWS Bootstrap

This environment creates a clean AWS staging baseline from zero:

- VPC
- Public subnets in two AZs
- Internet gateway and public route table
- Backend security group
- Optional ALB and target group
- Two Ubuntu backend EC2 instances
- EC2 IAM role for SSM
- AWS Secrets Manager secret metadata for backend runtime secrets

It is intentionally separate from `envs/staging`, which is still adoption-oriented.

## Cost Control

Default resources are small, but they still cost money:

- `t3.micro` EC2 instances
- ALB if `create_alb = true`
- EBS root volumes

No NAT Gateway is created because NAT Gateway is a common accidental cost source. Backend nodes are public-IP instances with restrictive security groups so they can bootstrap and be managed by Ansible.

## Run

Use credentials for the new AWS account, not the old account.

```powershell
aws sts get-caller-identity
aws configure get region
cd infra/terraform/envs/staging-zero
copy terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars: admin_ssh_cidr and ssh_public_key are required
terraform init
terraform validate
terraform plan -out staging-zero.tfplan
terraform apply staging-zero.tfplan
```

After apply, copy `backend_public_ips` into `infra/ansible/inventory/staging.yml`, then run:

```bash
cd infra/ansible
ansible-playbook -i inventory/staging.yml playbooks/preflight.yml
ansible-playbook -i inventory/staging.yml playbooks/site.yml --check --diff
ansible-playbook -i inventory/staging.yml playbooks/site.yml
```

The Terraform configuration creates the secret container
`uit-healthcare-staging/backend`, but it does not manage secret values. Put
`backend_jwt_secret` and `db_password` into AWS Secrets Manager outside
Terraform, then let Ansible read them during `backend_app.yml` and
`db_backup.yml`. This avoids writing runtime secrets into Terraform state.

## Safety

Do not run this with the old AWS account credentials. Verify first:

```powershell
aws sts get-caller-identity
aws configure get region
```

Expected account before apply: the new AWS account, not `105299590903`.

## Minimal Windows Setup

Create a dedicated profile for the new account instead of overwriting the old one:

```powershell
aws configure --profile healthcare-staging
# AWS Access Key ID: from the new account only
# AWS Secret Access Key: from the new account only
# Default region name: ap-southeast-2
# Default output format: json

$env:AWS_PROFILE="healthcare-staging"
aws sts get-caller-identity
aws configure get region
```

Only continue when `aws sts get-caller-identity` shows the new account ID.

## Required tfvars Values

Get your public SSH key:

```powershell
type $env:USERPROFILE\.ssh\id_ed25519.pub
```

Get your current public IP:

```powershell
(Invoke-RestMethod https://checkip.amazonaws.com).Trim()
```

Then set:

```hcl
admin_ssh_cidr = "YOUR_PUBLIC_IP/32"
ssh_public_key = "ssh-ed25519 AAAA..."
```
