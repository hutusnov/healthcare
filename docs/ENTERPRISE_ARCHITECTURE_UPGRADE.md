# Đề Xuất Nâng Cấp Kiến Trúc (Enterprise-Grade) & Yêu Cầu Cấp Phát VM

Tài liệu này trình bày chi tiết giải pháp nâng cấp kiến trúc hệ thống UIT Healthcare để đạt chuẩn **Enterprise-grade/Production-ready**, giải quyết triệt để các vấn đề về nút thắt cổ chai, và lập kế hoạch xin cấp phát tài nguyên máy ảo (VM) để triển khai thực tế.

---

## Phần 1: Tối Ưu Hóa Kiến Trúc Cốt Lõi Hệ Thống (Task 1)

Dưới góc nhìn của một hệ thống chịu tải với tính sẵn sàng cao (High Availability), các điểm mù kiến trúc hiện tại đã được tái cấu trúc thành các hạng mục chiến lược sau:

### 1. Giải Quyết Nút Thắt Cổ Chai (Bottleneck) Bằng Xử Lý Bất Đồng Bộ (Async Processing)
- **Giải pháp**: Tích hợp Message Broker (**RabbitMQ** hoặc **Apache Kafka**) làm trung gian giữa Backend và OCR Service.
- **Workflow**:
  1. Mobile App gọi API upload ảnh đơn thuốc.
  2. Backend lưu tải liệu vào File Storage, đẩy một `OCR_Job` vào hàng đợi (Queue) của RabbitMQ và lập tức trả kết quả **HTTP 202 Accepted** (Đã tiếp nhận xử lý) cho user.
  3. OCR Worker node liên tục kéo (pull) các job từ RabbitMQ về và bắt đầu xử lý text extraction (chạy bằng AI Model tự build).
  4. Sau khi AI rút trích xong, Backend cập nhật kết quả vào DB và bắn Push Notification (qua Firebase FCM) hoặc qua WebSocket để App tự động hiển thị kết quả mà không cần user treo máy chờ đợi.
- **Hiệu quả**: Loại bỏ hoàn toàn tình trạng treo (blocking) connection của Node.js, giúp hệ thống chịu tải mượt mà dù cả ngàn user upload ảnh cùng thời điểm.

### 2. Loại Bỏ Điểm Lỗi Duy Nhất (Single Point of Failure - SPOF)
- **Giải pháp**: Tách khối Compute ra khỏi Monolithic VM, áp dụng công nghệ Container Orchestration với cụm **Kubernetes (K8s)** (Cụ thể có thể dùng K3s cho nhẹ).
- **Workflow**:
  1. Dùng **Nginx** đứng làm cửa ngõ điều phối luồng traffic vào cụm Cluster.
  2. Backend Services được scale thành nhiều Replicas (Bản sao container) chạy song song trên các Worker Nodes khác nhau.
  3. Cấu hình **Horizontal Pod Autoscaler (HPA)**: Hệ thống giám sát CPU/RAM, nếu lượng Request tăng đột biến đẩy CPU quá ngưỡng 70%, K8s tự động nhân bản thêm Pod để chia sẻ tải và thu hẹp lại khi vắng khách.
- **Hiệu quả**: Nếu 1 máy ảo Worker Node gặp sự cố chết nguồn, Load Balancer lập tức chuyển Request qua Node khoẻ mạnh khác. Đảm bảo Uptime luôn ở mức 99.9%.

### 3. Tối Ưu Hiệu Năng Với Caching Layer
- **Giải pháp**: Triển khai in-memory store bằng **Redis Cache** (Triển khai Cluster hoặc Standalone trên K8s).
- **Workflow**:
  1. **Tối ưu Read**: Mọi thao tác lấy dữ liệu tĩnh như: *Danh sách bác sĩ, Chuyên khoa, Danh sách địa điểm* được hook qua Redis để lấy thẳng trên RAM. Giảm được 80-90% số lượng truy vấn xuống PostgreSQL, giúp DB rảnh tay xử lý các thao tác Giao Dịch (Payments, Booking).
  2. **Quản lý Rate Limiter**: Rate Limiter hiện tại trên memory của Node.js sẽ bị fail nếu load balance qua 2 Node khác nhau. Đưa Session và Rate Limit vào Redis sẽ cho phép quản lý chống Spam/DDoS tập trung và chính xác tuyệt đối.

