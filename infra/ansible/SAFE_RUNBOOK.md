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

Local report paths on the Ansible controller:

```bash
/tmp/ansible-preflight/INDEX.txt
/tmp/audit-report/INDEX.txt
```

## Controlled Configuration Commands

These commands change remote nodes. Do not run them directly on a live system without a review pass.

```bash
ansible-playbook -i inventory/hosts.yml playbooks/site.yml --check --diff
ansible-playbook -i inventory/hosts.yml playbooks/packages.yml --check --diff
ansible-playbook -i inventory/hosts.yml playbooks/wireguard.yml --check --diff
ansible-playbook -i inventory/hosts.yml playbooks/promtail.yml --check --diff
```

Only remove `--check --diff` after confirming the target hosts and expected changes.

## Current Coverage

Implemented:

- Static inventory for OpenStack and AWS nodes.
- Dynamic inventory helper for OpenStack/Terraform fallback.
- Read-only preflight checks.
- Read-only infrastructure audit report.
- Base packages/sysctl/fail2ban playbook for K3s nodes.
- WireGuard role.
- Promtail role.

Not implemented as full provisioning yet:

- K3s cluster bootstrap from zero.
- Wazuh manager/agent full installation.
- Grafana/Loki/Alertmanager full installation.
- PostgreSQL/Redis/RabbitMQ installation and restore.
- Backend/OCR application deployment through Ansible.
- Disaster recovery automation.

For the current project scope, Terraform covers infrastructure state/adoption, GitHub Actions covers CI/CD, ArgoCD/GitOps covers Kubernetes manifests, and Ansible covers server audit plus selected configuration management.
