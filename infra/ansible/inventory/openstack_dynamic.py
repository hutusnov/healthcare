#!/usr/bin/env python3
"""
Dynamic inventory — UIT Healthcare
Ưu tiên: terraform output → OpenStack CLI → fallback static

Sử dụng:
  ansible-inventory -i inventory/openstack_dynamic.py --list
  ansible -i inventory/openstack_dynamic.py all -m ping
  ansible-playbook -i inventory/openstack_dynamic.py playbooks/audit.yml

Yêu cầu terraform output có key: instance_ips (map of name → ip)
  output "instance_ips" {
    value = {
      "k3s-master-vpn" = openstack_compute_instance_v2.master.access_ip_v4
      "data-core-node"  = openstack_compute_instance_v2.data_core.access_ip_v4
      "ai-ocr-worker"   = openstack_compute_instance_v2.ocr.access_ip_v4
    }
  }
"""

import json
import subprocess
import sys
import os

# ── Config ──────────────────────────────────────────────────
TERRAFORM_DIR = os.path.join(
    os.path.dirname(__file__), "..", "infra", "terraform", "envs", "dev"
)

SSH_KEY_OPENSTACK = "~/.ssh/openstack-key.pem"   # CHANGE_ME
SSH_KEY_AWS       = "~/.ssh/aws-key.pem"          # CHANGE_ME
BASTION_HOST      = "192.168.100.97"              # k3s-master-vpn

# Static fallback IPs (OpenStack nodes)
STATIC_IPS = {
    "k3s-master-vpn": "192.168.100.97",
    "data-core-node":  "192.168.100.83",
    "ai-ocr-worker":   "192.168.100.169",
}

# WireGuard IPs (10.8.0.x — thực tế hệ thống)
WIREGUARD_IPS = {
    "k3s-master-vpn": "10.8.0.1",
    "aws-vpn-node":   "10.8.0.2",
}

# K3s roles
K3S_ROLES = {
    "k3s-master-vpn": "master",
    "data-core-node":  "worker",
    "ai-ocr-worker":   "worker",
}

# Node labels
NODE_LABELS = {
    "k3s-master-vpn":   ["wireguard-gateway", "cloudflared", "prometheus"],
    "data-core-node":   ["wazuh-manager", "grafana", "alertmanager", "loki"],
    "ai-ocr-worker":    ["ocr"],
    "aws-vpn-node":     ["wireguard-peer", "node-exporter"],
    "aws-backend-az1":  ["backend-api", "node-exporter"],
    "aws-backend-az2":  ["backend-api", "node-exporter"],
}

# AWS nodes — IPs tĩnh (không qua OpenStack)
AWS_NODES = {
    "aws-vpn-node":    "10.0.5.40",
    "aws-backend-az1": "10.0.138.155",
    "aws-backend-az2": "10.0.153.123",
}
# ────────────────────────────────────────────────────────────


def run(cmd, cwd=None):
    result = subprocess.run(cmd, capture_output=True, text=True, cwd=cwd)
    if result.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(cmd)}\n{result.stderr.strip()}")
    return result.stdout.strip()


def get_from_terraform():
    """Lấy OpenStack node IPs từ terraform output -json."""
    raw = run(["terraform", "output", "-json"], cwd=TERRAFORM_DIR)
    tf_out = json.loads(raw)

    # Thử key "instance_ips" trước
    if "instance_ips" in tf_out:
        return tf_out["instance_ips"]["value"]

    # Thử key "openstack_adopted_inventory"
    if "openstack_adopted_inventory" in tf_out:
        inventory_val = tf_out["openstack_adopted_inventory"]["value"]
        instances = inventory_val.get("instances", {})
        nodes = {}
        for _, instance in instances.items():
            if instance:
                name = instance.get("name", "")
                ip = instance.get("fixed_ip") or instance.get("floating_ip")
                if name and ip:
                    nodes[name] = ip
        return nodes if nodes else None

    return None


