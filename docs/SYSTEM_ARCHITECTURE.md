# Sơ đồ Hệ thống - UIT Healthcare

## 1. Tổng quan Kiến trúc Hệ thống

```mermaid
graph TB
    subgraph "Client Layer"
        APP["📱 Android App<br/>(Kotlin)"]
        WEB_ADMIN["💻 Admin Panel<br/>(React + Vite)"]
        WEB_PATIENT["💻 Patient Portal<br/>(React + Vite)"]
    end

    subgraph "AWS Cloud"
        CF["🌐 CloudFront CDN"]
        S3["📦 S3 Static Hosting"]
        RDS[("🗄️ RDS PostgreSQL")]
        R53["🔗 Route 53 DNS"]
    end

    subgraph "DigitalOcean Droplet"
        NGINX["🔀 Nginx Reverse Proxy"]
        BACKEND["⚙️ Backend API<br/>(Node.js + Express)"]
        OCR["🔍 OCR Service<br/>(FastAPI + Python)"]
    end

    subgraph "External Services"
        MOMO["💳 MoMo Payment"]
        GG_VISION["👁️ Google Cloud Vision"]
    end

    R53 --> CF
    R53 --> NGINX
    APP --> NGINX
    WEB_ADMIN --> CF
    WEB_PATIENT --> CF
    CF --> S3
    NGINX --> BACKEND
    NGINX --> OCR
    BACKEND --> RDS
    BACKEND --> MOMO
    OCR --> GG_VISION
```

---

## 2. Kiến trúc Backend (Node.js)

```mermaid
graph TB
    subgraph "Entry Points"
        REQ["HTTP Request"]
    end

    subgraph "Middleware Layer"
        AUTH_MW["🔐 Auth Middleware"]
        RATE_LIMIT["⏱️ Rate Limiter"]
        CORS["🌐 CORS"]
        LOGGER["📝 Logger"]
    end

    subgraph "Router Layer"
        AUTH_ROUTE["/api/auth"]
        USER_ROUTE["/api/users"]
        DOCTOR_ROUTE["/api/doctors"]
        PATIENT_ROUTE["/api/patient"]
        APT_ROUTE["/api/appointments"]
        PAYMENT_ROUTE["/api/payments"]
        NOTIF_ROUTE["/api/notifications"]
        CARE_ROUTE["/api/care-profiles"]
        LOC_ROUTE["/api/locations"]
    end

    subgraph "Controller Layer"
        AUTH_CTRL["AuthController"]
        USER_CTRL["UserController"]
        DOCTOR_CTRL["DoctorController"]
        PATIENT_CTRL["PatientController"]
        APT_CTRL["AppointmentController"]
        PAYMENT_CTRL["PaymentController"]
        NOTIF_CTRL["NotificationController"]
    end

    subgraph "Service Layer"
        AUTH_SVC["AuthService"]
        APT_SVC["AppointmentService"]
        PAYMENT_SVC["PaymentService"]
        NOTIF_SVC["NotificationService"]
    end

    subgraph "Data Access Layer"
        PRISMA["Prisma ORM"]
    end

    REQ --> AUTH_MW --> RATE_LIMIT --> CORS --> LOGGER
    LOGGER --> AUTH_ROUTE & USER_ROUTE & DOCTOR_ROUTE & PATIENT_ROUTE & APT_ROUTE & PAYMENT_ROUTE & NOTIF_ROUTE & CARE_ROUTE & LOC_ROUTE

    AUTH_ROUTE --> AUTH_CTRL --> AUTH_SVC
    APT_ROUTE --> APT_CTRL --> APT_SVC
    PAYMENT_ROUTE --> PAYMENT_CTRL --> PAYMENT_SVC
    NOTIF_ROUTE --> NOTIF_CTRL --> NOTIF_SVC

    AUTH_SVC --> PRISMA
    APT_SVC --> PRISMA
    PAYMENT_SVC --> PRISMA
    NOTIF_SVC --> PRISMA
```

---

## 3. Database Schema (ER Diagram)

