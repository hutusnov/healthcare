# Staging Environment Plan

## Target

Use the new AWS account as `staging` in `ap-southeast-2`. Do not modify current dev/prod secrets or current running infrastructure.

## DevSecOps Flow

| Stage | Tool | Current target |
|---|---|---|
| Pre-commit / Push | Gitleaks | Block accidental secret commits |
| CI Build & Test | GitHub Actions, SonarQube | Build, test, code quality gate |
| CI Container & IaC | Trivy, Terraform validate/plan | Scan Docker images and Terraform files |
| CD Staging | Argo CD / GitOps | Deploy Kubernetes manifests after staging is reachable |
| Post-Deploy Runtime | OWASP ZAP | Not implemented yet |
| Production / Monitor | Wazuh, Prometheus, Loki, Telegram | Runtime audit, alerting, metrics, logs |

## Runtime Secret Management

Staging backend secrets are no longer hardcoded in the repository.

- Terraform creates the AWS Secrets Manager secret metadata only:
  `uit-healthcare-staging/backend`.
- Secret values are written/rotated outside Terraform so they do not enter
  Terraform state.
- Ansible reads `backend_jwt_secret` and `db_password` from AWS Secrets Manager
  at deploy/backup time and injects them into the remote runtime `.env`.
- `infra/ansible/secrets/staging.yml` is ignored and kept only as a local
  fallback/bootstrap mechanism.

This is not Vault or Kubernetes External Secrets yet, but it is a real managed
secret store path for the AWS staging reproduce flow.

## GitHub Environment

Create a GitHub Environment named `staging`. Put staging-only secrets there. Do not overwrite existing repository secrets unless intentionally rotating them.

### Environment Variables

Use variables for non-secret values:

```text
AWS_REGION_STAGING=ap-southeast-2
TF_ENV=staging
STAGING_API_BASE_URL=https://REPLACE_STAGING_DOMAIN
STAGING_ARGO_APP=healthcare-staging
```

### Environment Secrets

Use secrets for credentials/tokens:

```text
AWS_GHA_STAGING_ROLE_ARN=arn:aws:iam::REPLACE_ACCOUNT_ID:role/GitHubActionsHealthcareStagingDeployRole
ARGOCD_SERVER_STAGING=REPLACE_ARGOCD_SERVER
ARGOCD_AUTH_TOKEN_STAGING=REPLACE_ARGOCD_TOKEN
CLOUDFLARE_API_TOKEN_STAGING=REPLACE_TOKEN_IF_USED
ZAP_STAGING_TARGET_URL=https://REPLACE_STAGING_DOMAIN
TELEGRAM_TOKEN=REPLACE_TOKEN_OR_USE_EXISTING_IF_SHARED
TELEGRAM_TO=REPLACE_CHAT_ID_OR_USE_EXISTING_IF_SHARED
```

SonarCloud usually stays repository-wide:

```text
SONAR_HOST_URL=https://sonarcloud.io
SONAR_TOKEN=REPLACE_VALID_SONARCLOUD_TOKEN
```

Prefer AWS OIDC role assumption over static AWS access keys.

## AWS Prerequisites

Before Terraform can plan cleanly for staging, create or decide the following staging-only values:

- Remote state S3 bucket and DynamoDB lock table.
- VPC, public subnets, private subnets, route tables, NAT/IGW IDs.
- Ubuntu AMI ID in `ap-southeast-2`.
- EC2 key pair name for break-glass SSH.
- ACM certificate ARN in `ap-southeast-2`.
- Optional domain/DNS target for staging.

## Safe Rollout

1. Fill `infra/terraform/envs/staging/backend.hcl` from the example.
2. Fill `infra/terraform/envs/staging/terraform.tfvars` from the example.
3. Run Terraform validate and plan only.
4. Review plan output for any dev/prod account IDs.
5. Apply only after the plan is clean.
6. Run Ansible preflight against `infra/ansible/inventory/staging.yml`.
7. Enable Argo CD staging deployment after network access and cluster credentials are confirmed.

## Current Boundary

Terraform and Ansible are currently at management/reproduction level. They are enough for audited, repeatable management of known infrastructure. Full from-zero bootstrap still requires the AWS baseline IDs and a final decision on whether staging runs EC2-only, K3s-only, or hybrid.

## From-Zero AWS Staging Path

Use `infra/terraform/envs/staging-zero` for the new AWS account. This path creates the baseline itself instead of importing existing IDs:

- VPC
- Public subnets
- Internet gateway
- Route table
- Backend EC2 nodes
- Backend security group
- EC2 SSM IAM role
- Optional ALB and target group
- AWS Secrets Manager secret metadata for backend runtime secrets

After Terraform apply, copy the output `backend_public_ips` into `infra/ansible/inventory/staging.yml`, then run Ansible preflight and site playbook.

This is the correct path for reproducing the AWS side from zero.

## Verified Staging-Zero Baseline

The current AWS staging-zero baseline was applied in the separate staging
account (`ap-southeast-2`) and verified with Terraform, Ansible, SSM, and ALB
health checks.

Verified components:

- Terraform creates and manages VPC, public subnets, IGW, route table, EC2 x2,
  ALB, target group, SSM IAM role/profile, security groups, and Secrets Manager
  metadata.
- Terraform plan is clean after apply (`No changes`).
- Ansible deploys backend API and PostgreSQL on both backend nodes.
- Ansible deploys Redis, RabbitMQ, Prometheus, Grafana, Loki, and Alertmanager
  on the staging service node.
- Ansible schedules PostgreSQL backups and validates backup creation.
- Runtime secrets are read from AWS Secrets Manager and are not stored in
  Terraform state or committed files.

Sizing note: use at least `t3.small` for full reproduce. `t3.micro` is not
enough for backend + database + data services + monitoring on one node.
