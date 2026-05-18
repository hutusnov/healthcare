# OpenStack Monitoring GitOps

This app moves the next monitoring layer into the private K3s/OpenStack zone without creating new AWS resources.

Safety defaults:

- Argo CD sync is manual only.
- Services are `ClusterIP`; no public LoadBalancer is created.
- Storage uses `emptyDir`; no OpenStack volume is created by default.
- Alertmanager is configured with a `blackhole` receiver until SMTP credentials are provided out-of-band.
- Pods are pinned to `data-core-node` so monitoring does not run on the VPN gateway.
- Grafana credentials must be created as a live Kubernetes Secret; no Secret manifest is committed.

Before syncing the app, create the Grafana admin Secret:

```powershell
kubectl -n monitoring create secret generic grafana-admin `
  --from-literal=username=admin `
  --from-literal=password="<strong-password>"
```

After manual sync, access Grafana through the VPN with:

```powershell
kubectl -n monitoring port-forward svc/grafana 3000:3000
```

Then open `http://127.0.0.1:3000`.
