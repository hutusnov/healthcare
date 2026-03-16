# Gitflow Workflow — UIT Healthcare Team

> **Quy trình làm việc với Git cho nhóm phát triển**

---

## 1. Branching Strategy

```
main (production)
 │
 ├── develop (tích hợp)
 │    │
 │    ├── feature/ten-tinh-nang
 │    ├── feature/dat-lich-kham
 │    ├── feature/thanh-toan-momo
 │    │
 │    ├── bugfix/ten-bug
 │    │
 │    └── release/v1.0.0
 │
 └── hotfix/ten-hotfix (emergency fix on production)
```

### Branches chính

| Branch | Mục đích | Ai merge vào | Bảo vệ |
|---|---|---|---|
| `main` | Production code, luôn stable | Team Lead / PR review | ✅ Protected |
| `develop` | Tích hợp features, staging | Developer / PR review | ✅ Protected |

### Branches phụ

| Prefix | Tạo từ | Merge vào | Mục đích |
|---|---|---|---|
| `feature/*` | `develop` | `develop` | Tính năng mới |
| `bugfix/*` | `develop` | `develop` | Sửa bug trên develop |
| `release/*` | `develop` | `main` + `develop` | Chuẩn bị release |
| `hotfix/*` | `main` | `main` + `develop` | Fix khẩn cấp trên production |

---

## 2. Quy trình làm việc hàng ngày

### 2.1 Bắt đầu feature mới

```bash
# 1. Cập nhật develop
git checkout develop
git pull origin develop

# 2. Tạo feature branch
git checkout -b feature/ten-tinh-nang
# Ví dụ: feature/ocr-scan, feature/booking-payment, feature/user-profile

# 3. Code và commit
git add .
git commit -m "feat: mô tả ngắn gọn"

# 4. Push lên remote
git push origin feature/ten-tinh-nang

# 5. Tạo Pull Request → develop
# → Trên GitHub: New Pull Request
# → Base: develop ← Compare: feature/ten-tinh-nang
# → Assign reviewer
```

### 2.2 Review và Merge

```bash
# Reviewer kiểm tra code
# Approve hoặc Request Changes trên GitHub

# Sau khi approved → Merge (Squash and Merge recommended)
# → Xóa feature branch sau khi merge
```

### 2.3 Hotfix (sửa lỗi khẩn cấp trên production)

```bash
# 1. Tạo hotfix từ main
git checkout main
git pull origin main
git checkout -b hotfix/ten-loi

# 2. Sửa lỗi + commit
git add .
git commit -m "hotfix: mô tả lỗi"

# 3. Tạo PR → main (cần review nhanh)
git push origin hotfix/ten-loi

# 4. Sau khi merge vào main → merge ngược vào develop
git checkout develop
git merge main
git push origin develop
```

---

## 3. Commit Convention

### Format

```
<type>: <mô tả ngắn gọn bằng tiếng Việt hoặc tiếng Anh>

[thân commit - optional]

[footer - optional]
```

### Types

| Type | Emoji | Mô tả | Ví dụ |
|---|---|---|---|
| `feat` | ✨ | Tính năng mới | `feat: thêm chức năng đặt lịch khám` |
| `fix` | 🐛 | Sửa bug | `fix: sửa lỗi thanh toán MoMo trả kết quả sai` |
| `docs` | 📝 | Tài liệu | `docs: thêm hướng dẫn DevSecOps` |
| `style` | 💄 | UI/CSS | `style: cải thiện giao diện trang chủ` |
| `refactor` | ♻️ | Refactor code | `refactor: chuyển validation từ Joi sang Zod` |
| `perf` | ⚡ | Cải thiện hiệu suất | `perf: thêm pagination cho API users` |
| `test` | ✅ | Tests | `test: thêm unit test cho auth module` |
| `ci` | 👷 | CI/CD | `ci: thêm Trivy scan vào pipeline` |
| `chore` | 🔧 | Configs | `chore: cập nhật .env.example` |
| `security` | 🔒 | Bảo mật | `security: xóa skipVerify khỏi MoMo IPN` |

