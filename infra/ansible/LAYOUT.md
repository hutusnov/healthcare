# UIT Healthcare Ansible Layout

This directory follows the standard Ansible structure used for the UIT
Healthcare hybrid-cloud infrastructure.

## Inventory

- `inventory/hosts.yml`: static production-like inventory for AWS and OpenStack.
- `inventory/staging.yml`: staging-zero inventory for the AWS test account.
- `inventory/openstack_dynamic.py`: dynamic inventory helper for OpenStack and Terraform fallback.

## Group Variables

- `group_vars/all.yml`: shared defaults for every host.
- `group_vars/staging.yml`: staging-specific runtime variables.
- `group_vars/k3s_cluster.yml`: K3s cluster-level variables.
- `group_vars/k3s_master.yml`: K3s control-plane variables.

## Roles

- `roles/base_packages`: timezone, base packages, fail2ban and base sysctl setup.
- `roles/docker_runtime`: Docker Engine and Docker Compose plugin setup.
- `roles/wireguard`: WireGuard VPN setup.
- `roles/promtail`: Promtail log shipping setup.

## Playbooks

Playbooks under `playbooks/` are entrypoints. They select target groups and call
roles where possible. This keeps reusable tasks in `roles/` instead of duplicating
logic across playbooks.

CI validates inventories and runs `ansible-playbook --syntax-check` against the
operational playbooks before any manual run is used on real servers.

