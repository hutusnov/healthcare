# OpenStack 3-Node Build Log

## Mục đích file này

File này tổng hợp đầy đủ những gì đã làm trong quá trình dựng hệ thống Healthcare trên mô hình 3 node OpenStack:

- `k3s-master-vpn`
- `data-core-node`
- `ai-ocr-worker`

Nó được viết để:

- đọc lại toàn bộ quá trình đã làm
- hiểu vì sao từng bước được thực hiện
- có thể tự làm lại sau này
- dùng làm tài liệu handover / báo cáo tiến độ

Tài liệu này bám theo kiến trúc 3 node OpenStack đã chốt:

- `k3s-master-vpn`: K3s master + bastion + gateway
- `data-core-node`: PostgreSQL + Redis + RabbitMQ
- `ai-ocr-worker`: K3s worker, chạy OCR workload

Không tính phần AWS hybrid trong tài liệu này. Tài liệu này chỉ ghi lại hệ thống 3 node OpenStack đã triển khai thực tế.

---

## 1. Topology chốt cuối cùng

### 1.1 Node và vai trò

| Node | Vai trò |
| --- | --- |
| `k3s-master-vpn` | K3s master, bastion/jump host, gateway có Floating IP |
| `data-core-node` | Data layer riêng: PostgreSQL, Redis, RabbitMQ |
| `ai-ocr-worker` | K3s worker node, chạy OCR workload |

### 1.2 Nguyên tắc kiến trúc

- Chỉ `k3s-master-vpn` được public ra ngoài qua Floating IP.
- `data-core-node` và `ai-ocr-worker` chỉ có private IP trong `healthcare-private-net`.
- `API` và `AI Worker/OCR` là workload trong K3s.
- `PostgreSQL`, `Redis`, `RabbitMQ` không chạy trong K3s mà chạy riêng trên `data-core-node`.

### 1.3 Kết luận quan trọng về topology

- Backend **không được** chuyển sang `data-core-node`.
- `data-core-node` là data layer, không phải app node.
- Backend là pod trong K3s.
- OCR là pod trong K3s và được ghim trên `ai-ocr-worker`.

### 1.4 Sơ đồ kiến trúc hiện tại

```mermaid
flowchart TB
    Internet((Internet))
    FIP[Floating IP]
    Master[k3s-master-vpn<br/>K3s control-plane<br/>Bastion / Gateway<br/>Private IP: 192.168.100.97]
    Data[data-core-node<br/>PostgreSQL<br/>Redis<br/>RabbitMQ<br/>Private IP: 192.168.100.83]
    Worker[ai-ocr-worker<br/>K3s worker<br/>backend-api x2<br/>ocr-service x1<br/>Private IP: 192.168.100.169]

    Internet --> FIP --> Master
    Master --- Data
    Master --- Worker
```

---

## 2. Những gì đã xác định từ đầu

### 2.1 Cấu hình VM

| Instance | Flavor | Role |
| --- | --- | --- |
| `k3s-master-vpn` | `D30.m2` | K3s master + VPN gateway |
| `data-core-node` | `D60.l4` | DB/Redis/RabbitMQ |
| `ai-ocr-worker` | `D60.xl8` | OCR / AI worker |

### 2.2 Mạng và bảo mật

- Network: `healthcare-private-net`
- Subnet: `192.168.100.0/24`
- Router: `healthcare-router`
- Security group:
  - `SG-Gateway` cho `k3s-master-vpn`
  - `SG-Internal` cho `data-core-node`, `ai-ocr-worker`

### 2.3 Kết quả tầng hạ tầng

Đã có:

- private network
- bastion flow
- SSH hardening
- K3s cluster lên
- data layer lên

---

## 3. K3s cluster đã tạo như thế nào

### 3.1 K3s master

Trên `k3s-master-vpn`, K3s server đã được cài đặt.

Ý nghĩa:

- Node này giữ vai trò control-plane
- Nhưng workload không bắt buộc phải chạy trên nó
- Nó có thể quản lý cluster, áp manifest, rollout app

### 3.2 Worker

Trên `ai-ocr-worker`, K3s agent đã join vào master.

Ý nghĩa:

- Đây là worker node duy nhất trong cluster hiện tại
- OCR service được schedule lên đây
- Backend cũng có thể được schedule lên đây, vì đây là worker duy nhất

### 3.3 Data node

`data-core-node` không join vào K3s.

Ý nghĩa:

- Nó đứng ngoài cluster
- Chỉ chạy dịch vụ dữ liệu
- Backend và OCR trong K3s sẽ kết nối tới nó bằng private IP

---

## 4. Vấn đề dung lượng volume và cách xử lý

Đây là một trong những phần quan trọng nhất đã gặp trong quá trình dựng hệ thống.

### 4.1 Vấn đề ban đầu

Ban đầu cả 3 node đều có boot volume quá nhỏ:

- `data-core-node`: `4 GiB`
- `ai-ocr-worker`: `4 GiB`
- `k3s-master-vpn`: `4-6 GiB`

Hậu quả:

- `data-core-node` không kéo nổi image Docker
- `k3s-master-vpn` bị full disk, K3s API chết

### 4.2 Triệu chứng trên `data-core-node`

Khi chạy `docker compose up -d`, gặp lỗi:

- `no space left on device`

Kiểm tra:

```bash
df -h
sudo du -sh /var/lib/docker
sudo du -sh /var/lib/containerd
```

Kết quả cho thấy root filesystem chỉ còn vài chục MB.

### 4.3 Cách xử lý giai đoạn đầu

