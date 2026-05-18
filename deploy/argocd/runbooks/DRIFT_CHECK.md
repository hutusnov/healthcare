# Argo CD Drift Check Runbook

Use this runbook to verify whether the K3s cluster still matches the GitOps desired state.

This is read-only by default. It does not sync, apply, prune, or restart workloads.

## 1. Connect To The Private Cluster

Connect VPN first, then open the Kubernetes API tunnel from Windows PowerShell or Git Bash:

```bash
ssh -N -L 6443:127.0.0.1:6443 k3s-master
```

Keep that terminal open while running checks.

## 2. Confirm Kube Context

```bash
kubectl config current-context
kubectl get nodes -o wide
```

Expected nodes:

- `k3s-master-vpn`
- `ai-ocr-worker`

## 3. Check Argo CD Applications

From the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy\argocd\scripts\check-live-status.ps1
```

Strict mode, useful before a demo:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy\argocd\scripts\check-live-status.ps1 -FailOnDegraded -FailOnOutOfSync
```

## 4. Interpret Results

- `Synced/Healthy`: Git and cluster match for that app.
- `OutOfSync/Healthy`: the app is running, but Git has changes not yet synced.
- `Missing`: the Argo CD Application was not created or the root app did not sync.
- `Degraded`: check the target Deployment, Pod, Service, or Secret before syncing.

## 5. Safe Manual Sync

Only sync one app at a time after checking rendered manifests and required runtime secrets:

```bash
kubectl -n argocd get applications.argoproj.io
kubectl -n argocd patch application uit-healthcare-openstack-runtime --type merge -p '{}'
```

Prefer the Argo CD UI or CLI for manual sync so the diff is visible before applying.

Do not enable auto-sync for all applications until backend secrets, OCR secrets, node capacity, ingress, and image pull access are verified.
