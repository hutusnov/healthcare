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

Before deploying kube-prometheus-stack, make sure no host-level node-exporter is running on the K3s nodes (port 9100 conflict):

```bash
# Run on ALL K3s nodes
sudo systemctl stop prometheus-node-exporter 2>/dev/null || true
sudo systemctl disable prometheus-node-exporter 2>/dev/null || true
```

## Helm Values (kube-prometheus-stack)

Helm values are **not managed by ArgoCD** — apply manually:

```bash
# Copy template, fill in real secrets
cp deploy/gitops/apps/openstack-monitoring/helm-values.yaml.example \
   ~/o11y-helm-values.yaml

# Fill in BOT_TOKEN and CHAT_ID in the file
nano ~/o11y-helm-values.yaml

# Apply
helm upgrade o11y prometheus-community/kube-prometheus-stack \
  -n monitoring \
  -f ~/o11y-helm-values.yaml
```

**Important notes:**

- `grafana.persistence.enabled: false` - keep it false to avoid datasource conflicts
- `additionalScrapeConfigs: []` - AWS scrape configs are patched separately into the secret,
  do not put them in helm values to avoid being overwritten during upgrades
- The `~/o11y-helm-values.yaml` file on the server contains real secrets, **do not commit it to Git**
