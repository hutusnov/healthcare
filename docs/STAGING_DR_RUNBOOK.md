# Staging Disaster Recovery Runbook

This runbook is for the disposable AWS staging-zero environment. It is not a
production DR guarantee.

## Scope

Covered:

- Recreate AWS staging infrastructure with Terraform.
- Reconfigure fresh backend nodes with Ansible.
- Redeploy backend and local PostgreSQL.
- Backup and restore PostgreSQL dumps.
- Reuse backend runtime secrets from AWS Secrets Manager.

Not covered yet:

- OpenStack K3s full rebuild.
- Wazuh/Grafana/Loki full rebuild.
- Cross-region production failover.
- Fully automated secret rotation.

## Rebuild From Zero

```powershell
cd C:\Users\Admin\Desktop\healthcare\infra\terraform\envs\staging-zero
$env:AWS_PROFILE='healthcare-staging'
terraform init
terraform plan -out staging-zero.tfplan
terraform apply staging-zero.tfplan
terraform output
```

Update `infra/ansible/inventory/staging.yml` if public IPs changed, then:

```bash
cd infra/ansible
ANSIBLE_CONFIG=ansible.cfg ansible-playbook -i inventory/staging.yml playbooks/preflight.yml
ANSIBLE_CONFIG=ansible.cfg ansible-playbook -i inventory/staging.yml playbooks/site.yml
ANSIBLE_CONFIG=ansible.cfg ansible-playbook -i inventory/staging.yml playbooks/backend_app.yml
```

The staging inventory uses `secret_source: aws_secrets_manager`.
`backend_app.yml` loads `backend_jwt_secret` and `db_password` from
`uit-healthcare-staging/backend` and injects them at runtime. Local
`infra/ansible/secrets/staging.yml` is only a git-ignored fallback/bootstrap
file.

## Backup

```bash
ANSIBLE_CONFIG=ansible.cfg ansible-playbook -i inventory/staging.yml playbooks/db_backup.yml
```

Backups are fetched to:

```text
infra/ansible/backups/staging/
```

## Restore

The restore command intentionally does not drop old tables. Destructive schema
changes must be handled with an explicit migration strategy: create a new table,
copy/validate data, switch the application, then archive/remove the old table in
a separately reviewed change.

```bash
ANSIBLE_CONFIG=ansible.cfg ansible-playbook -i inventory/staging.yml playbooks/db_backup.yml \
  -e db_backup_mode=restore \
  -e confirm_restore=true \
  -e restore_file=/absolute/path/to/backup.dump
```

## Validation

```powershell
curl.exe -s http://uit-healthcare-staging-alb-1465788081.ap-southeast-2.elb.amazonaws.com/api/health
$env:AWS_PROFILE='healthcare-staging'
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:ap-southeast-2:009144422462:targetgroup/uit-healthcare-staging-tg/a0d4a0e96640454e
```

## Cleanup

```powershell
cd C:\Users\Admin\Desktop\healthcare\infra\terraform\envs\staging-zero
$env:AWS_PROFILE='healthcare-staging'
terraform destroy
```
