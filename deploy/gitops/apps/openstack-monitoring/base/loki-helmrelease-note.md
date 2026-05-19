# Loki Stack

Installed via Helm (not managed by ArgoCD due to deprecated chart):

```bash
helm upgrade --install loki grafana/loki-stack \
  --namespace monitoring \
  --kubeconfig /etc/rancher/k3s/k3s.yaml \
  --set loki.persistence.enabled=true \
  --set loki.persistence.size=10Gi \
  --set promtail.enabled=true \
  --set grafana.enabled=false \
  --set prometheus.enabled=false \
  --set loki.config.limits_config.retention_period=168h
```