### Ví dụ commit tốt

```bash
# ✅ Tốt
git commit -m "feat: thêm chức năng quét CCCD bằng OCR"
git commit -m "fix: sửa memory leak trong OCRScan component"
git commit -m "security: xóa credentials khỏi .env.example"
git commit -m "ci: thêm Trivy Docker image scanning"

# ❌ Không tốt
git commit -m "update"
git commit -m "fix bug"
git commit -m "changes"
git commit -m "abc"
```

---

## 4. Pull Request (PR) Guidelines

### 4.1 Tạo PR

**Title format:** `[TYPE] Mô tả ngắn gọn`

```
[FEAT] Thêm chức năng quét CCCD bằng OCR
[FIX] Sửa lỗi thanh toán MoMo bypass
[REFACTOR] Chuyển validation sang Zod
```

### 4.2 PR Template

```markdown
## Mô tả
Mô tả ngắn gọn thay đổi gì và tại sao.

## Changes
- [ ] File 1: mô tả thay đổi
- [ ] File 2: mô tả thay đổi

## Testing
- [ ] Đã test local
- [ ] Đã kiểm tra trên mobile/web

## Screenshots (nếu có UI changes)
```

### 4.3 Review Checklist

Reviewer cần kiểm tra:
- [ ] Code chạy được không?
- [ ] Có security issue không?
- [ ] Có breaking change không?
- [ ] Commit messages đúng convention?
- [ ] Có cần update docs không?

---

## 5. Phân công và quản lý

### 5.1 Sprint Workflow

```
Sprint Planning → Development → Code Review → Testing → Release
    (Monday)     (Mon-Thu)       (Daily)      (Friday)  (Friday)
```

### 5.2 GitHub Project Board

Sử dụng GitHub Projects với các cột:

| Cột | Mô tả |
|---|---|
| **Backlog** | Tất cả tasks chưa làm |
| **To Do** | Tasks được assign cho sprint hiện tại |
| **In Progress** | Đang code (có branch) |
| **In Review** | PR đã tạo, đang chờ review |
| **Done** | Đã merge vào develop |

### 5.3 Phân nhánh theo thành viên

```bash
# Ví dụ phân công Sprint 1:
# Thành viên A: Backend booking
git checkout -b feature/booking-api

# Thành viên B: Frontend patient portal
git checkout -b feature/patient-portal-ui

# Thành viên C: OCR integration
git checkout -b feature/ocr-integration

# Thành viên D: Payment + Notification
git checkout -b feature/payment-momo
```

---

## 6. CI/CD Integration

### Khi nào pipeline chạy?

| Action | Trigger | Stages chạy |
|---|---|---|
| Push to `feature/*` | Không tự động | Dev tự test local |
| PR → `develop` | ✅ Tự động | SAST + BUILD |
| Push to `main` | ✅ Tự động | SAST + BUILD + DOCKER + TRIVY + DEPLOY |

### Nếu pipeline fail?

1. Xem logs trên GitHub Actions tab
2. Fix lỗi trên branch hiện tại
3. Push commit mới → pipeline chạy lại tự động

---

## 7. Quick Reference

```bash
# === Daily Commands ===
git status                          # Xem trạng thái
git pull origin develop             # Cập nhật develop
git checkout -b feature/xxx         # Tạo branch mới
git add . && git commit -m "..."    # Commit
git push origin feature/xxx         # Push

# === Sync với develop ===
git checkout feature/xxx
git merge develop                   # Merge develop vào feature
# hoặc
git rebase develop                  # Rebase (cleaner history)

# === Xem branch ===
git branch                          # Local branches
git branch -r                       # Remote branches
git branch -d feature/xxx           # Xóa branch local
git push origin --delete feature/xxx # Xóa branch remote

# === Undo ===
git stash                           # Tạm cất changes
git stash pop                       # Lấy lại changes
git reset --soft HEAD~1             # Undo commit cuối (giữ changes)
git checkout -- <file>              # Bỏ changes cho file
```