Đã tăng volume trong Horizon:

- `data-core-node` -> `20GiB`
- `ai-ocr-worker` -> `20GiB`
- `k3s-master-vpn` -> `6GiB`

### 4.4 Sau khi extend volume, guest OS chưa nhận

Cần:

- reboot / power cycle
- `growpart`
- `resize2fs`

Lệnh đã dùng trên `data-core-node`:

```bash
sudo apt update
sudo apt install -y cloud-guest-utils
sudo growpart /dev/vda 1
sudo resize2fs /dev/vda1
lsblk
df -h
```

Lệnh đã dùng trên `k3s-master-vpn`:

```bash
lsblk
sudo TMPDIR=/run growpart /dev/vda 1
sudo resize2fs /dev/vda1
df -h
```

Lý do dùng `TMPDIR=/run`:

- root filesystem full
- `growpart` không tạo được temp dir trong `/tmp`
- `/run` là tmpfs còn chỗ trong RAM

### 4.5 Tăng thêm disk cho `k3s-master-vpn`

Sau đó `k3s-master-vpn` vẫn quá sát ngưỡng đầy disk, nên đã tăng thêm `4GB`.

Kết quả:

- disk `vda` lên `10G`
- partition root được resize lại
- `/dev/vda1` lên khoảng `8.7G`
- mức dùng giảm còn khoảng `56%`

### 4.6 Kết luận về disk

- `data-core-node` đủ chỗ cho data layer
- `k3s-master-vpn` ổn hơn sau khi tăng lên `10G`
- `ai-ocr-worker` vẫn cần theo dõi disk vì image OCR khá nặng

---

## 5. Dựng data layer trên `data-core-node`

### 5.1 Mục tiêu

Node 2 chạy:

- PostgreSQL
- Redis
- RabbitMQ

Node 2 không chạy K3s.

### 5.2 Cài Docker

Đã cài Docker theo repo chính chủ, không dùng `docker.io` distro package.

Lệnh đã dùng:

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
newgrp docker
```

### 5.3 Tạo stack data layer

Đã tạo:

```bash
mkdir -p ~/healthcare-data
cd ~/healthcare-data
nano docker-compose.yml
```

Nội dung stack gồm:

- `postgres:16-alpine`
- `redis:7-alpine`
- `rabbitmq:3-management`

### 5.4 Kiểm tra kết nối

Đã test trên `data-core-node`:

```bash
nc -zv 127.0.0.1 5432
nc -zv 127.0.0.1 6379
nc -zv 127.0.0.1 5672
```

Đã test từ `ai-ocr-worker`:

```bash
nc -zv 192.168.100.83 5432
nc -zv 192.168.100.83 6379
nc -zv 192.168.100.83 5672
```

Kết quả:

- PostgreSQL reachable
- Redis reachable
- RabbitMQ reachable

### 5.5 Thông tin DB thật trên Node 2

Lệnh:

```bash
cd ~/healthcare-data && docker compose exec postgres printenv | grep POSTGRES_
```

Kết quả:

- `POSTGRES_USER=project`
- `POSTGRES_PASSWORD=StrongPass123!`
- `POSTGRES_DB=project_test`

Đây là thông tin rất quan trọng để đồng bộ secret K3s.

---

## 6. Đưa backend và OCR lên K3s

### 6.1 Trạng thái repo và branch

Đã xác nhận:

- làm việc trên `develop`
- commit và push các thay đổi lên `origin/develop`

Một số commit chính ở giai đoạn đầu:

- `chore: checkpoint current develop state`
- `ci: push backend and ocr images to ghcr`
- `k8s: align backend and ocr placement with topology`

### 6.2 Điều chỉnh manifest K8s

Đã sửa `BACK-END/PROJECT-TEST/k8s/deployment.yml` theo hướng:

- bỏ Postgres khỏi K3s
- giữ `backend-api` trong K3s
- giữ `ocr-service` trong K3s
- `ocr-service` được ghim trên `ai-ocr-worker`
- image dùng từ GHCR, không dùng local image nữa

### 6.3 Label node OCR

Đã label worker node:

```bash
sudo kubectl label node ai-ocr-worker workload-role=ocr
```

### 6.4 Tạo namespace và secret

Đã tạo namespace:

```bash
sudo kubectl create namespace uit-healthcare
```

Đã tạo secret backend:

```bash
sudo kubectl -n uit-healthcare create secret generic backend-secret \
  --from-literal=database-url='postgresql://project:...@192.168.100.83:5432/project_test' \
  --from-literal=jwt-secret='...'
```

Đã tạo secret OCR:

```bash
sudo kubectl -n uit-healthcare create secret generic ocr-secret \
  --from-literal=api-key='...'
