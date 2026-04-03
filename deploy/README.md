# Hybrid Deploy Layout

This directory reflects the agreed target architecture:

- `deploy/gitops/apps/aws-backend`: public-facing backend deployment for AWS.
- `deploy/gitops/apps/private-ocr`: private OCR deployment for the OpenStack lab cluster.
- `deploy/aws-ec2`: the current lightweight deploy path for the AWS EC2 backend runtime.
- `deploy/argocd`: ArgoCD `Application` manifests that point to the GitOps paths above.

The existing runtime manifest at `BACK-END/PROJECT-TEST/k8s/deployment.yml` is kept intact for the currently running OpenStack setup. These new manifests are the GitOps-ready path toward the hybrid target architecture.