```mermaid
erDiagram
    USERS {
        int id PK
        string email UK
        string password
        string fullName
        string phone
        enum role "ADMIN, DOCTOR, PATIENT"
        datetime createdAt
        datetime updatedAt
    }

    DOCTORS {
        int id PK
        int userId FK
        string specialty
        string hospital
        int experience
        decimal consultationFee
        string bio
        float rating
    }

    PATIENTS {
        int id PK
        int userId FK
        date dateOfBirth
        enum gender
        string address
        string insuranceNumber
    }

    CARE_PROFILES {
        int id PK
        int patientId FK
        string fullName
        date dateOfBirth
        enum gender
        string relationship
    }

    DOCTOR_SLOTS {
        int id PK
        int doctorId FK
        date date
        time startTime
        time endTime
        boolean isAvailable
    }

    APPOINTMENTS {
        int id PK
        int patientId FK
        int doctorSlotId FK
        int careProfileId FK
        enum status "PENDING, CONFIRMED, COMPLETED, CANCELLED"
        enum paymentStatus "PENDING, PAID, REFUNDED"
        string notes
        datetime createdAt
    }

    PAYMENTS {
        int id PK
        int appointmentId FK
        decimal amount
        string transactionId
        enum method "MOMO, CARD, CASH"
        enum status "PENDING, SUCCESS, FAILED"
        datetime paidAt
    }

    NOTIFICATIONS {
        int id PK
        int userId FK
        string title
        string message
        enum type "APPOINTMENT, PAYMENT, INFO"
        boolean read
        datetime createdAt
    }

    LOCATIONS {
        int id PK
        string name
        string address
        string phone
        float latitude
        float longitude
    }

    USERS ||--o| DOCTORS : "is"
    USERS ||--o| PATIENTS : "is"
    USERS ||--o{ NOTIFICATIONS : "receives"
    PATIENTS ||--o{ CARE_PROFILES : "has"
    PATIENTS ||--o{ APPOINTMENTS : "books"
    DOCTORS ||--o{ DOCTOR_SLOTS : "has"
    DOCTOR_SLOTS ||--o{ APPOINTMENTS : "for"
    CARE_PROFILES ||--o{ APPOINTMENTS : "for"
    APPOINTMENTS ||--|| PAYMENTS : "has"
```

---

## 4. Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant A as API Server
    participant DB as Database

    Note over C,DB: Đăng ký
    C->>A: POST /api/auth/register
    A->>A: Validate & Hash Password
    A->>DB: Create User
    DB-->>A: User Created
    A->>A: Generate JWT
    A-->>C: 201 Created + Token

    Note over C,DB: Đăng nhập
    C->>A: POST /api/auth/login
    A->>DB: Find User by Email
    DB-->>A: User Data
    A->>A: Verify Password
    A->>A: Generate JWT (Access + Refresh)
    A-->>C: 200 OK + Tokens

    Note over C,DB: Request với Token
    C->>A: GET /api/users/me (+ Bearer Token)
    A->>A: Verify JWT
    A->>DB: Get User Data
    DB-->>A: User Data
    A-->>C: 200 OK + User Info

    Note over C,DB: Refresh Token
    C->>A: POST /api/auth/refresh
    A->>A: Validate Refresh Token
    A->>A: Generate New Access Token
    A-->>C: 200 OK + New Token
```

---

## 5. Appointment Booking Flow

```mermaid
sequenceDiagram
    autonumber
    participant P as Patient
    participant API as Backend API
    participant DB as Database
    participant N as Notification Service

    P->>API: GET /api/doctors?specialty=X
    API->>DB: Query Doctors
    DB-->>API: Doctor List
    API-->>P: List of Doctors

    P->>API: GET /api/appointments/slots/:doctorId
    API->>DB: Query Available Slots
    DB-->>API: Available Slots
    API-->>P: Slot Options

    P->>API: POST /api/appointments/book
    Note right of P: {doctorSlotId, careProfileId, notes}
    API->>DB: Check Slot Availability
    DB-->>API: Slot Available
    API->>DB: Create Appointment
    API->>DB: Mark Slot Unavailable
    DB-->>API: Appointment Created
    API->>N: Send Notification to Patient
    API->>N: Send Notification to Doctor
    API-->>P: 201 Created + Appointment Details
