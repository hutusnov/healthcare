# TỔNG HỢP SƠ ĐỒ HỆ THỐNG UIT HEALTHCARE (C4 Model & Tối ưu Layout)
## Phần 1: CI/CD Pipeline & Kiến trúc Ứng dụng

> **Lưu ý:** Các sơ đồ Mermaid dưới đây đã được tối ưu hóa theo chuẩn C4 Model (Abstraction - giảm bớt chi tiết thừa, gom nhóm bằng Black Box) để dễ dàng xuất ra dạng text cơ bản và làm bản nháp cho bạn vẽ lại trên Draw.io theo tỷ lệ khổ A4.

---

## 1. MÔ HÌNH THIẾT KẾ HỆ THỐNG CI/CD PIPELINE TÍCH HỢP DEVSECOPS

> **Định hướng vẽ Draw.io**: Sơ đồ thể hiện rõ 11 giai đoạn (Stages) của quy trình CI/CD. Khuyến nghị vẽ luồng dọc (Top-Down) và sử dụng chức năng Swimlane hoặc Group của Draw.io để phân tách các khu vực CI, Security, và CD.
> **Kỹ thuật trình bày**: Dùng layout xoay ngang khổ giấy (Landscape) trong file Word để sơ đồ không bị ép nhỏ.

```mermaid
flowchart TD
    DEV(["👨‍💻 Developer"]) -->|Push Code / Pull Request| GH["GitHub Repository"]

    subgraph PIPELINE ["CI/CD DevSecOps Pipeline"]
        direction TB

        subgraph CI ["① Continuous Integration — Song song"]
            direction LR
            BUILD["Lint · Build · Test<br>Backend · Patient Portal · Admin Panel · OCR"]
            INFRA["Terraform Validate AWS + OpenStack<br>GitOps Manifest Validate (ArgoCD/Kustomize)<br>(main & PR only)"]
        end

        subgraph SEC ["② Security Gates — Song song"]
            direction LR
            SAST["SonarCloud SAST<br>Quality Gate"]
            TRIVY["Trivy Container Scan<br>CRITICAL severity blocks pipeline"]
        end

        subgraph CD ["③ Continuous Deployment — Song song (push only)"]
            direction LR
            CD_BE["CD Backend<br>① Docker Build & Push → GHCR<br>② Deploy EC2 via AWS SSM<br>③ Healthcheck /api/health (retry 36×5s)"]
            CD_FE["CD Frontend<br>S3 Upload + CloudFront Invalidation"]
        end

        CD_MON["④ CD Monitoring (after Backend)"]
        NOTIFY(["⑤ Telegram Notification (always, after all jobs)"])
    end

    ARGOCD(["ArgoCD — K3s / OpenStack<br>⏱ Poll GitHub mỗi 3 phút<br>Manual sync only — không phụ thuộc pipeline"])

    GH --> BUILD
    GH --> INFRA
    BUILD --> SAST
    BUILD --> TRIVY
    SAST --> CD_BE
    SAST --> CD_FE
    TRIVY --> CD_BE
    TRIVY --> CD_FE
    INFRA --> CD_BE
    INFRA --> CD_FE
    CD_BE --> CD_MON
    CD_MON --> NOTIFY
    CD_FE --> NOTIFY
    GH -.->|Poll độc lập| ARGOCD
```

---

## 1b. CI/CD PIPELINE — DẠNG STAGE GATE (Tối giản, khổ A4 ngang)

> Cùng nội dung với Sơ đồ 1 nhưng theo bố cục chuẩn pipeline (trái → phải). Khuyến nghị dùng bản này trong báo cáo với khổ giấy Landscape.

```mermaid
flowchart LR
    DEV(["👨‍💻 Dev"]) -->|push / PR| GH["GitHub"]

    GH --> CI["① Lint · Build · Test\n× 4 services — song song"]
    GH -->|main & PR only| INFRA["① Infra Validate\nTerraform · GitOps"]

    CI & INFRA --> SEC["② Security Gate — song song\nSonarCloud SAST · Trivy Scan"]

    SEC -->|PR — stop| REVIEW(["✅ Validated\nkhông deploy"])
    SEC -->|push — continue| BE["③ Backend\nDocker → GHCR → SSM → EC2"]
    SEC -->|push — continue| FE["③ Frontend\nS3 + CloudFront Invalidate"]

    BE --> MON["CD Monitoring"]
    MON & FE --> NOTIFY(["④ Telegram · always"])

    GH -.->|poll / 3 min| ARGOCD(["ArgoCD\n(độc lập)"])
```

