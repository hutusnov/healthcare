# Argo CD Bootstrap Runbook

This runbook turns on GitOps for the cluster only after the manifests have passed CI.

## Preconditions

- `kubectl config current-context` points to the target cluster.
- Runtime secrets already exist in the target namespaces.
- The current Git commit is already pushed to `main`.

## Install Argo CD

```bash
kubectl config current-context
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl -n argocd rollout status deploy/argocd-server --timeout=300s
```

## Bootstrap UIT Healthcare Apps

```bash
kubectl apply -k deploy/argocd/bootstrap
kubectl apply -k deploy/argocd/apps
kubectl -n argocd get applications
```

## Verify

```bash
kubectl -n argocd get app uit-healthcare-root
kubectl -n argocd get app uit-healthcare-openstack-runtime
kubectl -n argocd get app uit-healthcare-aws-backend
kubectl -n argocd get app uit-healthcare-private-ocr
kubectl -n argocd get app -o wide
```

At this point apps should be registered in Argo CD, but not auto-synced. The safest first sync is the OpenStack runtime app because it adopts existing resources:

```bash
argocd app diff uit-healthcare-openstack-runtime
argocd app sync uit-healthcare-openstack-runtime
```

## Workload Checks After Manual Sync

```bash
kubectl -n uit-healthcare-prod get deploy,svc,pdb,networkpolicy
kubectl -n uit-healthcare-private get deploy,svc,pdb,networkpolicy
```