```

### 6.5 Apply manifest

Do file manifest nằm trên máy local, đã `scp` lên `k3s-master-vpn`.

Lệnh trên Windows:

```powershell
scp C:\Users\Admin\Desktop\healthcare\BACK-END\PROJECT-TEST\k8s\deployment.yml ubuntu@192.168.120.73:~
```

Apply trên master:

```bash
sudo kubectl apply -f ~/deployment.yml
```

### 6.6 Lỗi ImagePullBackOff

Ban đầu pod lỗi:

- `ErrImagePull`
- `ImagePullBackOff`

Nguyên nhân:

- manifest cũ dùng image local:
  - `uit-healthcare-api:latest`
  - `uit-healthcare-ocr:latest`
- cluster không có các image này

### 6.7 Chuyển sang hướng DevSecOps cơ bản

Đã chuyển workflow sang:

- GitHub Actions
- build image
- push image lên `ghcr.io`
- K3s pull từ GHCR

Kết quả:

- `Docker Build Push and Trivy Scan` đã success

---

## 7. Lỗi K3s bị chết do full disk trên master

### 7.1 Triệu chứng

Khi chạy:

```bash
kubectl label node ai-ocr-worker workload-role=ocr
```

bị lỗi:

- `The connection to the server 127.0.0.1:6443 was refused`

### 7.2 Kiem tra

```bash
sudo systemctl status k3s
sudo journalctl -u k3s -n 50 --no-pager
df -h
lsblk
```

Log cho thấy:

- `Eviction manager`
- `ephemeral-storage`
- không đủ chỗ để chạy control plane

### 7.3 Xử lý

Sau khi resize root filesystem, đã restart K3s:

```bash
sudo systemctl restart k3s
sudo kubectl get nodes
```

Kết quả:

- `k3s-master-vpn`: `Ready`
- `ai-ocr-worker`: `Ready`

---

## 8. Test backend và OCR trên cluster

### 8.1 Test health backend

```bash
sudo kubectl -n uit-healthcare port-forward svc/backend-api 4000:4000
curl http://127.0.0.1:4000/api/health
```

Kết quả:

```json
{"success":true,"message":"Server is running"}
```

### 8.2 Test health OCR

```bash
sudo kubectl -n uit-healthcare port-forward svc/ocr-service 8001:8001
curl http://127.0.0.1:8001/health
```

Kết quả:

```json
{"status":"ok","auth_enabled":true}
```

### 8.3 Test endpoint backend có dùng DB

```bash
curl http://127.0.0.1:4000/api/public/stats
```

Ban đầu trả:

```json
{"success":false,"message":"Internal server error"}
```

Điều này chứng minh:

- backend đã chạy
- nhưng DB schema/chứng thực vẫn chưa đúng

---

## 9. Sửa secret backend để kết nối DB đúng

### 9.1 Lỗi ban đầu

Backend log báo:

- `Authentication failed against database server`

Nguyên nhân:

- secret K3s đang dùng password sai
- local password và cloud password khác nhau

### 9.2 Mật khẩu local và cloud khác nhau

- local nhớ: `Chophuhai130423@`
- cloud DB thật: `StrongPass123!`

### 9.3 Tạo lại `backend-secret`

```bash
sudo kubectl -n uit-healthcare delete secret backend-secret
sudo kubectl -n uit-healthcare create secret generic backend-secret \
  --from-literal=database-url='postgresql://project:StrongPass123%21@192.168.100.83:5432/project_test' \
  --from-literal=jwt-secret='Chophuhai130423@'
```

Lưu ý:

- `!` trong password đã được encode thành `%21`

### 9.4 Rollout lại backend

```bash
sudo kubectl -n uit-healthcare rollout restart deployment/backend-api
sudo kubectl -n uit-healthcare get pods -l app=backend-api
```

Kết quả:

- pod backend mới lên bình thường

---

## 10. Chạy Prisma migrate vào DB Node 2

### 10.1 Vấn đề

Sau khi sửa password, log backend báo:

- `The table public.User does not exist`

Ý nghĩa:

- backend đã vào được DB
- nhưng DB chưa có schema

### 10.2 Chốt nơi chạy migrate

Đã chốt dùng `k3s-master-vpn` để chạy migrate vì:

- đã có source `PROJECT-TEST`
- chạm được `192.168.100.83`
- vẫn đúng topology

Điều này **không** có nghĩa là chuyển backend sang Node 2.

### 10.3 Lệnh migrate

```bash
cd ~/PROJECT-TEST && chmod +x node_modules/.bin/prisma
cd ~/PROJECT-TEST && DATABASE_URL='postgresql://project:StrongPass123%21@192.168.100.83:5432/project_test' npx prisma migrate deploy
```

Kết quả:

- migration `20260317091507_init` đã apply thành công

---

## 11. Xác nhận backend đã đọc được DB thật

Sau khi migrate xong:

```bash
curl http://127.0.0.1:4000/api/public/stats
```

Kết quả:

```json
{"success":true,"message":"OK","data":{"doctorCount":0,"patientCount":0,"appointmentCount":0,"averageRating":0}}
```

Ý nghĩa:

- backend chạy
- backend kết nối DB thật trên `data-core-node`
- schema đã có
- endpoint dùng Prisma đã hoạt động

---

## 12. Seed dữ liệu mẫu và test patient flow

### 12.1 Lỗi seed ban đầu

Ban đầu chạy:

```bash
DATABASE_URL='postgresql://project:StrongPass123%21@192.168.100.83:5432/project_test' node prisma/seed.js
```

Gặp lỗi:

- `doctorId is missing`

Nguyên nhân:

- `seed.js` dùng `doctorProfile.id`
- schema hiện tại dùng `DoctorProfile.userId`

### 12.2 Đã sửa `seed.js`

Đã sửa theo hướng:

- đổi `doctorProfile.id` -> `doctorProfile.userId`
- thêm `skipDuplicates`
- seed thêm:
  - `admin@demo.local`
  - `doctor@demo.local`
  - `patient@demo.local`
  - `PatientProfile`
  - `CareProfile`
  - `Appointment` demo
  - `Payment` demo

### 12.3 Chạy lại seed thành công

```bash
cd ~/PROJECT-TEST
DATABASE_URL='postgresql://project:StrongPass123%21@192.168.100.83:5432/project_test' node prisma/seed.js
```

Lệnh chạy thành công, không báo lỗi.

### 12.4 Kiểm tra lại qua stats

```bash
curl http://127.0.0.1:4000/api/public/stats
```

Kết quả:

```json
{"success":true,"message":"OK","data":{"doctorCount":1,"patientCount":1,"appointmentCount":1,"averageRating":0}}
```

### 12.5 Test patient flow qua JWT

Login:

```bash
curl -X POST http://127.0.0.1:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@demo.local","password":"Patient@123"}'
```

Sau đó test tiếp:

```bash
curl http://127.0.0.1:4000/api/patient/profile \
  -H "Authorization: Bearer <token>"
