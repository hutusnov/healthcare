# Argo CD Rollback Runbook

Use this when a GitOps sync introduces an unsafe application change.

## Pause Auto Sync

```bash
argocd app set uit-healthcare-aws-backend --sync-policy none
argocd app set uit-healthcare-private-ocr --sync-policy none
```

## Roll Back By Git

```bash
git revert <bad_commit_sha>
git push origin main
```

Then sync the affected app:

```bash
argocd app sync uit-healthcare-aws-backend
argocd app sync uit-healthcare-private-ocr
```

## Emergency Cluster Rollback

If Argo CD CLI is unavailable, use kubectl only for the affected workload:

```bash
kubectl -n uit-healthcare-prod rollout undo deploy/backend-api
kubectl -n uit-healthcare-private rollout undo deploy/ocr-service
```

After the emergency rollback, fix Git and re-enable Argo CD sync.
