# External Secrets AWS Secrets Manager Example

This folder is a guarded example for the future K3s secret-management path.
It is intentionally not referenced by any Argo CD `Application` yet.

Use only after:

- External Secrets Operator is installed in the target cluster.
- The cluster has a secure AWS auth path, for example IRSA-equivalent support,
  short-lived credentials, or a sealed/managed credential secret.
- The AWS Secrets Manager secret exists and contains the expected keys.

For current staging, Ansible already reads:

```text
uit-healthcare-staging/backend
```

Required keys:

- `backend_jwt_secret`
- `db_password`

Do not commit raw AWS credentials or Kubernetes `Secret` values.