```

```bash
curl http://127.0.0.1:4000/api/patient/appointments \
  -H "Authorization: Bearer <token>"
```

```bash
curl http://127.0.0.1:4000/api/patient/appointments/paid \
  -H "Authorization: Bearer <token>"
```

Kết luận:

- patient profile đọc được
- appointment demo đọc được
- payment demo đọc được

Lưu ý:

- route hiện tại là `/api/patient`
- không phải `/api/patients`

---

## 13. Test OCR thật và fix OCR runtime

### 13.1 OCR health ban đầu vẫn OK

```bash
curl http://127.0.0.1:8001/health
```

Kết quả:

```json
{"status":"ok","auth_enabled":true}
```

Nhưng test OCR thật lại trả:

```json
{"success":false,"error":"Internal server error"}
```

### 13.2 Log lỗi chính

Log pod OCR cho thấy:

- `No available model hosting platforms detected. Please check your network connection.`

Nguyên nhân:

- OCR container đang cố tải model từ bên ngoài lúc runtime
- môi trường K3s/OpenStack không phù hợp để phụ thuộc việc tải model online

### 13.3 Hướng fix đã làm

Đã sửa OCR theo hướng:

- dùng model detection local trong `OCR/models/paddle_det`
- dùng model recognition local `OCR/models/vgg_seq2seq.pth`
- tắt model source check của `paddlex`
- cache detector/recognizer trong process
- ghi output tạm vào `/tmp/ocr-output`

### 13.4 Build và deploy lại OCR image

Đã:

- commit fix OCR
- push lên `develop`
- để GitHub Actions build lại image OCR
- rollout lại `ocr-service`

### 13.5 Lỗi `ephemeral-storage` trên `ai-ocr-worker`

Khi rollout OCR image mới, pod OCR ban đầu bị:

- `Evicted`
- `ErrImagePull`
- `no space left on device`

Nguyên nhân:

- `ai-ocr-worker` thiếu `ephemeral-storage`
- image OCR khá lớn
- containerd không đủ chỗ để pull và extract layer

### 13.6 Cách xử lý

Đã xử lý theo hướng:

- scale `ocr-service` về `0`
- giải phóng image/containerd data OCR cũ
- kiểm tra lại disk trên worker
- scale `ocr-service` lên lại `1`

### 13.7 OCR thật đã chạy thành công

Sau khi fix xong, đã test thật qua service OCR trong cluster:

```bash
curl -s -X POST http://10.43.155.42:8001/ocr-cccd \
  -H 'X-API-Key: Chophuhai130423@' \
  -F 'file=@/home/ubuntu/cccd-test.jpg'
```

Kết quả trả về thành công, ví dụ:

```json
{
  "success": true,
  "filename": "cccd-test.jpg",
  "data": {
    "full_name": "NGUYỄN QUỐC VIỆT",
    "country": "Việt Nam",
    "gender": "Nam",
    "date_of_birth": "10/04/2003",
    "address": "Phú Hải, Đồng Hới, Quảng Bình"
  }
}
```

Ý nghĩa:

- OCR không chỉ health OK
- mà đã OCR thật thành công trên `ai-ocr-worker`

---

## 14. Dọn cluster và đồng bộ placement

### 14.1 Pod backend rác

Trong cluster có nhiều pod backend cũ ở trạng thái:

- `ContainerStatusUnknown`
- `Error`

Đây là rác còn sót lại sau các lần rollout trước.

### 14.2 Đã dọn pod backend rác

Đã xóa các pod backend lỗi, sau đó deployment backend tự hồi phục lại.

### 14.3 Trạng thái backend sau khi hồi phục

`backend-api` trở về:

- `2/2 Running`

### 14.4 Pin backend về `ai-ocr-worker`

Đã chỉnh manifest và patch live deployment để backend chạy trên:

- `ai-ocr-worker`

Kết quả cuối cùng:

- cả 2 pod backend đều chạy trên `ai-ocr-worker`
- backend không còn chạy mới trên `k3s-master-vpn`

---

## 15. Kiến trúc runtime hiện tại

### 15.1 Sơ đồ app layer và data flow

```mermaid
flowchart LR
    Client[Frontend / Mobile / API Client]

    subgraph K3sCluster[Cluster K3s - Namespace uit-healthcare]
        BackendSvc[backend-api Service :4000]
        OCRSvc[ocr-service Service :8001]

        BackendPod1[backend-api pod 1]
        BackendPod2[backend-api pod 2]
        OCRPod[ocr-service pod]

        BackendSvc --> BackendPod1
        BackendSvc --> BackendPod2
        OCRSvc --> OCRPod
    end

    subgraph DataNode[data-core-node]
        PG[(PostgreSQL)]
        Redis[(Redis)]
        Rabbit[(RabbitMQ)]
    end

    Client --> BackendSvc
    Client --> OCRSvc

    BackendPod1 --> PG
    BackendPod2 --> PG
    BackendPod1 --> Redis
    BackendPod2 --> Redis
    BackendPod1 --> Rabbit
    BackendPod2 --> Rabbit
