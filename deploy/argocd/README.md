# Argo CD GitOps

This directory contains the GitOps entrypoint for the UIT Healthcare hybrid deployment.

## Layout

- `bootstrap/`: one-time Argo CD bootstrap manifests.
- `apps/`: child Argo CD Applications managed by the root app.
- `../gitops/apps/aws-backend`: Kubernetes manifests for the public backend workload.
- `../gitops/apps/private-ocr`: Kubernetes manifests for the private OCR workload.

## Safe Bootstrap

Run these commands only after confirming the target Kubernetes context points to the intended cluster.

```bash
kubectl config current-context
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl apply -k deploy/argocd/bootstrap
```

After bootstrap, Argo CD will own the child apps from `deploy/argocd/apps` and sync the GitOps manifests from `deploy/gitops/apps`.

## Safety Notes

- Secrets are intentionally not stored in Git. Create runtime secrets out-of-band before enabling auto-sync for workloads.
- CI validates Kustomize output, Argo CD manifests, and blocks committed Kubernetes Secret manifests.
- Existing EC2-based CD remains available while GitOps is introduced gradually.
