# Argo CD Manual Sync Runbook

Use this runbook when Git has the desired state and an operator wants Argo CD to apply it to K3s.

The default posture is safe and manual. Do not enable auto-sync until runtime readiness has been reviewed.

## 1. Open The Cluster Tunnel

Connect VPN first, then keep this terminal open:

```bash
ssh -N -L 6443:127.0.0.1:6443 k3s-master
```

## 2. Check The Target App

From the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy\argocd\scripts\pre-sync-check.ps1 -App uit-healthcare-openstack-runtime
```

Other apps:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy\argocd\scripts\pre-sync-check.ps1 -App uit-healthcare-aws-backend
powershell -ExecutionPolicy Bypass -File .\deploy\argocd\scripts\pre-sync-check.ps1 -App uit-healthcare-private-ocr
```

## 3. Review The Diff

Prefer the Argo CD UI. If the Argo CD CLI is available:

```bash
argocd app diff uit-healthcare-openstack-runtime
```

Only continue if the diff is expected.

## 4. Sync One App At A Time

```bash
argocd app sync uit-healthcare-openstack-runtime
argocd app wait uit-healthcare-openstack-runtime --health --sync --timeout 300
```

For production workload apps, verify runtime dependencies before syncing:

- Required Kubernetes Secrets already exist out-of-band.
- Image tags are immutable and already pushed to GHCR.
- Image pull access works.
- Node capacity is enough.
- Ingress, service, and health checks are expected.

## 5. Verify Runtime

```bash
kubectl -n uit-healthcare get deploy,svc,pdb
kubectl -n uit-healthcare-prod get deploy,svc,pdb
kubectl -n uit-healthcare-private get deploy,svc,pdb
```

If a sync causes an unsafe state, use `ROLLBACK.md`.