```

### 15.2 Ý nghĩa kiến trúc hiện tại

- `k3s-master-vpn`:
  - bastion / jump host
  - K3s control-plane
  - gateway có Floating IP
- `data-core-node`:
  - data layer độc lập
  - không chạy backend
  - không join K3s
- `ai-ocr-worker`:
  - worker runtime chính
  - đang chạy cả backend lẫn OCR

---

## 16. Trạng thái hiện tại sau tất cả các bước

### 16.1 Đã xong

- Network private trên OpenStack
- Bastion / Jump host
- SSH hardening
- K3s cluster (`k3s-master-vpn` + `ai-ocr-worker`)
- Data layer trên `data-core-node`
- Redis / RabbitMQ / PostgreSQL reachable trong private net
- Backend deploy lên K3s
- OCR deploy lên K3s
- OCR chạy trên `ai-ocr-worker`
- GHCR build/push image thành công
- K3s pull image từ GHCR thành công
- Backend kết nối được DB thật trên `data-core-node`
- Endpoint DB `/api/public/stats` hoạt động
- Seed dữ liệu demo: xong
- Patient login + patient endpoints qua JWT: xong
- OCR thật với ảnh CCCD mẫu: xong
- Tăng disk `k3s-master-vpn`: xong
- Xử lý thiếu `ephemeral-storage` trên `ai-ocr-worker`: xong
- Dọn pod backend rác: xong
- Pin backend về worker node: xong

### 16.2 Chưa xong / cần làm tiếp

- test frontend/mobile gọi OCR thật
- test end-to-end flow thực tế từ app/web
- nếu muốn clean kiến trúc hơn, có thể thêm backend proxy gọi OCR thay vì để client gọi trực tiếp
- monitoring / Prometheus / Grafana
- CI/CD rollout tự động lên K3s sau khi build GHCR
- hardening production cho secrets / JWT / image pull / ingress

---

## 17. Bài học và những điểm cần nhớ

### 17.1 Không nhầm giữa runtime và bootstrap

- Runtime đúng:
  - backend trong K3s
  - OCR trong K3s
  - DB trên Node 2
- Bootstrap tạm thời:
  - có thể dùng master để chạy migrate

### 17.2 Không nhầm password local và password cloud

Local và cloud là 2 môi trường khác nhau.

Khi debug:

- phải kiểm tra password DB thật trong container Postgres
- không được suy ra từ local `.env`

### 17.3 Data node cần disk lớn vì nó là data layer

`data-core-node` cần `20GB` không phải vì nó chạy backend mà vì nó chứa:

- Postgres data
- Redis persistence
- RabbitMQ persistence
- Docker volumes và image

### 17.4 K3s master 10GB hợp lý hơn 6GB

Mức 4.8G-6G là quá sát ngưỡng nguy hiểm.

Sau khi tăng lên `10G` và resize filesystem, trạng thái ổn định hơn rõ rệt.

### 17.5 OCR image có thể rất nặng

OCR image thực tế khá lớn, nên `ai-ocr-worker` cần đủ `ephemeral-storage` cho:

- pull image
- extract image layers
- container runtime cache

Nếu rollout OCR image mới mà gặp `ErrImagePull`, `Evicted`, `no space left on device`, phải nghĩ ngay tới disk/containerd trên worker.

### 17.6 Route patient là `/api/patient`

Nếu frontend/mobile gọi `/api/patients` thì sẽ bị `Route not found`.

---

## 18. Bộ lệnh tổng hợp quan trọng

### 18.1 Kiểm tra cluster

```bash
sudo kubectl get nodes
sudo kubectl -n uit-healthcare get pods -o wide
sudo kubectl -n uit-healthcare get svc
```

### 18.2 Port-forward backend

```bash
sudo kubectl -n uit-healthcare port-forward svc/backend-api 4000:4000
curl http://127.0.0.1:4000/api/health
curl http://127.0.0.1:4000/api/public/stats
```

### 18.3 Port-forward OCR

```bash
sudo kubectl -n uit-healthcare port-forward svc/ocr-service 8001:8001
curl http://127.0.0.1:8001/health
curl -X POST http://127.0.0.1:8001/ocr-cccd -H "X-API-Key: <ocr-key>" -F "file=@/path/to/cccd.jpg"
```

### 18.4 Test OCR thật qua ClusterIP

```bash
curl -s -X POST http://10.43.155.42:8001/ocr-cccd \
  -H 'X-API-Key: Chophuhai130423@' \
  -F 'file=@/home/ubuntu/cccd-test.jpg'
```

### 18.5 Test patient flow

```bash
curl -X POST http://127.0.0.1:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@demo.local","password":"Patient@123"}'
```

```bash
curl http://127.0.0.1:4000/api/patient/profile \
  -H "Authorization: Bearer <token>"
```

```bash
curl http://127.0.0.1:4000/api/patient/appointments \
  -H "Authorization: Bearer <token>"