```

---

## 6. Payment Flow (MoMo Integration)

```mermaid
sequenceDiagram
    autonumber
    participant P as Patient
    participant API as Backend
    participant M as MoMo API
    participant DB as Database

    P->>API: POST /api/payments/momo
    Note right of P: {appointmentId}
    API->>DB: Get Appointment Details
    DB-->>API: Appointment Data
    API->>API: Generate Order Info
    API->>M: Create Payment Request
    M-->>API: Pay URL
    API-->>P: Redirect URL

    P->>M: Complete Payment on MoMo
    M->>API: IPN Callback (POST /api/payments/momo/ipn)
    Note right of M: {orderId, resultCode, transId}
    API->>API: Verify Signature
    API->>DB: Update Payment Status
    API->>DB: Update Appointment.paymentStatus
    API-->>M: 200 OK

    M->>P: Redirect to returnUrl
    P->>API: GET /payment-return?resultCode=0
    API-->>P: Payment Success Page
```

---

## 7. OCR Processing Flow

```mermaid
sequenceDiagram
    autonumber
    participant P as Patient Portal
    participant API as Backend
    participant OCR as OCR Service
    participant GV as Google Vision API

    P->>P: Select/Capture Image
    P->>OCR: POST /api/ocr/scan (multipart)
    Note right of P: FormData with image file
    OCR->>OCR: Validate Image
    OCR->>OCR: Preprocess Image
    OCR->>GV: Send to Google Vision
    GV-->>OCR: Raw Text Result
    OCR->>OCR: Parse & Extract Medications
    OCR-->>P: Extracted Data
    Note left of OCR: {text, medications[], confidence}
```

---

## 8. System Component Diagram

```mermaid
graph LR
    subgraph "Frontend — AWS S3 + CloudFront"
        A2["Patient Portal"]
        A3["Admin Panel"]
    end

    subgraph "Mobile"
        A1["Android App"]
    end

    subgraph "DigitalOcean Droplet — Docker Compose"
        B1["API Server"]
        B2["OCR Service"]
        B4["Nginx Proxy"]
        B5["Monitoring Stack"]
    end

    subgraph "AWS Managed Services"
        C1["RDS PostgreSQL"]
        C3["S3 Storage"]
        C4["CloudFront CDN"]
        C5["Route 53 DNS"]
    end

    subgraph "External APIs"
        D1["MoMo API"]
        D2["Google Vision"]
        D3["Firebase FCM"]
    end

    C5 --> C4
    C5 --> B4
    C4 --> C3
    A2 --> C4
    A3 --> C4
    A1 --> B4
    B4 --> B1
    B4 --> B2

    B1 --> C1
    B1 --> C3
    B1 --> D1
    B1 --> D3

    B2 --> D2
```

---

## 9. Deployment Architecture (DigitalOcean + AWS)

```mermaid
graph TB
    subgraph "Internet"
        USER["👤 Users / Mobile App"]
    end

    subgraph "AWS — Route 53"
        DNS["🔗 Route 53<br/>hutus.id.vn"]
    end

    subgraph "AWS — Static Hosting"
        CF["🌐 CloudFront CDN<br/>+ ACM SSL"]
        S3_WEB["📦 S3 Bucket<br/>Admin Panel + Patient Portal<br/>(Static Build)"]
    end

    subgraph "DigitalOcean — Droplet 4GB/2vCPU"
        subgraph "Docker Compose"
            NGINX["Nginx Reverse Proxy<br/>:80, :443 (Let's Encrypt)"]
            API["Backend API<br/>:4000"]
            OCR_SVC["OCR Service<br/>:8001"]
        end
        subgraph "Monitoring Stack"
            PROM["Prometheus :9090"]
            GRAF["Grafana :3000"]
            LOKI["Loki :3100"]
            PROMTAIL["Promtail"]
        end
    end

    subgraph "AWS — Managed Database"
        RDS[("🗄️ RDS PostgreSQL<br/>db.t3.micro<br/>Free Tier")]
    end

    subgraph "AWS — Storage"
        S3_FILES["📦 S3 Bucket<br/>Uploads / Files"]
    end

    USER --> DNS
    DNS -- "*.hutus.id.vn" --> CF
    DNS -- "api.hutus.id.vn" --> NGINX
    CF --> S3_WEB
    NGINX --> API
    NGINX --> OCR_SVC
    NGINX --> GRAF
    API --> RDS
    API --> S3_FILES
    PROM --> API
    PROMTAIL --> LOKI
