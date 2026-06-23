# SƠ ĐỒ BÁO CÁO — UIT Healthcare (Hình 3.5 – 3.13)

> Phiên bản tối giản, tối ưu khổ A4. Nguồn chi tiết tham khảo tại SYSTEM_DIAGRAMS_PART1.md và SYSTEM_DIAGRAMS_PART2.md.

---

## Hình 3.5. Mô hình kiến trúc Backend API

```mermaid
flowchart LR
    CLIENT(["Client\n(Mobile / Web)"])

    subgraph API ["Backend API — Node.js (EC2 :4000)"]
        direction TB
        R["Routes\n(Express Router)"]
        M["Middleware\n(JWT Auth · CORS · Rate-limit · Validate)"]
        C["Controllers"]
        S["Service Layer"]
        O["Prisma ORM"]
    end

    PG[("PostgreSQL\n(OpenStack Lab)")]
    MOMO["MoMo API\n(External Payment)"]
    EMAIL["Email SMTP\n(Nodemailer)"]

    CLIENT --> R --> M --> C --> S
    S --> O --> PG
    S --> MOMO
    S --> EMAIL
```

---

## Hình 3.6. Mô hình xử lý OCR Service

```mermaid
flowchart LR
    BE(["Backend API\n(EC2)"])

    subgraph OCR ["OCR Service — FastAPI :8001 (ai-ocr-worker)"]
        direction LR
        A["Validate & Lưu ảnh tạm\n(kiểm tra ext · size · tempfile)"]
        B["Text Detection\n(PaddleOCR PP-OCRv5)"]
        C["Text Recognition per region\n(VietOCR vgg_seq2seq)"]
        D["Trích xuất & Chuẩn hóa\n(Tên · DOB · Giới tính · Quốc tịch · Địa chỉ)"]
    end

    BE -->|POST /ocr-cccd\nảnh qua WireGuard VPN| A
    A --> B --> C --> D
    D -->|JSON: full_name · date_of_birth\ngender · country · address| BE
```

---

## Hình 3.7. Mô hình hạ tầng Hybrid Cloud AWS – OpenStack

```mermaid
flowchart TD
    USER(["Người dùng\n(Mobile / Web)"])
    CF["Cloudflare DNS (DNS Only)\napi.htsnov.com → ALB\nadmin / healthcare.htsnov.com → CloudFront\nObservability → Cloudflare Tunnel"]

    subgraph AWS ["AWS Cloud (ap-southeast-1)"]
        direction LR
        ALB["Application Load Balancer\napi.htsnov.com"]
        BE["EC2 Backend\nNode.js :4000"]
        CDN["CloudFront + S3\nAdmin Panel · Patient Portal"]
        VPN["aws-vpn-node (10.8.0.2)\nWireGuard VPN\nPrometheus · Grafana · Alertmanager"]
    end

    subgraph OS ["OpenStack Private Cloud (UIT Lab — 192.168.100.x)"]
        direction LR
        K3SM["k3s-master-vpn (192.168.100.97)\nK3s Control Plane · WireGuard 10.8.0.1"]
        OCRI["ai-ocr-worker (192.168.100.169)\nOCR Service :8001"]
        DATAI["data-core-node (192.168.100.83)\nPostgreSQL · Redis · RabbitMQ"]
        MONI["Monitoring\nGrafana · Prometheus · Loki\nWazuh · pgAdmin · ArgoCD"]
    end

    USER --> CF
    CF --> ALB --> BE
    CF --> CDN
    BE <-->|WireGuard VPN| VPN
    VPN <-->|Encrypted Tunnel UDP 51820| K3SM
    BE -->|via WireGuard| OCRI & DATAI
    K3SM --> OCRI & DATAI & MONI
```

---

## Hình 3.8. Mô hình Kubernetes/K3s trong OpenStack

```mermaid
flowchart TB
    GH["GitHub Repository\n(deploy/gitops/ · deploy/argocd/)"]

    subgraph K3S ["K3s Cluster — OpenStack Private Cloud"]
        MASTER["k3s-master-vpn (192.168.100.97)\nControl Plane · WireGuard VPN Gateway · Cloudflare Tunnel"]

        subgraph W1 ["ai-ocr-worker (192.168.100.169)"]
            OCR_D["OCR Service :8001\nNamespace: uit-healthcare-private"]
        end

        subgraph W2 ["data-core-node (192.168.100.83) — Host Services"]
            DATA_H["PostgreSQL · Redis · RabbitMQ"]
        end

        subgraph NS_MON ["Namespace: monitoring"]
            MON_D["Grafana · Prometheus · Loki · Wazuh · pgAdmin"]
        end

        ARGOCD_D["ArgoCD\nNamespace: argocd"]
    end

    GH -->|Poll mỗi 3 phút| ARGOCD_D
    ARGOCD_D -->|GitOps Sync| OCR_D & MON_D
    MASTER --> W1 & NS_MON & ARGOCD_D
```

---

## Hình 3.9. Mô hình GitOps với ArgoCD

```mermaid
flowchart LR
    DEV(["Developer"])
    GH["GitHub Repository\ndeploy/gitops/\ndeploy/argocd/"]

    subgraph ARGOCD ["ArgoCD — K3s Cluster (App of Apps)"]
        ROOT["Root Application\n(uit-healthcare-root)"]
        APP1["uit-healthcare-openstack-runtime\n(OCR + Backend manifest)"]
        APP2["uit-healthcare-private-ocr\n(OCR — private namespace)"]
        APP3["uit-healthcare-monitoring\n(Grafana · Prometheus · Loki)"]
        APP4["uit-healthcare-aws-backend\n(Backend manifest — K3s)"]
    end

    GHCR["GHCR\nDocker Images (SHA tag)"]

    DEV -->|git push manifest| GH
    GH -->|Poll mỗi 3 phút| ROOT
    ROOT -->|App of Apps| APP1 & APP2 & APP3 & APP4
    GHCR -->|pull image| APP1 & APP2
```