```

### 18.6 Data node

```bash
cd ~/healthcare-data
docker compose ps
docker compose logs -f postgres
docker compose exec postgres psql -U project -d project_test
docker compose exec postgres printenv | grep POSTGRES_
```

### 18.7 Prisma migrate

```bash
cd ~/PROJECT-TEST && chmod +x node_modules/.bin/prisma
cd ~/PROJECT-TEST && DATABASE_URL='postgresql://project:StrongPass123%21@192.168.100.83:5432/project_test' npx prisma migrate deploy
```

### 18.8 Seed lại dữ liệu demo

```bash
cd ~/PROJECT-TEST
DATABASE_URL='postgresql://project:StrongPass123%21@192.168.100.83:5432/project_test' node prisma/seed.js
```

---

## 19. Kết luận cuối cùng

Hệ thống 3 node OpenStack đã được dựng thành công theo hướng:

- `k3s-master-vpn` làm master/gateway
- `ai-ocr-worker` làm worker runtime chính
- `data-core-node` làm data layer riêng

Tại thời điểm hiện tại, hệ thống không chỉ dừng ở mức:

- backend lên được
- OCR health OK
- DB kết nối được

mà đã tiến thêm tới mức:

- có dữ liệu demo thật
- patient flow cơ bản đã test được
- OCR thật đã chạy được với ảnh mẫu
- runtime placement đã được kéo về đúng topology mong muốn hơn
- cluster sạch và ổn định hơn so với giai đoạn đầu

Có thể coi đây là trạng thái:

- đúng topology
- đúng hướng DevSecOps cơ bản
- đã có thể demo backend + DB + OCR thật
- sẵn sàng đi tiếp sang bước test frontend/mobile, monitoring và CI/CD nâng cao

---

## 20. Test Android app thực tế trên emulator

Sau khi phần backend, database, seed dữ liệu và OCR service đã ổn định, hệ thống được test tiếp ở tầng Android app để xác nhận luồng sử dụng thực tế từ client.

Mục tiêu của bước này là:

- xác nhận app Android kết nối được tới backend thật trên OpenStack
- xác nhận app Android gọi được OCR service thật
- xác nhận flow đặt khám hoạt động với dữ liệu cloud thật
- xác nhận payment flow tạo được QR MoMo test

### 20.1 Cách nối Android emulator tới hệ thống cloud

Do backend và OCR đang chạy trong cluster K3s trên OpenStack, còn Android emulator chạy trên máy local Windows, nên cần đi qua 2 lớp trung gian:

- `kubectl port-forward` trên `k3s-master-vpn`
- `ssh -L` tunnel từ Windows local vào `k3s-master-vpn`

Luồng thực tế:

```text
Android Emulator
-> 10.0.2.2:4000 / 10.0.2.2:8001
-> Windows localhost 127.0.0.1:4000 / 127.0.0.1:8001
-> SSH tunnel
-> k3s-master-vpn localhost
-> kubectl port-forward
-> backend-api / ocr-service trong K3s
```

### 20.2 Cấu hình app Android để test local

Trong app Android, base URL đã được chỉnh sang địa chỉ dành cho Android Emulator:

- `http://10.0.2.2:4000/` cho backend
- `http://10.0.2.2:8001/` cho OCR

Điều này cho phép emulator gọi về máy Windows local, sau đó đi tiếp qua SSH tunnel tới cluster.

### 20.3 Lệnh cần giữ khi test Android

Trên `k3s-master-vpn`:

```bash
sudo kubectl -n uit-healthcare port-forward svc/backend-api 4000:4000
```

```bash
sudo kubectl -n uit-healthcare port-forward svc/ocr-service 8001:8001
```

Trên Windows local:

```powershell
ssh -L 4000:127.0.0.1:4000 ubuntu@192.168.120.73
```

```powershell
ssh -L 8001:127.0.0.1:8001 ubuntu@192.168.120.73
```

Kiểm tra nhanh từ Windows:

```powershell
curl.exe http://127.0.0.1:4000/api/health
curl.exe http://127.0.0.1:8001/health
```

### 20.4 Tài khoản demo dùng để test Android

Tài khoản đã dùng để test app:

- `patient@demo.local`
- `Patient@123`

### 20.5 Kết quả test Android phần login và dữ liệu cơ bản

Đã test thành công:

- login từ Android app
- tải patient profile
- xem hồ sơ sức khỏe
- xem lịch sử đặt khám
- đọc được dữ liệu demo từ DB thật trên `data-core-node`

Ý nghĩa:

- auth flow hoạt động
- backend thật phản hồi đúng cho Android app
- Android không còn chỉ chạy với dữ liệu local/mock

---

## 21. Test OCR CCCD thật từ Android app

### 21.1 Chuẩn bị ảnh test trong emulator

Ảnh CCCD mẫu đã được đưa vào emulator để dùng cho flow OCR.

### 21.2 Lỗi ban đầu trên Android OCR

Ban đầu Android OCR bị lỗi theo từng giai đoạn:

- không thấy ảnh trong picker
- `404` do app gọi sai Retrofit/base URL OCR
- `401` do request chưa gửi `X-API-Key`

### 21.3 Các điểm đã fix ở Android

Đã sửa các vấn đề chính:

- tách riêng Retrofit backend và Retrofit OCR
- cho OCR dùng base URL riêng
- thêm `X-API-Key` cho request OCR
- giữ `BASE_URL` và `OCR` đúng theo `10.0.2.2`

### 21.4 Kết quả cuối cùng của OCR trên Android

Sau khi fix:

- Android app gọi được `POST /ocr-cccd`
- OCR service thật xử lý ảnh CCCD
- app nhận được dữ liệu OCR thành công

Điều này xác nhận:

- Android -> OCR service thật: thông
- auth OCR: đúng
- OCR runtime trên `ai-ocr-worker`: đúng
- app không còn phụ thuộc mock OCR

---

## 22. Đồng bộ lại seed data để khớp Android app