---

## 2. MÔ HÌNH TỔNG THỂ HỆ THỐNG UIT HEALTHCARE

> **Định hướng vẽ Draw.io**: Đây là hình quan trọng nhất. Chia 4 vùng: Client — AWS Public Cloud — OpenStack Private Cloud — DevSecOps. Dùng icon AWS/K8s cho từng service.

```mermaid
flowchart TD
    subgraph USERS ["👥 Người dùng"]
        direction LR
        APP(["📱 Mobile App\n(Android)"])
        PORTAL(["💻 Patient Portal\n(Web)"])
        ADMIN_WEB(["🖥️ Web Admin\n(Web)"])
        OPS(["🔧 DevOps / Admin"])
    end

    subgraph CF ["☁️ Cloudflare — htsnov.com"]
        direction LR
        DNS["DNS Only\napi · admin · healthcare"]
        CFTUNNEL["Cloudflare Tunnel\n(cf-proxied: true)\nargocd · grafana · prometheus\npgadmin · wazuh"]
    end

    subgraph AWS ["☁️ AWS Public Cloud (ap-southeast-1)"]
        direction TB
        CDN["CloudFront + S3\nadmin.htsnov.com\nhealthcare.htsnov.com"]
        ALB["Application Load Balancer\napi.htsnov.com"]
        BE["Backend API · Node.js\nEC2 :4000"]
        VPN_MON["aws-vpn-node\nWireGuard VPN\nPrometheus · Grafana · Alertmanager"]
    end

    subgraph WG ["🔐 WireGuard VPN Tunnel"]
        WT["10.8.0.2 (AWS) ↔ 10.8.0.1 (Lab)"]
    end

    subgraph OPENSTACK ["🖥️ OpenStack Private Cloud (UIT Lab)"]
        direction TB

        subgraph APP_SVC ["K3s · Application Services"]
            direction LR
            OCR["OCR Service\nFastAPI :8001"]
            ARGOCD_SVC["ArgoCD"]
        end

        subgraph DATA ["Data Services"]
            direction LR
            PG[("PostgreSQL")]
            REDIS[("Redis")]
            MQ(["RabbitMQ"])
        end

        subgraph OBS ["Monitoring & Security · K3s"]
            direction LR
            STACK["Grafana · Prometheus\nLoki · Alertmanager"]
            WAZUH["Wazuh IDS"]
            PGADMIN["pgAdmin"]
        end
    end

    subgraph DEVSECOPS ["⚙️ DevSecOps"]
        direction LR
        GHA["GitHub Actions"]
        TF["Terraform"]
        ANS["Ansible"]
    end

    APP & PORTAL & ADMIN_WEB -->|HTTPS| DNS
    DNS -->|api.htsnov.com| ALB --> BE
    DNS -->|static sites| CDN
    OPS -->|Zero Trust Auth| CFTUNNEL --> OBS
    CFTUNNEL --> ARGOCD_SVC
    BE <-->|WireGuard| VPN_MON <-->| |WG<-->| |APP_SVC
    BE -->|via WireGuard| PG & REDIS & MQ & OCR
    GHA -->|SSM Deploy| BE
    GHA -->|S3 Upload| CDN
    TF -->|Provision| AWS & OPENSTACK
    ANS -->|Configure| AWS & OPENSTACK
    ARGOCD_SVC -->|GitOps Sync| APP_SVC
```

---

## 3 & 4. MÔ HÌNH CLIENT (MOBILE/WEB) GIAO TIẾP BACKEND API

> **Định hướng vẽ Draw.io**: Gộp chung Web và Mobile thành Client để tiết kiệm diện tích. Thể hiện luồng gửi Request kèm Token và phân phối qua CDN -> ALB.

