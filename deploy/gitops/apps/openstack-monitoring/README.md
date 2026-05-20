# OpenStack Monitoring GitOps

Monitoring is managed as the existing Helm release `o11y` from `kube-prometheus-stack`.

Safety defaults:

- Argo CD sync is manual only.
- The Helm chart version is pinned to `83.0.0`.
- The existing release name stays `o11y`, so Argo can adopt the current monitoring stack instead of creating a second stack.
- Prometheus, Alertmanager, Grafana, the operator, and kube-state-metrics are pinned to `data-core-node`.
- `prometheus-node-exporter.hostNetwork=false` avoids port `9100` conflicts with host-level exporters.
- No AWS resources are created by this app.

Current live migration backup is stored on `k3s-master-vpn` under `~/healthcare-backups/`.

## External Access via Cloudflare Tunnel

Monitoring dashboards are exposed through Cloudflare Tunnel using 2-level domain
structure (`*-healthcare.htsnov.com`) to stay within the Cloudflare Free Plan SSL
certificate limits.

| Service    | URL                                        | Backend Service                            | Port |
| ---------- | ------------------------------------------ | ------------------------------------------ | ---- |
| Grafana    | <https://grafana-healthcare.htsnov.com>      | o11y-grafana                               | 80   |
| Prometheus | <https://prometheus-healthcare.htsnov.com>   | o11y-kube-prometheus-stack-prometheus       | 9090 |

TLS is terminated by Nginx Ingress Controller using Cloudflare Origin CA
certificates issued via `cert-manager` + `ClusterOriginIssuer`.

Access is protected by Cloudflare Zero Trust Access policies.

## Local Port-Forward (VPN fallback)

```powershell
kubectl -n monitoring port-forward svc/o11y-grafana 3000:80
```

Then open `http://127.0.0.1:3000`.

## Prerequisites on K3s Nodes

Trước khi deploy kube-prometheus-stack, đảm bảo không có host-level
node-exporter đang chạy trên các K3s nodes (port 9100 conflict):

```bash
# Chạy trên TẤT CẢ K3s nodes
sudo systemctl stop prometheus-node-exporter 2>/dev/null || true
sudo systemctl disable prometheus-node-exporter 2>/dev/null || true
```

## Helm Values (kube-prometheus-stack)

Helm values **không được quản lý bởi ArgoCD** — apply thủ công:

```bash
# Copy template, điền secrets thật
cp deploy/gitops/apps/openstack-monitoring/helm-values.yaml.example \
   ~/o11y-helm-values.yaml

# Điền BOT_TOKEN và CHAT_ID thật vào file
nano ~/o11y-helm-values.yaml

# Apply
helm upgrade o11y prometheus-community/kube-prometheus-stack \
  -n monitoring \
  -f ~/o11y-helm-values.yaml
```

**Lưu ý quan trọng:**
- `grafana.persistence.enabled: false` — giữ nguyên, tránh conflict datasource
- `additionalScrapeConfigs: []` — scrape config AWS được patch riêng vào secret,
  không đặt trong helm values để tránh bị overwrite khi upgrade
- File `~/o11y-helm-values.yaml` trên server có secrets thật, **không commit vào Git**