### 22.1 Vấn đề gặp phải trong booking flow

Khi test đặt khám trên Android, phát hiện mismatch giữa dữ liệu seed và dữ liệu chuyên khoa mà app dùng.

Cụ thể:

- app Android dùng chuyên khoa cố định như `TIM MẠCH`
- seed cũ tạo doctor với specialty tiếng Anh như `Cardiology`

Hậu quả:

- app gọi API tìm bác sĩ theo `TIM MẠCH`
- backend trả rỗng
- màn chọn bác sĩ / khung giờ không đi tiếp được

### 22.2 Hướng xử lý

Đã sửa `prisma/seed.js` theo đúng chuyên khoa cố định của backend/app.

Doctor demo được đổi sang:

- `TIM MẠCH`

Đồng thời seed slot cũng được chỉnh để:

- tránh ngày Chủ nhật
- tạo dữ liệu rõ ràng hơn cho flow đặt khám

### 22.3 Kết quả sau khi seed lại

Đã test lại API:

```bash
/api/doctors/available?day=2026-03-30&specialty=TIM%20MẠCH
```

Kết quả:

- trả đúng `Dr. John Doe`
- có các slot trống đúng để Android app chọn

Ý nghĩa:

- dữ liệu demo đã khớp UI app Android
- flow booking không còn fail vì mismatch specialty

---

## 23. Test booking flow thật từ Android

### 23.1 Các bước đã đi qua trên app

Đã test thành công các bước:

- chọn hồ sơ bệnh nhân
- chọn chuyên khoa `TIM MẠCH`
- chọn ngày khám
- chọn khung giờ khám
- vào màn xác nhận thông tin đặt khám

### 23.2 Kết quả khi booking

Khi bấm `Tiếp tục`, app gọi:

```text
POST /api/appointments/book
```

Backend trả:

- `201 Created`

Appointment mới được tạo thành công với trạng thái:

- `status: PENDING`
- `paymentStatus: REQUIRES_PAYMENT`

### 23.3 Lưu ý về lỗi slot cũ

Trong quá trình test lại nhiều lần, có trường hợp app trả lỗi vì bấm lại đúng slot đã book trước đó.

Backend log xác nhận lỗi:

- `Slot already booked`

Đây là hành vi đúng của hệ thống, không phải bug hạ tầng.

---

## 24. Cấu hình MoMo trên backend cloud

### 24.1 Vấn đề ban đầu

Khi Android đi tới màn thanh toán, backend trả lỗi:

- `MoMo config missing: partnerCode, accessKey, secretKey, returnUrl, notifyUrl`

Nguyên nhân:

- backend pod trong K3s chưa được truyền đủ biến môi trường MoMo

### 24.2 Cách xử lý đúng

Không dùng trực tiếp `.env` local để suy ra runtime cloud.

Thay vào đó, các biến MoMo được đưa vào `backend-secret` trong namespace `uit-healthcare`, rồi rollout lại `backend-api`.

Các biến đã bổ sung gồm:

- `MOMO_PARTNER_CODE`
- `MOMO_ACCESS_KEY`
- `MOMO_SECRET_KEY`
- `MOMO_ENDPOINT`
- `MOMO_RETURN_URL`
- `MOMO_NOTIFY_URL`

### 24.3 Kết quả sau khi rollout

Đã kiểm tra trong pod backend và xác nhận các env MoMo đã vào đúng runtime.

Điều này xử lý xong lỗi:

- thiếu cấu hình MoMo trên server

---

## 25. Test payment flow MoMo từ Android

### 25.1 Trạng thái sau khi fix env

Sau khi backend có đủ cấu hình MoMo, Android app được test lại với một slot mới chưa bị book.

### 25.2 Kết quả thực tế

Flow mới đi được như sau:

- `POST /api/appointments/book` -> `201 Created`
- app chuyển sang `PaymentActivity`
- `POST /api/payments/momo/create` -> `200 OK`

Backend trả về thành công:

- `amount`
- `orderInfo`
- `payUrl`
- `qrImage`

### 25.3 Ý nghĩa

Điều này xác nhận:

- Android booking flow hoạt động thật
- backend payment flow hoạt động thật
- MoMo test QR đã được tạo từ backend cloud
- app Android đọc được response payment đúng cách

Nói cách khác, hệ thống hiện tại đã đi được từ:

- Android app
- backend trên K3s
- DB thật trên `data-core-node`
- OCR thật trên `ai-ocr-worker`
- tới MoMo test QR

---

## 26. Dọn lỗi backend/app sau giai đoạn test Android

Sau khi test được Android app, OCR thật, booking thật và tạo QR MoMo test thành công, hệ thống được rà soát lại để xử lý các lỗi backend/app còn thô.

Mục tiêu của bước này là:

- trả mã lỗi API đúng hơn cho app Android
- tránh các lỗi logic hợp lệ nhưng lại bị đẩy thành `500`
- ẩn các field nhạy cảm như `password` hash khỏi response API
- giúp client nhận message rõ hơn khi booking/payment lỗi

### 26.1 Lỗi `Slot already booked` ban đầu

Khi app Android hoặc client bấm lại đúng slot đã được đặt trước đó, backend log ghi đúng bản chất lỗi:

- `Slot already booked`

Tuy nhiên response lại đang rơi về:

- `500 Internal server error`

Điều này không đúng semantically, vì đây không phải lỗi hệ thống mà là lỗi business hợp lệ.

### 26.2 Hướng sửa lỗi booking

