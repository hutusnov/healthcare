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

Access Grafana through the VPN with:

```powershell
kubectl -n monitoring port-forward svc/o11y-grafana 3000:80
```

Then open `http://127.0.0.1:3000`.