```

---

## 10. Module Dependencies

```mermaid
graph TD
    subgraph "Patient Portal Modules"
        PP_AUTH["AuthContext"]
        PP_API["API Service"]
        PP_PAGES["Pages"]
        PP_COMP["Components"]
        PP_LAYOUT["Layouts"]
    end

    PP_PAGES --> PP_AUTH
    PP_PAGES --> PP_API
    PP_PAGES --> PP_COMP
    PP_PAGES --> PP_LAYOUT
    PP_LAYOUT --> PP_AUTH
    PP_API --> PP_AUTH

    subgraph "Backend Modules"
        BE_AUTH["Auth Module"]
        BE_USER["User Module"]
        BE_DOCTOR["Doctor Module"]
        BE_APT["Appointment Module"]
        BE_PAY["Payment Module"]
        BE_NOTIF["Notification Module"]
    end

    BE_APT --> BE_DOCTOR
    BE_APT --> BE_USER
    BE_APT --> BE_NOTIF
    BE_PAY --> BE_APT
    BE_NOTIF --> BE_USER
```

---

## 11. API Endpoints Overview

| Module | Endpoint | Method | Description |
|--------|----------|--------|-------------|
| **Auth** | `/api/auth/register` | POST | Đăng ký tài khoản |
| | `/api/auth/login` | POST | Đăng nhập |
| | `/api/auth/refresh` | POST | Làm mới token |
| **Users** | `/api/users/me` | GET | Lấy thông tin user hiện tại |
| | `/api/users/me` | PUT | Cập nhật thông tin |
| **Doctors** | `/api/doctors` | GET | Danh sách bác sĩ |
| | `/api/doctors/:id` | GET | Chi tiết bác sĩ |
| | `/api/doctors/specialties` | GET | Danh sách chuyên khoa |
| **Appointments** | `/api/appointments/slots/:doctorId` | GET | Lịch trống của bác sĩ |
| | `/api/appointments/book` | POST | Đặt lịch khám |
| | `/api/appointments/:id/cancel` | PUT | Hủy lịch hẹn |
| **Patient** | `/api/patient/profile` | GET/PUT | Hồ sơ bệnh nhân |
| | `/api/patient/appointments` | GET | Lịch hẹn của bệnh nhân |
| **Payments** | `/api/payments/momo` | POST | Tạo thanh toán MoMo |
| | `/api/payments/momo/ipn` | POST | MoMo callback |
| **Notifications** | `/api/notifications` | GET | Danh sách thông báo |
| | `/api/notifications/:id/read` | PUT | Đánh dấu đã đọc |
| **OCR** | `/api/ocr/scan` | POST | Quét đơn thuốc |

---

## 12. Technology Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Mobile** | Kotlin, Android SDK | Native Android app |
| **Web Frontend** | React 19, Vite, TailwindCSS | SPA applications |
| **Backend** | Node.js, Express.js | REST API server |
| **OCR** | Python, FastAPI | AI/ML processing |
| **Database** | PostgreSQL, Prisma ORM | Data persistence |
| **Payment** | MoMo API | Payment processing |
| **Cloud Vision** | Google Cloud Vision | OCR processing |
| **Compute** | DigitalOcean Droplet (4GB/2vCPU) | VPS chạy Docker Compose |
| **Managed DB** | AWS RDS PostgreSQL (Free Tier) | Cloud database |
| **Static Hosting** | AWS S3 + CloudFront | CDN cho frontend SPA |
| **DNS & SSL** | AWS Route 53 + ACM | Domain management |
| **Monitoring** | Prometheus, Grafana, Loki | Metrics & Logging |
| **Containerization** | Docker, Docker Compose, Nginx | Container runtime |
| **CI/CD** | GitHub Actions | Automated deployment |

---

## 13. Chi phí triển khai ước tính (4 tháng)

| Dịch vụ | Cloud | Chi phí/tháng | 4 tháng | Ghi chú |
|---------|-------|---------------|---------|----------|
| Droplet 4GB/2vCPU | DigitalOcean | $24 | $96 | Backend + OCR + Monitoring |
| RDS db.t3.micro | AWS | $0 | $0 | Free Tier 12 tháng |
| S3 (< 5GB) | AWS | $0 | $0 | Free Tier |
| CloudFront (< 1TB) | AWS | $0 | $0 | Free Tier |
| Route 53 | AWS | $0.50 | $2 | 1 hosted zone |
| **Tổng** | | **~$25** | **~$98** | Credit: DO $200 + AWS $200 |
