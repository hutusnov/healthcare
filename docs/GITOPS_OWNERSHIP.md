# GitOps Ownership Matrix

This document defines what Argo CD is allowed to manage and what remains
manual/adopted. The goal is to avoid accidental deletion of live lab resources.

## Argo CD Managed

| Area | Path | Status |
|---|---|---|
| Argo CD bootstrap/project/root app | `deploy/argocd/bootstrap` | GitOps-managed after initial manual install |
| Argo CD child applications | `deploy/argocd/apps` | GitOps-managed |
| OpenStack runtime manifests | `deploy/gitops/apps/openstack-runtime` | GitOps-managed, manual sync preferred |
| Private OCR manifests | `deploy/gitops/apps/private-ocr` | GitOps-managed, manual sync preferred |
| OpenStack monitoring manifests | `deploy/gitops/apps/openstack-monitoring` | GitOps-managed, manual sync preferred |
| AWS backend Kubernetes manifest model | `deploy/gitops/apps/aws-backend` | Manifest model/validation; AWS EC2 runtime remains CD-managed |

## Not Argo CD Managed Yet

| Area | Reason |
|---|---|
| Existing OpenStack VM lifecycle | Managed/adopted by Terraform, not Kubernetes |
| AWS EC2 backend runtime | Deployed by GitHub Actions/Ansible, not K3s |
| Wazuh Docker single-node runtime | Stateful SIEM; do not overwrite without migration window |
| Raw Kubernetes Secrets | Must move through External Secrets/Sealed Secrets before GitOps ownership |
| Cloudflare tunnel runtime | Existing operational component; import only after ownership decision |
| Manual emergency changes | Must be reconciled back into Git before enabling automated sync |

## Promotion Rule

Before moving a live resource into strict Argo CD ownership:

1. Export the live resource.
2. Remove generated fields and secrets.
3. Add the sanitized manifest to Git.
4. Render with `kubectl kustomize`.
5. Run `argocd app diff`.
6. Sync manually once.
7. Enable automation only after repeated clean diffs.

## Current Policy

Production/lab Argo CD applications should stay on manual sync. Automated sync is
acceptable only for disposable staging clusters or resources with tested
rollback.