```mermaid
flowchart LR
    subgraph CLIENTS ["Client Applications"]
        WEB(["💻 Web Frontend<br>(React/Vite)"])
        APP(["📱 Mobile App<br>(Android)"])
    end

    CDN["Cloudflare DNS<br>→ CloudFront / ALB"]
    ALB["AWS ALB"]

    subgraph BACKEND ["Core Backend (EC2)"]
        API["Node.js API<br>(Verify JWT, CORS)"]
    end

    subgraph OPENSTACK ["OpenStack Lab (via WireGuard VPN)"]
        direction TB
        OCR_SVC["OCR Service<br>(FastAPI :8001)"]
        DB[("PostgreSQL")]
        CACHE[("Redis")]
        MQ(["RabbitMQ"])
    end

    WEB & APP -->|HTTPS + JWT| CDN
    CDN --> ALB --> API

    API -->|Query| DB
    API -->|Cache| CACHE
    API -->|Async task| MQ
    API -->|Forward image via VPN| OCR_SVC
    OCR_SVC -->|OCR result| API

    API -->|JSON Response| WEB & APP
```

---

## 5. MÔ HÌNH KIẾN TRÚC BACKEND API (Mức Component)

> **Định hướng vẽ Draw.io**: Zoom vào khối AWS EC2. Thể hiện kiến trúc High Availability (HA) với 2 Availability Zones (AZ).

```mermaid
flowchart TD
    ALB["Application Load Balancer<br>(healthcare-backend-tg)"]
    
    subgraph VPC ["AWS VPC (Production)"]
        direction TB
        
        subgraph AZ1 ["Availability Zone 1 (ap-southeast-1a)"]
            NODE1["EC2 Node 1<br>(Docker :4000)"]
        end
        
        subgraph AZ2 ["Availability Zone 2 (ap-southeast-1b)"]
            NODE2["EC2 Node 2<br>(Docker :4000)"]
        end
    end

    PG[("PostgreSQL<br>(OpenStack Lab — kết nối qua WireGuard VPN)")]

    ALB -->|Balance Load| NODE1
    ALB -->|Balance Load| NODE2

    NODE1 -->|WireGuard VPN| PG
    NODE2 -->|WireGuard VPN| PG
```

---

## 6. MÔ HÌNH XỬ LÝ OCR SERVICE (Luồng Bất Đồng Bộ Đề Xuất)

> **Định hướng vẽ Draw.io**: Sơ đồ này phản ánh thực tế mã nguồn hiện tại, là luồng Synchronous (đồng bộ). Client gửi thẳng ảnh vào API và đợi phản hồi.

```mermaid
flowchart LR
    BE(["Backend API<br>(EC2 — chuyển tiếp từ client)"])
    
    subgraph OPENSTACK ["OpenStack Private Cloud (ai-ocr-worker — 192.168.100.169)"]
        FASTAPI["FastAPI App<br>(OCR Service :8001)"]
        PIPELINE["OCR Pipeline<br>(PaddleOCR + VietOCR)"]
    end
    
    TMP[("Temp File<br>(OS Storage)")]
    
    BE -->|1. POST /ocr-cccd multipart/form-data<br>qua WireGuard VPN| FASTAPI
    FASTAPI -->|2. Validate ext + size| TMP
    FASTAPI -->|3. detect(img) — PaddleOCR PP-OCRv5_mobile_det| PIPELINE
    PIPELINE -->|4. recog() — crop region → VietOCR vgg_seq2seq| PIPELINE
    PIPELINE -->|5. extract_full_name / dob / gender / address| FASTAPI
    FASTAPI -->|6. JSON: full_name · date_of_birth · gender · country · address| BE
```

---
> **Mẹo triển khai**: Bạn hãy xuất code Mermaid này ra dạng text cơ bản, sau đó copy dán vào Draw.io (chức năng `Arrange > Insert > Advanced > Mermaid...`). Sau khi Draw.io sinh ra bộ khung, bạn được quyền tự do kéo thả các Node, thay các ô vuông mặc định bằng bộ Icon chuẩn của AWS, Kubernetes và OpenStack, thêm bảng chú giải (Legend) để thay cho các khối văn bản dài dòng. Chúc bạn hoàn thành báo cáo thật xuất sắc!
