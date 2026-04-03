# UIT Healthcare -- Mobile & Admin System

Hệ thống đặt lịch khám bệnh gồm:

-   **Mobile app** (Android): cho bệnh nhân đặt lịch, xem lịch hẹn, hồ
    sơ...
-   **Backend API** (Node.js + Express + Prisma + PostgreSQL): xử lý
    business, lưu dữ liệu.
-   **Web Admin Panel** (React + Vite + TailwindCSS): cho admin quản lý
    người dùng, bác sĩ, lịch hẹn...
-   **OCR Service** (Python + FastAPI): đọc thông tin từ ảnh CCCD và trả
    về JSON.

## 1. Tech stack

### Frontend

-   **Mobile**: Android (Android Studio, Kotlin/Java -- thư mục
    `APP-ANDROID/`)
-   **Admin web**: React 19, Vite 5, React Router, TailwindCSS, Axios --
    thư mục `BACK-END/PROJECT-TEST/admin-panel`

### Backend

-   **Node.js + Express**
-   **Prisma ORM**
-   **PostgreSQL**
-   **JWT auth**
-   **MoMo test payment**

### OCR Service

-   **Python 3.10+**
-   **FastAPI + Uvicorn**
-   **PaddleOCR**, **VietOCR**, OpenCV

## 2. Cấu trúc thư mục

``` txt
Project-Mobile/
├── APP-ANDROID/
├── BACK-END/
│   └── PROJECT-TEST/
│       ├── src/
│       ├── prisma/
│       ├── admin-panel/
│       ├── setup-db.sql
│       ├── .env.example
│       └── README.md
└── OCR/
    ├── main.py
    ├── ocr_services.py
    ├── data/, models/
    └── requirements.txt
```

## 3. Yêu cầu môi trường

-   Node.js \>= 18\
-   npm \>= 9\
-   PostgreSQL server\
-   Git

### Cho OCR

-   Python 3.10\
-   virtualenv hoặc venv

## 4. Chạy Backend + Admin Panel

### 4.1 Clone
git clone https://github.com/<your-org>/Project-Mobile.git
cd Project-Mobile/BACK-END/PROJECT-TEST

### 4.2 Tạo database PostgreSQL
Tạo DB:
CREATE DATABASE project_test;

Tạo user (nếu cần):
CREATE USER project WITH PASSWORD 'StrongPass!';
GRANT ALL PRIVILEGES ON DATABASE project_test TO project;

Import script (nếu cần):
psql -U project -d project_test -f setup-db.sql

### 4.3 Cấu hình backend (.env)

Tại thư mục BACK-END/PROJECT-TEST
# Windows PowerShell
copy .env.example .env

# macOS / Linux
cp .env.example .env

Mở file .env và chỉnh:
NODE_ENV=development
PORT=4000

DATABASE_URL="<database-url>"

JWT_SECRET=change_this_secret
JWT_EXPIRES=7d

FRONTEND_URL=http://localhost:5173
ADMIN_PANEL_URL=http://localhost:5173

# SMTP, MoMo… có thể giữ giá trị test trong .env.example

### 4.4 Cài dependecies và migrate DB

# đang ở BACK-END/PROJECT-TEST
npm install

# tạo bảng theo prisma schema
npx prisma migrate dev

# (tuỳ chọn) Seed data mẫu
npm run seed
# hoặc
node prisma/seed.js

### 4.5 Chạy backend

npm run dev        # dev mode (nodemon)
# hoặc
npm start          # chạy thường

### 4.6 Chạy admin panel (frontend)

cd admin-panel
npm install

Tạo file .env trong admin-panel/:
VITE_API_URL=http://localhost:4000/api

Chạy dev:
npm run dev

Truy cập: https://localhost:5173

## 5. OCR CCCD

### 5.1 Tạo venv & cài gói
cd OCR
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

pip install --upgrade pip
pip install fastapi uvicorn
pip install -r requirements.txt

### 5.2 Chạy server OCR
python -m uvicorn main:app --host 0.0.0.0 --port 8001


