# Ansible Safe Runbook

This folder is intended for two different purposes:

1. Read-only inspection: safe to run during demo or incident checks.
2. Controlled configuration: changes servers and must be reviewed with `--check --diff` first.

## Safe Read-Only Commands

Run these first. They should not install packages, restart services, or edit remote files.

```bash
cd infra/ansible
python -m pip install -r requirements.txt
ansible-galaxy collection install -r requirements.yml
ansible -i inventory/hosts.yml all -m ping
ansible-playbook -i inventory/hosts.yml playbooks/preflight.yml
ansible-playbook -i inventory/hosts.yml playbooks/audit.yml
```

Useful limited scopes:

```bash
ansible-playbook -i inventory/hosts.yml playbooks/preflight.yml --limit openstack
ansible-playbook -i inventory/hosts.yml playbooks/audit.yml --limit openstack
ansible-playbook -i inventory/hosts.yml playbooks/audit.yml --limit aws
```

Staging template validation:

```bash
ansible-inventory -i inventory/staging.yml --list
ansible-playbook -i inventory/staging.yml playbooks/preflight.yml --syntax-check
```

Run staging only after replacing placeholder IPs and confirming SSH access:

```bash
ansible-playbook -i inventory/staging.yml playbooks/preflight.yml --check --diff
ansible-playbook -i inventory/staging.yml playbooks/audit.yml --check --diff
ansible-playbook -i inventory/staging.yml playbooks/site.yml --check --diff
ansible-playbook -i inventory/staging.yml playbooks/backend_app.yml --check --diff
ansible-playbook -i inventory/staging.yml playbooks/db_backup.yml --check --diff
```

Local report paths on the Ansible controller:

```bash
/tmp/ansible-preflight/INDEX.txt
/tmp/audit-report/INDEX.txt
```

## Staging Secrets

Real staging deploys use AWS Secrets Manager at runtime. The current staging
inventory sets:

```yaml
secret_source: aws_secrets_manager
backend_secret_id: uit-healthcare-staging/backend
```

Terraform creates only the Secrets Manager secret metadata. Secret values are
created or rotated outside Terraform so they do not enter Terraform state.
Ansible reads the secret on the controller during `backend_app.yml` and
`db_backup.yml`, then injects the values into the remote runtime `.env`.

Local secret files are fallback/bootstrap only. They are intentionally ignored
by git:

```bash
cd infra/ansible
mkdir -p secrets
cp secrets/staging.example.yml secrets/staging.yml
```

Required keys, whether stored in AWS Secrets Manager or the local fallback file:

- `backend_jwt_secret`
- `db_password`

Use alphanumeric or hex values to avoid shell/SQL quoting issues. Do not commit
`secrets/staging.yml`.

Validation commands:

```bash
ANSIBLE_CONFIG=ansible.cfg ansible-playbook -i inventory/staging.yml playbooks/backend_app.yml
ANSIBLE_CONFIG=ansible.cfg ansible-playbook -i inventory/staging.yml playbooks/db_backup.yml
```

Expected behavior: `Load ... secrets from AWS Secrets Manager` is `ok`, and
`Load ... secrets from controller` is skipped.

## Controlled Configuration Commands

These commands change remote nodes. Do not run them directly on a live system without a review pass.

```bash
ansible-playbook -i inventory/hosts.yml playbooks/site.yml --check --diff
ansible-playbook -i inventory/hosts.yml playbooks/packages.yml --check --diff
ansible-playbook -i inventory/hosts.yml playbooks/wireguard.yml --check --diff
ansible-playbook -i inventory/hosts.yml playbooks/promtail.yml --check --diff
```

Only remove `--check --diff` after confirming the target hosts and expected changes.

## Staging Database Backup And Restore

Backup is safe to run during staging demos. It reads from the PostgreSQL
container and fetches `.dump` files to the Ansible controller under
`infra/ansible/backups/<env>/`.

```bash
cd infra/ansible
ANSIBLE_CONFIG=ansible.cfg ansible-playbook -i inventory/staging.yml playbooks/db_backup.yml
```

Restore is intentionally guarded. It does not use `DROP`, `--clean`, or
`--if-exists`; existing objects are not deleted automatically. If a schema
change needs a breaking table replacement, create a new table/migration first
and cut over safely.

```bash
ANSIBLE_CONFIG=ansible.cfg ansible-playbook -i inventory/staging.yml playbooks/db_backup.yml \
  -e db_backup_mode=restore \
  -e confirm_restore=true \
  -e restore_file=/absolute/path/to/backup.dump
```

Do not commit files under `infra/ansible/backups/`.

## Current Coverage

Implemented:

- Static inventory for OpenStack and AWS nodes.
- Staging inventory template for a separate AWS staging account.
- Dynamic inventory helper for OpenStack/Terraform fallback.
- Read-only preflight checks.
- Read-only infrastructure audit report.
- Base packages/sysctl/fail2ban playbook for K3s nodes.
- Docker Engine and Compose plugin setup for backend nodes.
- Backend application + local PostgreSQL deployment for AWS staging-zero.
- PostgreSQL backup/restore playbook for AWS staging-zero.
- WireGuard role.
- Promtail role.

Not implemented as full provisioning yet:

- K3s cluster bootstrap from zero.
- Wazuh manager/agent full installation.
- Grafana/Loki/Alertmanager full installation.
- Redis/RabbitMQ installation and restore.
- OCR application deployment through Ansible.
- Disaster recovery automation.

For the current project scope, Terraform covers infrastructure state/adoption, GitHub Actions covers CI/CD, ArgoCD/GitOps covers Kubernetes manifests, and Ansible covers server audit plus selected configuration management.