### 4. Quy Hoạch Mạng Và Bảo Mật Chuyên Sâu (Zero Trust)
- **Giải pháp**: Phân chia bảo mật kiến trúc mạng theo hướng **VPC (Virtual Private Cloud)** và **Zone Defense**.
- **Workflow**:
  1. **Cô lập Database**: Máy ảo chứa PostgreSQL, Redis và RabbitMQ phải cấu hình tĩnh bằng dải IPv4 Private (LAN) nội bộ, ngắt hoàn toàn truy cập Public Internet (Chặn Inbound từ Internet). Chỉ Backend API trong cùng lớp mạng LAN mới được phép giao tiếp.
  2. **Tường lửu WAF**: Tại Nginx Load Balancer cài đặt thêm WAF Module (như ModSecurity hay tích hợp API Gateway) để tự block các luồng tấn công SQL Injection và Cross-Site Scripting (XSS).
  3. **Quản lý Credentials**: Secret keys không lưu vào File `.env` thông thường, mà đưa vào Secret Store của K8s để mã hoá tránh lộ DB connection pool.

### 5. Nâng Cấp Chiến Lược Triển Khai (CI/CD)
- **Giải pháp**: Triển khai bằng chiến lược **Rolling Updates** kết hợp Automation Pipelines.
- **Workflow**: Khi Push Code nhánh `master`/`develop`, CI/CD build Docker Image mới rồi đẩy lệnh cập nhật cho Kubernetes. K8s sẽ khởi động từ từ từng Container (Pod) mới, check sức khoẻ nội bộ (health path `/health`), chỉ khi nào OK thì Load Balancer mới đẩy User vô đó, và từ từ ngắt các Pod cấu hình cũ.
- **Hiệu quả**: Triển khai ứng dụng (Deployments) diễn ra êm ả, không bao giờ xuất hiện lỗi `502 Bad Gateway` làm mất trải nghiệm của bệnh nhân đang truy cập đặt lịch khám.

---

## Phần 2: Kế Hoạch Cấp Phát Quota Và Chọn Flavor (Task 2)

Dựa trên yêu cầu xây dựng kiến trúc AI OCR tự build (Không gọi API Google nữa) và giữ vững khối lượng công việc phía trên, chúng ta cần phối hợp số lượng VM theo Quota như sau:

### 1. Số Lượng Các Loại Flavor Cần Cấp (Quota Proposal)

| Loại (Flavor) | Số Lượng | Cấu hình cấp (Disk/RAM/vCPU)| Vai Trò Hệ Thống (Role) |
|:--------------|:--------:|:----------------------------|:------------------------|
| **d30.s2**    | `1`      | 30GB / 2GB / 2 vCPU         | **Nginx Load Balancer & WAF** |
| **d30.m2**    | `1`      | 30GB / 4GB / 2 vCPU         | **K8s Master Node (Control Plane)** |
| **d60.l4**    | `3`      | 60GB / 8GB / 4 vCPU         | **Database Srv** & **K8s Worker Nodes** |
| **d60.xl8**   | `1`      | 60GB / 16GB / 8 vCPU        | **AI OCR Worker Node (Heavy Compute)** |

*(**Tổng Quota Request:** 6 Máy ảo | ~300GB SSD | 46 GB RAM | 24 vCPU)*

### 2. Mục Đích Sử Dụng Tài Nguyên Máy Ảo (Mô tả chi tiết)

Để cung cấp lý do hợp lý xin quota cho Admin quản lý Cloud, workload cho từng flavor được lên kế hoạch như sau:

#### A. Máy ảo d30.s2 (1 VM) - Load Balancer & Entrypoint
- **Mục đích:** Là cửa ngõ công cộng duy nhất giao tiếp với Internet để tiếp nhận HTTPS requests.
- **Workload & Cấu hình:** Chạy dịch vụ Nginx/HAProxy phân phối truy cập và Web Application Firewall. Lưu lượng tải mạng lớn nhưng mức độ tính toán không quá phức tạp. `2GB RAM` và `2 vCPU` là mức hiệu suất cực kỳ lý tưởng để mã hóa SSL/TLS, giảm thiểu chi phí khi phân luồng tới cluster bên trong.

#### B. Máy ảo d30.m2 (1 VM) - Hệ điều khiển K8s Cluster (Master)
- **Mục đích:** Là Node điều phối trung tâm của toàn hệ thống K8s (Thường dùng k3s cho tối ưu). 
- **Workload & Cấu hình:** Quản trị trạng thái thông qua etcd, phân bổ Job (API Server & Scheduler). Vì Node này không chạy ứng dụng mà chuyên lập lịch, nó cần RAM vừa phải `4GB` để duy trì map network dịch vụ ngầm của cluster và `2 vCPU` điều hướng.

#### C. Máy ảo d60.l4 (3 VMs) - Compute Worker Nodes & Relational DB
Sẽ tận dụng 3 máy chủ hiệu năng lớn với `8GB RAM` chia làm 2 cụm độc lập:
- **1 Database Node (Độc Lập):** Hệ thống Y tế yêu cầu sự an toàn tuyệt đối. Cần 1 máy DB chạy Postgres nguyên bản (Bare-metal hoặc docker container) riêng biệt (không gộp chung với K8s). Cần tốc độ I/O cao (Ổ cứng `60GB`) để lưu trữ dữ liệu y bạ lớn và dùng 8GB RAM cache Connection Pool/Index Queries.
- **2 Worker Nodes (Kết Nối vào K8s Cluster):** Hai máy này cài đặt khối Backend API (Node.js), Redis Cache, RabbitMQ. Việc phân chia 2 Worker giúp chúng ta ứng dụng chiến lược HPA và duy trì mức độ HA (Lỗi phần cứng Node này thì Node kia vớt lại lập tức). Disk cũng cần mức `60GB` vì các Block Image của Docker container chiếm không gian khá lớn theo thời gian sử dụng.

#### D. Máy ảo d60.xl8 (1 VM) - Cỗ Máy AI Nhận Diện Chữ (Custom OCR)
- **Mục đích:** Xử lý các luồng ảnh chụp đơn thuốc ngốn tài nguyên cực đoan liên tục thông qua Message Broker đẩy xuống.
- **Workload & Cấu hình:** Chúng ta sẽ **TỰ BUILD** OCR Model như đồ án đặt ra (VD: PaddleOCR, Tesseract, hoặc OpenCV + YOLO pipeline) thay vì API có sẵn. Hoạt động Inference của AI bắt buộc cần lượng RAM dồi dào để load Weights (Parameters của Model) để model không bị dump memory, và yêu cầu vCPU lớn (Do không nhận được sự hỗ trợ từ GPU trên các Flavour này). Do đó, dòng flavor mạnh nhất nhì hệ thống là `16GB RAM` đi kèm với `8 vCPU` là mức tối thiểu để Model OCR chạy mà trả về Response ổn định dưới 2s cho chuỗi xử lý bất đồng bộ.

---
**Lưu ý tích hợp**: Dù hệ thống khép kín trên mạng Private (VPC/LAN) của cơ sở đào tạo, khối Backend Node (qua thiết lập NAT Gateway) vẫn có khả năng chủ động request ra Internet để cấu hình gửi thông báo Push qua **Firebase Cloud Messaging (FCM)** (Miễn phí) tới Mobile App của đối tượng bệnh nhân.
