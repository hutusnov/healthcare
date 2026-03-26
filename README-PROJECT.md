# HƯỚNG DẪN SETUP PROJECT-MOBILE (WINDOWS)

---

## 0. Chuẩn bị trước trên máy Windows

Cần cài:

### 0.1. Node.js LTS

- Tải tại: https://nodejs.org  
- Cài xong, mở **CMD / PowerShell / Git Bash** và kiểm tra:

```bash
node -v
npm -v
```

---

### 0.2. Git

- Tải tại: https://git-scm.com  
- Kiểm tra:

```bash
git --version
```

---

### 0.3. MySQL

Cài **MySQL Community** và đảm bảo:

- Host: `localhost`  
- Port: `3306`  
- Có user `root` (hoặc user khác) + password.

---

## 1. Clone project về

Mở **terminal** (CMD / PowerShell / Git Bash) rồi chạy:

```bash
cd path/to/where/you/want

git clone https://github.com/<team>/<repo>.git

cd <repo>/BACK-END/PROJECT-TEST
```

---

## 2. Tạo database MySQL

Mở MySQL CLI:

```bash
mysql -u root -p
```

Trong MySQL, chạy:

```sql
CREATE DATABASE project_test
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Sau đó thoát:

```sql
EXIT;
```

---

## 3. Tạo file `.env` cho backend

Đang ở thư mục:

```text
Project-Mobile/BACK-END/PROJECT-TEST
```

Tạo file `.env` (dùng VSCode / Notepad đều được) với nội dung mẫu:

```env
# ============================
# Basic
# ============================
NODE_ENV=development
PORT=4000

# ============================
# Database (Local Development)
# ============================
# đổi 'password' thành mật khẩu MySQL thật
DATABASE_URL="mysql://root:password@localhost:3306/project_test"

# Nếu root không có password thì:
# DATABASE_URL="mysql://root@localhost:3306/project_test"

# ============================
# JWT
# ============================
JWT_SECRET=change_this_secret
JWT_EXPIRES=7d

# ============================
# CORS
# ============================
# web admin sẽ chạy ở localhost:5173
FRONTEND_URL=http://localhost:5173
ADMIN_PANEL_URL=http://localhost:5173

# ============================
# SMTP (Email – optional)
# ============================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="UIT HealthCare <your_email@gmail.com>"

# ============================
# MoMo Payment (TEST Mode)
# ============================
MOMO_PARTNER_CODE=MOMOQ25O20251019_TEST
MOMO_ACCESS_KEY=6dJ6XmcJfSkMNzCi
MOMO_SECRET_KEY=mHvV0D0UoIOLoVWmXCzdLEt6606WNmVC
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api

# Return URL cho frontend local
MOMO_RETURN_URL=http://localhost:5173/payment/return

# Notify URL cho backend local
MOMO_NOTIFY_URL=http://localhost:4000/api/payments/momo/notify
```

---

## 4. Cài dependency cho backend

Vẫn ở thư mục `BACK-END/PROJECT-TEST`:

```bash
# Cài dependency
npm install

# Hoặc nếu muốn strict theo package-lock:
# npm ci
```

---

## 5. Sync database bằng Prisma

```bash
# 1. Apply migration (tạo bảng)
npx prisma migrate dev

# 2. (optional) generate client – thường migrate đã tự làm, nhưng chạy lại cũng ok
npx prisma generate

# 3. (optional) seed data test
npm run seed
# script gọi prisma/seed.js, tuỳ project đã setup
```

> Nếu gặp lỗi kiểu `P1000 / P1001 / P1003` → gần như chắc chắn vấn đề là `DATABASE_URL` hoặc database chưa tạo.

---

## 6. Chạy backend API ở local

Có 2 cách:

### 6.1. Dev mode (khuyên dùng khi dev)

```bash
npm run dev
```

- Dùng **nodemon** → sửa code tự restart.  
- Server chạy ở: `http://localhost:4000`

### 6.2. Start bình thường

```bash
npm start
```

- Chạy `node src/server.js` (không auto reload).  
- Giữ terminal này mở để server chạy.  
- Nếu cần dừng: **Ctrl + C**.

---

## 7. Kiểm tra backend đã OK chưa

Mở trình duyệt hoặc Postman, gọi:

```http
GET http://localhost:4000/api/health
```

Nếu trả về JSON kiểu:

```json
{
  "status": "ok",
  "message": "API is running"
}
```

→ Backend chạy OK.

---

## 8. Setup web admin (admin-panel) trên local

Giờ mở **một terminal khác** (đừng tắt backend).  
Từ root project:

```bash
cd Project-Mobile/BACK-END/PROJECT-TEST/admin-panel
```

### 8.1. Tạo `.env` cho admin-panel

Đây là Vite app, nên biến môi trường phải bắt đầu bằng `VITE_`.  
Tạo file `.env` trong thư mục `admin-panel`:

```env
VITE_API_URL=http://localhost:4000/api
```

- Khi chạy local: dùng full URL + port như trên.  
- Lúc deploy nginx reverse proxy thì mới dùng `/api` như trên server.

### 8.2. Cài dependency cho admin-panel

Trong thư mục `admin-panel`:

```bash
npm install
# hoặc:
# npm ci   # nếu muốn strict theo package-lock
```

### 8.3. Chạy web admin ở dev mode

```bash
npm run dev
```

Vite sẽ in ra kiểu:

```text
VITE v5.x.x  ready in Xs
  ➜  Local:   http://localhost:5173/
```

Mở browser truy cập:

- http://localhost:5173

Lúc này web admin sẽ gọi backend qua `VITE_API_URL = http://localhost:4000/api`, khớp với backend đang chạy.

---

## 9. Setup server cho OCR

Vào thư mục:

```bash
cd Project_Mobile/OCR
```

### 9.1. Cài các thư viện cần thiết

```bash
pip install -r requirements.txt
```

### 9.2. Chạy server OCR

```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### 9.3. Test API OCR trên local

Mở trình duyệt truy cập:

- http://localhost:8001/docs

Tại đây có thể test các endpoint OCR.

---

## 10. Set up đường dẫn API cho Android Studio

Trong Android dự án, vào module:

```text
core:network
```

Trong code Java/Kotlin, tìm file **`ApiConfig`** (hoặc file cấu hình tương tự).  
File này sẽ chứa các URL trỏ tới server, dạng:

```text
http://<IP>:<PORT>
```

Giải thích:

- `IP`:
  - Là địa chỉ IP của máy bạn nếu muốn chạy app trên **điện thoại thật** (cùng mạng).  
  - Là `10.0.3.2` nếu chạy trên **máy ảo Genymotion**.  
- `PORT`:
  - `4000` cho backend **Node.js**.  
  - `8001` cho server **OCR**.

Ví dụ:

```text
http://192.168.1.10:4000
http://192.168.1.10:8001
```

hoặc trên Genymotion:

```text
http://10.0.3.2:4000
http://10.0.3.2:8001
```

Đảm bảo các URL trong `ApiConfig` trùng với IP/port backend và OCR bạn đang chạy.

---

## 11. Set up thư viện cho Android Studio

Trong Android Studio:

1. Mở project mobile.  
2. Ở góc trên bên phải, click **"Sync Project with Gradle Files"**.  

Android Studio sẽ sync và tải các dependency cần thiết cho project.  
Sau khi sync xong, có thể build & run app lên máy ảo hoặc điện thoại thật (nhớ cấu hình đúng IP/port như ở bước 10).

---

> Vậy là xong phần setup toàn bộ: backend (Node.js + MySQL + Prisma), web admin (Vite), server OCR (Python/FastAPI), và cấu hình Android app.
