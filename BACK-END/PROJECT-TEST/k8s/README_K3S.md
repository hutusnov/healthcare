# K3s Deploy Notes

Manifest `deployment.yml` nay da duoc canh theo topology hien tai:

- Backend va OCR chay trong K3s
- PostgreSQL/Redis/RabbitMQ chay tren `data-core-node`
- Backend phai dung `DATABASE_URL` tro toi `192.168.100.83`

## 1. Tao namespace va secrets

```bash
kubectl create namespace uit-healthcare
```

Neu package tren GHCR dang private, tao image pull secret:

```bash
kubectl -n uit-healthcare create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username='<GITHUB_USERNAME>' \
  --docker-password='<GITHUB_PAT_READ_PACKAGES>' \
  --docker-email='<EMAIL>'
```

Gan nhan cho node OCR de pod `ocr-service` chay dung tren `ai-ocr-worker`:

```bash
kubectl label node ai-ocr-worker workload-role=ocr
```

```bash
kubectl -n uit-healthcare create secret generic backend-secret \
  --from-literal=database-url='postgresql://project:<POSTGRES_PASSWORD>@192.168.100.83:5432/project_test' \
  --from-literal=jwt-secret='<JWT_SECRET>'
```

```bash
kubectl -n uit-healthcare create secret generic ocr-secret \
  --from-literal=api-key='<OCR_API_KEY>'
```

Neu secret da ton tai thi xoa roi tao lai:

```bash
kubectl -n uit-healthcare delete secret backend-secret ocr-secret
```

## 2. Apply manifest

```bash
kubectl apply -f BACK-END/PROJECT-TEST/k8s/deployment.yml
```

## 3. Kiem tra

```bash
kubectl -n uit-healthcare get pods
kubectl -n uit-healthcare get svc
kubectl -n uit-healthcare logs deploy/backend-api --tail=100
kubectl -n uit-healthcare logs deploy/ocr-service --tail=100
```

## 4. Ghi chu

- Manifest nay khong con deploy Postgres trong K3s nua.
- `data-core-node` tiep tuc la data layer duy nhat.
- `ocr-service` duoc ghim bang `nodeSelector` de chay tren `ai-ocr-worker`.
- Images duoc pull tu GHCR thay vi image local trong node.
- Neu can migrate Prisma, hay chay tu backend image/pod sau khi `backend-secret` da dung.