Đã sửa backend theo hướng gắn status code rõ ràng cho các lỗi business trong service booking:

- `404` nếu slot không tồn tại
- `409` nếu slot đã được book
- `400` nếu slot nằm trong quá khứ
- `404` nếu `careProfile` không thuộc patient hiện tại
- `403` nếu người dùng không có quyền với appointment

Ý nghĩa:

- app Android có thể phân biệt lỗi nghiệp vụ với lỗi hệ thống
- dễ hiển thị thông báo đúng cho user hơn
- log vận hành cũng dễ đọc hơn

### 26.3 Middleware lỗi đã được chuẩn hóa hơn

Trước đó middleware lỗi gần như đẩy hầu hết exception về `500`.

Đã sửa theo hướng:

- tôn trọng `err.status` nếu service/controller đã gắn sẵn
- map về đúng nhóm:
  - `400`
  - `401`
  - `403`
  - `404`
  - `409`
  - `500`

Ý nghĩa:

- backend response đúng HTTP semantics hơn
- app/web dễ xử lý hơn ở client side

---

## 27. Ẩn password hash khỏi response API

### 27.1 Vấn đề ban đầu

Trong quá trình test API, phát hiện nhiều response đang trả ra cả object `user` đầy đủ, bao gồm cả:

- `password` hash

Dù đây là bcrypt hash chứ không phải plaintext password, việc lộ field này trong API response vẫn là không nên.

### 27.2 Các chỗ đã xử lý

Đã thay các đoạn kiểu:

- `include: { user: true }`

bằng `select` an toàn hơn, chỉ lấy các field cần thiết như:

- `id`
- `email`
- `fullName`
- `phone`
- `role`
- `createdAt`
- `updatedAt`

Các API được xử lý gồm nhóm:

- doctor profile/list/search
- patient profile
- patient appointments / paid appointments / reminders / results

### 27.3 Ý nghĩa

Việc này giúp:

- không còn lộ password hash ra ngoài API
- response gọn hơn
- đúng hướng security baseline hơn cho production/demo

---

## 28. Chuẩn hóa lỗi payment để app nhận rõ hơn

### 28.1 Vấn đề ban đầu

Flow thanh toán ban đầu có nhiều trạng thái lỗi khác nhau nhưng client khó phân biệt, ví dụ:

- thiếu env MoMo
- appointment không tồn tại
- appointment đã thanh toán rồi
- user không có quyền
- MoMo upstream lỗi

### 28.2 Hướng xử lý

Đã chuẩn hóa `momo/create` theo các nhóm lỗi rõ hơn:

- `400` cho lỗi request/config không hợp lệ
- `403` cho `Forbidden`
- `404` cho `Appointment not found`
- `409` cho `Appointment already paid`
- `502` cho lỗi upstream từ MoMo

### 28.3 Ý nghĩa

Điều này giúp:

- app Android có thể hiển thị message đúng hơn
- dễ debug sự cố payment hơn
- tách biệt rõ lỗi nội bộ với lỗi từ nhà cung cấp thanh toán

---

## 29. Cách test local Android rõ ràng để handover

Sau khi hoàn tất Android test, có thể chốt lại cách test local chuẩn như sau.

### 29.1 Port-forward trên `k3s-master-vpn`

Trên `k3s-master-vpn` cần giữ 2 lệnh:

```bash
sudo kubectl -n uit-healthcare port-forward svc/backend-api 4000:4000
```

```bash
sudo kubectl -n uit-healthcare port-forward svc/ocr-service 8001:8001
```

### 29.2 SSH tunnel từ Windows local

Trên Windows local cần giữ 2 tunnel:

```powershell
ssh -L 4000:127.0.0.1:4000 ubuntu@192.168.120.73
```

```powershell
ssh -L 8001:127.0.0.1:8001 ubuntu@192.168.120.73
```

### 29.3 Cấu hình Android Emulator

Trong app Android, base URL để test local là:

- backend: `http://10.0.2.2:4000/`
- OCR: `http://10.0.2.2:8001/`

Lưu ý:

- `10.0.2.2` là cách Android Emulator truy cập máy Windows host
- không dùng trực tiếp `127.0.0.1` trong app Android

### 29.4 Kiểm tra nhanh trước khi mở app

Có thể test nhanh từ Windows local:

```powershell
curl.exe http://127.0.0.1:4000/api/health
curl.exe http://127.0.0.1:8001/health
```

Nếu cả hai đều OK thì mới chạy app Android.

### 29.5 Ý nghĩa của flow local test này

Flow thực tế là:

```text
Android Emulator
-> 10.0.2.2
-> Windows localhost
-> SSH tunnel
-> k3s-master-vpn localhost
-> kubectl port-forward
-> service trong K3s
```

Đây là cách test local ổn định nhất trong giai đoạn hiện tại khi backend/OCR chưa được expose public đầy đủ theo hướng production.

---

## 30. Trạng thái cập nhật sau khi dọn lỗi backend

Sau bước dọn lỗi này, hệ thống đã tốt hơn ở các điểm:

- business error không còn bị trả bừa thành `500`
- client nhận được status code đúng hơn
- response API bớt lộ thông tin nhạy cảm
- handover/test local rõ ràng hơn
- phù hợp hơn để chuyển sang giai đoạn monitoring, CI/CD và hardening tiếp theo

Nói ngắn gọn, trạng thái hiện tại không chỉ là:

- chạy được
- demo được

mà còn đang tiến dần sang mức:

- dễ test lại
- dễ handover
- dễ vận hành
- dễ nâng cấp lên production hơn
