# CÁC SƠ ĐỒ DYNAMIC VIEW (SEQUENCE DIAGRAMS)
Dùng để thay thế cho các sơ đồ luồng (Flowchart) trong báo cáo nhằm tăng tính chuyên nghiệp.

## 1. MÔ HÌNH CI/CD PIPELINE (Thay cho Sơ đồ 1)
Thể hiện rõ ràng 11 bước Pipeline tương tác với các hệ thống bên ngoài theo thứ tự thời gian.

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant GH as GitHub Actions
    participant SAST as SonarCloud
    participant SCAN as Trivy
    participant REG as GHCR (Registry)
    participant EC2 as AWS EC2 (SSM)
    participant FE as S3 / CloudFront
    participant NOTIFY as Telegram

    Dev->>GH: 1. Push Code / Pull Request
    GH->>GH: 2. Detect changed paths
    
    rect rgb(235, 245, 255)
    Note over GH: 3, 6, 7. Continuous Integration
    GH->>GH: Build & Test (Code)
    GH->>GH: Infra Validation (Terraform, Ansible)
    GH->>GH: GitOps Manifest Validation
    end
    
    rect rgb(255, 240, 240)
    Note over GH, SCAN: 4, 5. Security Gates
    GH->>SAST: Static Code Analysis
    SAST-->>GH: Quality Gate Status
    GH->>SCAN: Security Scan (Container & Config)
    SCAN-->>GH: Vulnerability Report
    end
    
    GH->>REG: 8. Build & Push Docker Image
    
    rect rgb(235, 255, 235)
    Note over GH, FE: 9, 10. Continuous Deployment — Song song (push only)
    GH->>REG: 9a. Build & Push Docker Image (SHA tag)
    REG-->>GH: Image ready
    GH->>EC2: 9b. Deploy via AWS SSM RunShellScript
    EC2->>EC2: docker compose up + Healthcheck /api/health
    EC2-->>GH: Deploy Success / Fail
    GH->>FE: 9c. Upload S3 + Invalidate CloudFront
    FE-->>GH: Done
    end
    
    GH->>NOTIFY: 10. Send Telegram Notification (always)
    
    Note over GH,REG: ArgoCD (K3s/OpenStack) hoạt động độc lập — poll GitHub mỗi 3 phút, manual sync
```

---

## 2. MÔ HÌNH CLIENT GIAO TIẾP API (Thay cho Sơ đồ 3 & 4)
Tách bạch hoàn toàn luồng gửi dữ liệu chữ (về AWS) và luồng gửi ảnh nặng (về OpenStack).

```mermaid
sequenceDiagram
    autonumber
    actor Client as Web / Mobile App
    participant CDN as Cloudflare DNS → ALB
    participant API as Node.js Backend (EC2)
    participant DB as PostgreSQL (OpenStack)
    participant OCR as OCR Service (OpenStack)

    rect rgb(240, 248, 255)
    Note over Client, DB: Luồng nghiệp vụ chính
    Client->>CDN: Request + JWT Token
    CDN->>API: Forward (ALB → EC2)
    API->>API: Verify Token & CORS
    API->>DB: Query (via WireGuard VPN)
    DB-->>API: Dữ liệu
    API-->>Client: JSON Response
    end

    rect rgb(250, 240, 255)
    Note over Client, OCR: Luồng OCR — Backend làm proxy
    Client->>CDN: POST /api/ocr (ảnh CCCD)
    CDN->>API: Forward
    API->>OCR: Forward image (via WireGuard VPN)
    OCR->>OCR: Detect & Recognize
    OCR-->>API: JSON (Tên, DOB, Địa chỉ)
    API-->>Client: JSON Response
    end
```

---

## 3. MÔ HÌNH XỬ LÝ BÊN TRONG OCR SERVICE (Thay cho Sơ đồ 6)
Nhờ Sequence Diagram, người chấm bài sẽ thấy rõ vòng đời của tấm ảnh từ lúc bay vào server đến lúc bị xóa đi (Cleanup).

```mermaid
sequenceDiagram
    autonumber
    actor Client as Web / Mobile
    participant API as FastAPI (:8001)
    participant TMP as OS Storage (Disk)
    participant PIP as AI Pipeline

    Client->>API: Upload Ảnh (POST /ocr-cccd)
    API->>API: Validate định dạng & dung lượng (<10MB)
    
    API->>TMP: Lưu tạm ảnh ra ổ cứng
    TMP-->>API: Trả về File Path
    
    API->>PIP: Đẩy File Path vào Pipeline
    
    Note over PIP: 1. Text Detection (PaddleOCR)
    PIP->>PIP: Tìm tọa độ khung chữ (Bounding boxes)
    
    Note over PIP: 2. Text Recognition (VietOCR)
    PIP->>PIP: Cắt ảnh con & Nhận dạng chữ cái
    
    PIP-->>API: Trả về danh sách Text thô
    
    API->>API: Trích xuất Regex (Họ tên, Ngày sinh, Quê quán)
    
    API->>TMP: Lệnh Xóa file ảnh tạm (Cleanup)
    API-->>Client: Trả về JSON định dạng chuẩn
```
