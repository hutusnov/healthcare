# Argo CD GitOps

This directory contains the GitOps entrypoint for the UIT Healthcare hybrid deployment.

## Layout

- `bootstrap/`: one-time Argo CD bootstrap manifests.
- `apps/`: child Argo CD Applications managed by the root app.
- `runbooks/`: operational bootstrap and rollback steps.
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

After bootstrap, Argo CD will track the child apps from `deploy/argocd/apps`. Initial sync is intentionally manual so the current runtime is not changed until the operator explicitly syncs an app.

## Safety Notes

- Secrets are intentionally not stored in Git. Create runtime secrets out-of-band before enabling auto-sync for workloads.
- CI validates Kustomize output, Argo CD manifests, and blocks committed Kubernetes Secret manifests.
- AppProject limits source repositories, target namespaces, and allowed Kubernetes resource kinds.
- NetworkPolicy and PodDisruptionBudget are included for safer runtime behavior.
- Initial application sync is manual. Enable automated sync only after secrets, image pull access, and capacity are verified.
- Existing EC2-based CD remains available while GitOps is introduced gradually.