---

## Hình 3.10. Mô hình Infrastructure as Code bằng Terraform

```mermaid
flowchart LR
    DEV(["Developer\n/ GitHub Actions"])

    subgraph TF ["Terraform Code (infra/)"]
        direction TB
        TF_AWS["terraform/ — AWS\nVPC · ALB · EC2 · S3 · CloudFront · IAM"]
        TF_OS["terraform-openstack/ — OpenStack\nNetwork · Subnet · Compute · Security Group"]
    end

    STATE["Remote State\nS3 Bucket + DynamoDB Lock"]

    subgraph CLOUD ["Cloud Resources"]
        direction LR
        AWS_R["AWS Infrastructure"]
        OS_R["OpenStack Infrastructure"]
    end

    DEV -->|fmt · validate · plan · apply| TF
    TF <-->|state| STATE
    TF_AWS --> AWS_R
    TF_OS --> OS_R
```

---

## Hình 3.11. Mô hình Ansible Configuration Management

```mermaid
flowchart LR
    CTRL(["Ansible Controller\n(Local Machine)"])

    subgraph PLAYS ["Playbooks (infra/ansible/playbooks/)"]
        direction TB
        AUDIT["audit.yml\nKiểm tra toàn hệ thống (20+ checks)"]
        WG_PB["wireguard.yml\nCấu hình WireGuard VPN"]
        PT_PB["promtail.yml\nCài đặt Promtail log agent"]
        PKG_PB["packages.yml\nCài đặt apt packages · Docker"]
    end

    subgraph AWS_NODES ["AWS Nodes"]
        direction TB
        N1["aws-vpn-node\n(10.0.5.40)\nProxyJump qua k3s-master-vpn"]
        N2["aws-backend-az1\n(10.0.138.155)\nBackend API :4000"]
        N3["aws-backend-az2\n(10.0.153.123)\nBackend API :4000"]
    end

    subgraph OS_NODES ["OpenStack Nodes"]
        direction TB
        N4["k3s-master-vpn\n(192.168.100.97)"]
        N5["ai-ocr-worker\n(192.168.100.169)"]
        N6["data-core-node\n(192.168.100.83)"]
    end

    CTRL -->|inventory/hosts.yml| PLAYS
    PLAYS -->|SSH trực tiếp| OS_NODES
    PLAYS -->|SSH double ProxyJump\nlocal → k3s-master → vpn-node → BE| AWS_NODES
```

---

## Hình 3.12. Mô hình Monitoring, Logging và Alerting

```mermaid
flowchart TB
    NODES(["Tất cả Nodes\nEC2 AWS · OpenStack VMs\n(k3s-master · ai-ocr-worker · data-core-node)"])

    subgraph METRICS ["Stack Metrics & Logging"]
        direction LR
        COL["Node Exporter :9100\nBackend /metrics · DB Exporters\nPromtail (Log Agent)"]
        PROM["Prometheus :9090"]
        LOKI["Loki (Logs)"]
        GRAFANA["Grafana :3000\nDashboard"]
        AM["Alertmanager :9093"]
    end

    subgraph DB_MGMT ["Quản trị Database"]
        PGADMIN["pgAdmin\n(K3s — monitoring namespace)\ntruy cập qua Cloudflare Tunnel"]
        PG[("PostgreSQL\n:5432")]
    end

    subgraph SEC ["Bảo mật hệ thống"]
        WAZUH["Wazuh Agent → Wazuh Manager\n(K3s — monitoring namespace)\nGiám sát: log · file integrity · alert\ntruy cập qua Cloudflare Tunnel"]
        CF["Cloudflare Security\nWAF · DDoS Protection · Bot Management\n(Bảo vệ lớp HTTP — bổ trợ Wazuh)"]
    end

    TELE(["Telegram Alert"])
    WEAK["⚠️ Điểm yếu\n2 stack chưa tập trung:\nAWS Docker Compose (aws-vpn-node)\nvs OpenStack K3s (monitoring ns)"]

    NODES --> COL
    COL --> PROM --> GRAFANA & AM
    COL --> LOKI --> GRAFANA
    AM -->|Cảnh báo| TELE
    NODES -->|Wazuh Agent| WAZUH
    PGADMIN -->|Quản trị| PG
    CF -.->|Bổ trợ bảo mật HTTP| WAZUH
```

---

## Hình 3.13. Mô hình Post-deploy Validation và Load Testing

```mermaid
flowchart LR
    DEPLOY(["Deploy Success\nSSM → EC2"])

    subgraph HC ["Health Check (cd-backend.yml)"]
        CURL["curl /api/health\nRetry 36 × 5s (tối đa 3 phút)"]
        PASS{Healthy?}
        OK(["Deploy OK\nALB Target Active"])
        FAIL(["Deploy Failed\ndocker logs --tail 120"])
    end

    subgraph LOAD ["Load Testing"]
        K6["k6 / ab\n50 VUs · 30s duration"]
        RES["Kết quả\nLatency · Error Rate · Throughput"]
    end

    MON(["Monitoring\nGrafana Dashboard"])

    DEPLOY --> CURL --> PASS
    PASS -->|Yes| OK
    PASS -->|No| FAIL
    OK --> K6 --> RES
    OK --> MON
```
