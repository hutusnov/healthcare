# Ansible — UIT Healthcare Infrastructure

Codify toàn bộ manual configs cho hybrid infrastructure (OpenStack K3s + AWS EC2).

## Cấu trúc

```
infra/ansible/
├── ansible.cfg                          # cấu hình Ansible
├── inventory/
│   ├── hosts.yml                        # static inventory (đã điền IP thật)
│   └── openstack_dynamic.py             # dynamic inventory (terraform → OpenStack CLI → static fallback)
├── group_vars/
│   ├── all.yml                          # vars cho tất cả hosts
│   ├── k3s_cluster.yml                  # vars cho toàn cluster
│   └── k3s_master.yml                   # vars riêng cho master
├── playbooks/
│   ├── site.yml                         # master playbook (chạy tất cả)
│   ├── packages.yml                     # cài base packages
│   ├── wireguard.yml                    # setup WireGuard VPN
│   ├── promtail.yml                     # cài Promtail
│   └── audit.yml                        # quét toàn bộ services/configs (read-only)
├── roles/
│   ├── wireguard/                       # WireGuard role
│   └── promtail/                        # Promtail role
└── scripts/
    └── gen_inventory_from_tf.py         # sinh hosts.yml từ terraform output
```

## Node Topology

| Node | Platform | IP | Role | Services |
|------|----------|----|------|----------|
| k3s-master-vpn | OpenStack | 192.168.100.97 | K3s master | WireGuard gateway, Cloudflare Tunnel, Prometheus |
| data-core-node | OpenStack | 192.168.100.83 | K3s worker | Wazuh Manager (Docker), Grafana, Loki, Alertmanager |
| ai-ocr-worker | OpenStack | 192.168.100.169 | K3s worker | OCR service |
| aws-vpn-node | AWS | 10.0.5.40 | Standalone | WireGuard peer, node-exporter |
| aws-backend-az1 | AWS | 10.0.138.155 | Standalone | Backend API :4000, node-exporter |
| aws-backend-az2 | AWS | 10.0.153.123 | Standalone | Backend API :4000, node-exporter |

## SSH Access

- **OpenStack nodes**: Truy cập trực tiếp qua SSH key (`~/.ssh/openstack-key.pem`).
- **AWS nodes**: Truy cập qua **ProxyJump** bastion (`k3s-master-vpn` → AWS private IP) với SSH key (`~/.ssh/aws-key.pem`).

## Inventory Groups

| Group | Nodes | Mục đích |
|-------|-------|----------|
| `all` | Tất cả 6 nodes | Chạy audit toàn hệ thống |
| `openstack` | k3s-master-vpn, data-core-node, ai-ocr-worker | OpenStack nodes |
| `aws` | aws-vpn-node, aws-backend-az1, aws-backend-az2 | AWS EC2 nodes |
| `k3s_cluster` | k3s-master-vpn, data-core-node, ai-ocr-worker | K3s cluster |
| `k3s_master` | k3s-master-vpn | K3s control-plane |
| `k3s_workers` | data-core-node, ai-ocr-worker | K3s worker nodes |
| `backend_nodes` | aws-backend-az1, aws-backend-az2 | Backend API servers |
| `vpn_nodes` | k3s-master-vpn, aws-vpn-node | WireGuard tunnel endpoints |
| `wazuh_nodes` | Tất cả 6 nodes | Nodes có Wazuh agent |

## Bước 1 — Chuẩn bị SSH Keys (Windows PowerShell)

Vì hệ thống dùng cơ chế **Double ProxyJump** và **ForwardAgent** để tăng cường bảo mật (không lưu private key trên bất kỳ server nào), bạn cần bật `ssh-agent` ở máy tính cá nhân (Windows) và load cả 2 keys vào:

Mở **PowerShell dưới quyền Administrator** và chạy:

```powershell
# 1. Bật ssh-agent
Set-Service -Name ssh-agent -StartupType Automatic
Start-Service ssh-agent

# 2. Add cả 2 keys (Sửa đường dẫn nếu cần)
ssh-add C:\Users\CHT\.ssh\openstack-key.pem
ssh-add C:\Users\CHT\.ssh\aws-healthcare-key.pem

# 3. Verify
ssh-add -l
```

*(Lưu ý: Key không bao giờ rời khỏi máy tính của bạn — nó chỉ được forward qua các SSH tunnel an toàn để chứng thực tự động với các hop tiếp theo).*

## Bước 2 — Chọn Inventory

### Option A: Static inventory (khuyên dùng — đã điền IP thật)

