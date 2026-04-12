-- File SQL để setup database PostgreSQL
-- Chạy bằng lệnh: psql -U postgres -f setup-db.sql

-- Tạo database
CREATE DATABASE project_test;

-- Kết nối vào DB rồi chạy các lệnh bên dưới nếu cần tạo user thủ công:
-- psql -U postgres -d project_test

-- Tạo user mới
CREATE USER project WITH PASSWORD 'StrongPass!';

-- Cấp quyền kết nối và thao tác trên schema public
GRANT ALL PRIVILEGES ON DATABASE project_test TO project;
\connect project_test
GRANT USAGE, CREATE ON SCHEMA public TO project;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO project;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO project;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO project;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO project;

-- Kiểm tra
SELECT usename FROM pg_user WHERE usename = 'project';