def get_from_openstack_cli():
    """Fallback: query OpenStack CLI."""
    raw = run(["openstack", "server", "list", "-f", "json"])
    servers = json.loads(raw)
    nodes = {}
    for s in servers:
        name = s.get("Name", "")
        if name not in STATIC_IPS:
            continue
        networks = s.get("Networks", "")
        for part in networks.split(","):
            part = part.strip()
            if "=" in part:
                ip = part.split("=", 1)[1].strip()
                nodes[name] = ip
                break
    return nodes if nodes else None


def build_hostvars(name, ip, is_aws=False):
    proxy = (
        f"-o StrictHostKeyChecking=no -o ConnectTimeout=10 "
        f"-o ProxyJump=ubuntu@{BASTION_HOST}"
    )
    base = (
        f"-o StrictHostKeyChecking=no -o ConnectTimeout=10"
    )
    return {
        "ansible_host": ip,
        "ansible_user": "ubuntu",
        "ansible_python_interpreter": "/usr/bin/python3",
        "ansible_ssh_private_key_file": SSH_KEY_AWS if is_aws else SSH_KEY_OPENSTACK,
        "ansible_ssh_common_args": proxy if is_aws else base,
        "wireguard_ip": WIREGUARD_IPS.get(name, ""),
        "k3s_role": K3S_ROLES.get(name, "none"),
        "node_labels": NODE_LABELS.get(name, []),
    }


def build_inventory(openstack_nodes: dict) -> dict:
    hostvars = {}

    # OpenStack nodes
    masters = []
    workers = []
    for name, ip in openstack_nodes.items():
        hostvars[name] = build_hostvars(name, ip, is_aws=False)
        if K3S_ROLES.get(name) == "master":
            masters.append(name)
        else:
            workers.append(name)

    # AWS nodes
    for name, ip in AWS_NODES.items():
        hostvars[name] = build_hostvars(name, ip, is_aws=True)

    aws_hosts = list(AWS_NODES.keys())

    return {
        "_meta": {"hostvars": hostvars},
        "all": {
            "children": ["openstack", "aws"]
        },
        "openstack": {
            "children": ["k3s_master", "k3s_workers"]
        },
        "k3s_cluster": {
            "children": ["k3s_master", "k3s_workers"]
        },
        "k3s_master": {
            "hosts": masters
        },
        "k3s_workers": {
            "hosts": workers
        },
        "aws": {
            "hosts": aws_hosts
        },
        "backend_nodes": {
            "hosts": ["aws-backend-az1", "aws-backend-az2"]
        },
        "vpn_nodes": {
            "hosts": ["k3s-master-vpn", "aws-vpn-node"]
        },
        "wazuh_nodes": {
            "hosts": list(openstack_nodes.keys()) + aws_hosts
        },
    }


def main():
    if "--host" in sys.argv:
        # hostvars in _meta — return empty per host
        print(json.dumps({}))
        return

    if "--list" not in sys.argv:
        print(json.dumps({}))
        return

    openstack_nodes = None
    errors = []

    # 1. Thử terraform output
    try:
        openstack_nodes = get_from_terraform()
        if openstack_nodes:
            sys.stderr.write("[dynamic] Source: terraform output\n")
    except Exception as e:
        errors.append(f"terraform: {e}")

    # 2. Thử OpenStack CLI
    if not openstack_nodes:
        try:
            openstack_nodes = get_from_openstack_cli()
            if openstack_nodes:
                sys.stderr.write("[dynamic] Source: openstack CLI\n")
        except Exception as e:
            errors.append(f"openstack cli: {e}")

    # 3. Fallback static
    if not openstack_nodes:
        sys.stderr.write(
            f"[dynamic] WARNING: Using static fallback IPs. Errors:\n"
            + "\n".join(f"  - {e}" for e in errors) + "\n"
        )
        openstack_nodes = STATIC_IPS

    print(json.dumps(build_inventory(openstack_nodes), indent=2))


if __name__ == "__main__":
    main()