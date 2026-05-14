# Argo CD Bootstrap Status

Date: 2026-05-14

## Cluster

- Target cluster: OpenStack K3s cluster
- Access method: local kubeconfig over SSH tunnel to `k3s-master-vpn`
- Nodes verified:
  - `k3s-master-vpn`
  - `ai-ocr-worker`

## Applied Components

- Argo CD namespace: `argocd`
- Argo CD CRDs:
  - `applications.argoproj.io`
  - `applicationsets.argoproj.io`
  - `appprojects.argoproj.io`
- Argo CD core workloads:
  - `argocd-application-controller`
  - `argocd-applicationset-controller`
  - `argocd-dex-server`
  - `argocd-notifications-controller`
  - `argocd-redis`
  - `argocd-repo-server`
  - `argocd-server`

## GitOps Applications

- `uit-healthcare-root`: synced and healthy
- `uit-healthcare-openstack-runtime`: planned as the safe first workload sync target for the existing K3s runtime
- `uit-healthcare-aws-backend`: registered, manual sync, not deployed yet
- `uit-healthcare-private-ocr`: registered, manual sync, not deployed yet

## Safety Decision

Initial application sync is intentionally manual. This prevents Argo CD from creating additional backend/OCR workloads before runtime secrets, image pull access, and cluster capacity are verified.