```bash
ansible-playbook -i inventory/hosts.yml playbooks/audit.yml
```

### Option B: Dynamic inventory (tự query terraform → OpenStack CLI → fallback static)

```bash
ansible-playbook -i inventory/openstack_dynamic.py playbooks/audit.yml
```

Yêu cầu: `terraform apply` đã chạy hoặc OpenStack credentials (`OS_AUTH_URL`, `OS_USERNAME`, ...).

## Bước 3 — Kiểm tra kết nối

```bash
cd infra/ansible

# Ping tất cả nodes
ansible -i inventory/hosts.yml all -m ping

# Chỉ ping OpenStack nodes
ansible -i inventory/hosts.yml openstack -m ping

# Chỉ ping AWS nodes (qua bastion)
ansible -i inventory/hosts.yml aws -m ping
```

## Bước 4 — Chạy Playbooks

```bash
# ── Audit (read-only, không thay đổi gì trên server) ──
# Quét toàn bộ 27 hạng mục: services, Docker, K3s, Helm values,
# iptables, sysctl, SSH, Wazuh, Cloudflared, Node Exporter, ...
ansible-playbook -i inventory/hosts.yml playbooks/audit.yml

# Chỉ audit OpenStack nodes
ansible-playbook -i inventory/hosts.yml playbooks/audit.yml --limit openstack

# Chỉ audit AWS nodes
ansible-playbook -i inventory/hosts.yml playbooks/audit.yml --limit aws

# Chỉ audit master
ansible-playbook -i inventory/hosts.yml playbooks/audit.yml --limit k3s_master

# Xem báo cáo sau khi chạy
cat /tmp/audit-report/INDEX.txt          # tổng hợp
cat /tmp/audit-report/k3s-master-vpn.txt # chi tiết từng node

# ── Provisioning playbooks ──
# Chạy toàn bộ (packages + wireguard + promtail)
ansible-playbook -i inventory/hosts.yml playbooks/site.yml

# Chỉ cài packages
ansible-playbook -i inventory/hosts.yml playbooks/packages.yml

# Chỉ setup WireGuard
ansible-playbook -i inventory/hosts.yml playbooks/wireguard.yml

# Chỉ deploy Promtail — override loki_url nếu cần
ansible-playbook -i inventory/hosts.yml playbooks/promtail.yml \
  -e loki_url=http://10.8.0.1:3100

# Dry-run (check mode)
ansible-playbook -i inventory/hosts.yml playbooks/site.yml --check --diff
```

## AWS Staging-Zero Reproduce

Sau khi Terraform dựng `infra/terraform/envs/staging-zero`, dùng inventory staging:

```bash
cd infra/ansible
ANSIBLE_CONFIG=ansible.cfg ansible-playbook -i inventory/staging.yml playbooks/preflight.yml
ANSIBLE_CONFIG=ansible.cfg ansible-playbook -i inventory/staging.yml playbooks/site.yml
ANSIBLE_CONFIG=ansible.cfg ansible-playbook -i inventory/staging.yml playbooks/backend_app.yml
```

Full staging reproduce path:

```bash
cd infra/terraform/envs/staging-zero
terraform validate
terraform plan -lock=false
terraform apply

cd ../../../ansible
ANSIBLE_CONFIG=ansible.cfg ansible-playbook -i inventory/staging.yml playbooks/reproduce_staging.yml -f 1
```

`reproduce_staging.yml` provisions the AWS staging runtime in a safe order:

- Base packages, node-exporter, fail2ban with automation/admin CIDR ignored.
- Docker runtime.
- Backend API and PostgreSQL with runtime secrets from AWS Secrets Manager.
- Redis and RabbitMQ on the data-services node.
- Prometheus, Grafana, Loki, and Alertmanager on the monitoring node.
- Daily PostgreSQL backup cron plus one validation backup.
- PostgreSQL dump fetch to the local controller.

For the current staging-zero footprint, `t3.small` is the practical minimum.
`t3.micro` can run backend-only, but it is too small for backend + PostgreSQL +
Redis/RabbitMQ + Prometheus/Grafana/Loki on the same node.

Staging secrets are loaded from AWS Secrets Manager by default:
`uit-healthcare-staging/backend`. Terraform creates the secret metadata only;
secret values are stored outside Terraform state and injected by Ansible at
runtime. `infra/ansible/secrets/staging.yml` is a git-ignored local fallback,
not the default staging path.

Backup PostgreSQL staging:

```bash
ANSIBLE_CONFIG=ansible.cfg ansible-playbook -i inventory/staging.yml playbooks/db_backup.yml
```

Restore PostgreSQL staging phải xác nhận rõ. Restore không dùng `DROP`,
`--clean`, hoặc `--if-exists`; nếu cần thay table cũ thì tạo table mới và
migrate/cut over an toàn.

```bash
ANSIBLE_CONFIG=ansible.cfg ansible-playbook -i inventory/staging.yml playbooks/db_backup.yml \
  -e db_backup_mode=restore \
  -e confirm_restore=true \
  -e restore_file=/absolute/path/to/backup.dump
```

Guarded OpenStack/lab reproduce:

```bash
ANSIBLE_CONFIG=ansible.cfg ansible-playbook -i inventory/hosts.yml playbooks/reproduce_openstack_guarded.yml --check --diff
```

K3s and Wazuh bootstrap are disabled by default. Enable them only on a fresh or
intentionally rebuilt lab target:

```bash
ANSIBLE_CONFIG=ansible.cfg ansible-playbook -i inventory/hosts.yml playbooks/k3s.yml \
  -e k3s_bootstrap_enabled=true

ANSIBLE_CONFIG=ansible.cfg ansible-playbook -i inventory/hosts.yml playbooks/wazuh.yml \
  -e wazuh_bootstrap_enabled=true
```

## Audit Playbook — Danh sách quét

`playbooks/audit.yml` quét **27 hạng mục** trên mỗi node:

| # | Hạng mục | Chi tiết |
|---|----------|----------|
| 1 | System Info | OS, kernel, CPU, RAM, IPs, uptime |
| 2 | Systemd Services | Running + Enabled services |
| 3 | Docker | Version, containers, compose projects |
| 4a | K3s | Version, nodes |
| 4b | Helm Releases | All releases + custom values (per release) |
| 4c | K8s Resources | Namespaces, pods, ConfigMaps, Secrets |
| 4c | ArgoCD Apps | Name, Sync status, Health, Repo, Path |
| 5 | Listening Ports | TCP ports (ss -tlnp) |
| 6 | Key Packages | docker, k3s, wireguard, promtail, wazuh-agent, cloudflared... |
| 7 | Cron Jobs | root + ubuntu crontabs |
| 8 | WireGuard | Interface status, peers |
| 9 | Config Files | Existence check (/etc/promtail, /etc/cloudflared, /etc/rancher/k3s, /var/ossec...) |
| 9b | Promtail Config | Full config content dump |
| 9c | Wazuh Agent | wazuh-control status |
| 9d | Cloudflared Tunnel | Version, tunnel list, tunnel config |
| 9e | Node Exporter | curl localhost:9100/metrics health check |
| 9f | AWS SSM Agent | systemctl status |
| 10 | Disk Usage | df -h |
| 11 | Firewall | iptables-save, nftables, UFW status |
| 12 | Sysctl | Non-default kernel tweaks |
| 13 | SSH Config | Port, PermitRootLogin, PasswordAuth, authorized_keys count |
| 14 | Users & Sudoers | Non-system users, /etc/sudoers.d/ |
| 15 | Custom Systemd | Non-vendor .service/.timer files + overrides |
| 16 | Fail2ban | Status + active jails |
| 17 | Logrotate | Custom configs list |
| 18 | APT Sources | /etc/apt/sources.list + sources.list.d/ |
| 19 | Kernel Modules | All loaded modules (lsmod) |
| 20 | Mounts & Swap | /etc/fstab, swap, NFS/CIFS |
| 21 | Environment | /etc/environment, /etc/profile.d/*.sh |

## Sau khi WireGuard chạy

Playbook WireGuard tự generate keypair trên từng node và expose `wg_pubkey` fact.

Để lấy public key của từng node:

```bash
ansible -i inventory/hosts.yml vpn_nodes -m debug -a "msg={{ wg_pubkey }}"
```

Rồi cập nhật `group_vars/k3s_master.yml` với `wireguard_peers`.

## Override loki_url per-node

Trong `inventory/hosts.yml`, thêm host var:

```yaml
k3s-master-vpn:
  loki_url: http://127.0.0.1:3100   # local Loki trên master
```

## Private Keys

- WireGuard private keys được generate trực tiếp trên server tại `/etc/wireguard/`.
- SSH private keys (`openstack-key.pem`, `aws-key.pem`) lưu local tại `~/.ssh/`.
- **KHÔNG bao giờ copy private key hay commit vào repo.**
