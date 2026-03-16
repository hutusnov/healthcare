# DevSecOps Pipeline Guide — UIT Healthcare System

> **Tài liệu hướng dẫn triển khai DevSecOps cho nhóm phát triển**

---

## 1. Tổng quan Pipeline

```
┌─────────────┐    ┌──────────┐    ┌──────────────────┐    ┌──────────┐
│  SAST Scan  │ →  │  BUILD   │ →  │  DOCKER + TRIVY  │ →  │  DEPLOY  │
│             │    │          │    │                  │    │          │
│ • npm audit │    │ • npm ci │    │ • docker build   │    │ • Push   │
│ • Semgrep   │    │ • prisma │    │ • trivy image    │    │ • Deploy │
│             │    │ • vite   │    │ • trivy fs       │    │          │
└─────────────┘    └──────────┘    └──────────────────┘    └──────────┘
```

**File:** `.github/workflows/deploy.yml`

| Stage | Trigger | Mục đích |
|---|---|---|
| SAST Scan | Push + PR | Quét lỗ hổng dependencies + code patterns |
| Build | Push + PR | Compile, lint, syntax check |
| Docker + Trivy | Push to `main` | Build images + scan CVEs |
| Deploy | Push to `main` | Deploy lên production |

---

## 2. Local Development

### 2.1 Yêu cầu

- Docker Desktop (Windows/Mac) hoặc Docker Engine (Linux)
- Node.js 20+ (cho development không dùng Docker)
- Git

### 2.2 Khởi động

```bash
# Clone repo
git clone <repo-url>
cd Project-Mobile/BACK-END/PROJECT-TEST

# Copy env file
cp .env.example .env
# → Sửa các giá trị trong .env

# Chạy bằng Docker (recommended)
docker-compose up --build

# Chạy + Monitoring (Prometheus + Grafana + Loki)
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up --build
```

### 2.3 Truy cập services

| Service | URL | Ghi chú |
|---|---|---|
| Backend API | http://localhost:4000 | API endpoint |
| Health Check | http://localhost:4000/api/health | Kiểm tra status |
| Metrics | http://localhost:4000/metrics | Prometheus metrics |
| Grafana | http://localhost:3000 | Login: admin/admin |
| Prometheus | http://localhost:9090 | Query metrics |
| PostgreSQL | localhost:5432 | DB access |

### 2.4 Chạy không dùng Docker

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start dev server
npm run dev

# Prisma Studio (xem database)
npm run prisma:studio
```

---

## 3. Security Scanning

### 3.1 npm audit (Local)

```bash
# Kiểm tra lỗ hổng dependencies
npm audit

# Chỉ hiện lỗi HIGH trở lên
npm audit --audit-level=high

# Tự động fix (nếu có thể)
npm audit fix
```

### 3.2 Trivy (Local)

```bash
# Cài Trivy
# Windows: choco install trivy
# Mac: brew install trivy
# Linux: xem https://aquasecurity.github.io/trivy

# Scan Docker image
trivy image uit-healthcare-api:latest

# Scan filesystem (phát hiện secrets)
trivy fs .

# Scan Dockerfile
trivy config Dockerfile
```

### 3.3 Semgrep (Local)

```bash
# Cài Semgrep
pip install semgrep

# Scan OWASP Top 10
semgrep --config p/owasp-top-ten .

# Scan Node.js patterns
semgrep --config p/nodejs .
```

---

## 4. Monitoring Stack

### 4.1 Kiến trúc

```
┌─────────────┐     ┌──────────────┐     ┌──────────┐
│  Backend    │ →   │  Prometheus  │ →   │ Grafana  │
│  /metrics   │     │  (scrape)    │     │ (visual) │
└─────────────┘     └──────────────┘     └──────────┘

┌─────────────┐     ┌──────────────┐     ┌──────────┐
│  Docker     │ →   │  Promtail    │ →   │  Loki    │ → Grafana
│  Containers │     │  (ship logs) │     │ (store)  │
└─────────────┘     └──────────────┘     └──────────┘
```

### 4.2 Custom Metrics

Backend expose các metrics tại `GET /metrics`:

| Metric | Type | Mô tả |
|---|---|---|
| `http_request_duration_seconds` | Histogram | Thời gian xử lý request |
| `http_requests_total` | Counter | Tổng số requests |
| `http_active_connections` | Gauge | Connections đang active |
| `nodejs_heap_size_used_bytes` | Gauge | Memory usage |
| `nodejs_eventloop_lag_seconds` | Gauge | Event loop latency |

### 4.3 Tạo Dashboard Grafana

1. Truy cập http://localhost:3000 → Login (admin/admin)
2. Vào **Dashboards** → **New Dashboard** → **Add Panel**
3. Chọn datasource **Prometheus**
4. Nhập query:
   - Request rate: `rate(http_requests_total[5m])`
   - Latency P95: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`
   - Error rate: `rate(http_requests_total{status_code=~"5.."}[5m])`
5. Xem Logs: vào **Explore** → chọn datasource **Loki** → query: `{container="backend"}`

---

## 5. Docker Commands Cheat Sheet

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f ocr

# Stop all
docker-compose down

# Stop + xóa volumes (reset data)
docker-compose down -v

# Chỉ rebuild 1 service
docker-compose build backend
docker-compose up -d --no-deps backend

# Exec vào container
docker-compose exec backend sh
docker-compose exec db psql -U postgres -d project_test
```

---

## 6. Triển khai Production

### 6.1 DigitalOcean

```bash
# Cài doctl
# Authenticate
doctl auth init

# Push image lên DO Container Registry
doctl registry login
docker tag uit-healthcare-api:latest registry.digitalocean.com/<registry>/api:latest
docker push registry.digitalocean.com/<registry>/api:latest
```

### 6.2 Kubernetes

```bash
# Apply manifests
kubectl apply -f k8s/deployment.yml

# Tạo secrets
kubectl create secret generic db-secret \
  --from-literal=username=postgres \
  --from-literal=password=<PASSWORD> \
  -n uit-healthcare

kubectl create secret generic backend-secret \
  --from-literal=database-url=<DATABASE_URL> \
  --from-literal=jwt-secret=<JWT_SECRET> \
  -n uit-healthcare

# Kiểm tra pods
kubectl get pods -n uit-healthcare
kubectl logs -f deployment/backend-api -n uit-healthcare
```

---

## 7. Troubleshooting

| Lỗi | Nguyên nhân | Cách sửa |
|---|---|---|
| `ECONNREFUSED :5432` | PostgreSQL chưa ready | Chờ health check hoặc restart `db` |
| `prisma generate` fail | `@prisma/client` chưa install | `npm ci` trước |
| `CORS blocked` | Origin không trong whitelist | Thêm URL vào `FRONTEND_URL` trong `.env` |
| Trivy timeout | Image quá lớn | Dùng `--timeout 10m` |
| Grafana 502 | Prometheus chưa start | Kiểm tra `docker-compose logs prometheus` |
