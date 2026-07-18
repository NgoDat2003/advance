# Báo cáo lộ trình học DevOps nhanh để dùng Dokploy vững

> Mục tiêu: trong 6 tuần học thực hành (12–15 giờ/tuần), có thể tự đóng gói ứng dụng, triển khai an toàn lên VPS, gắn domain/HTTPS, tự động triển khai từ Git, xem log, sao lưu và khôi phục trước khi dùng Dokploy.

## 1. Kết quả đầu ra cần đạt

Không học DevOps theo danh sách công cụ rời rạc. Mỗi tuần phải tạo được một **bằng chứng chạy được**: mã nguồn, file cấu hình, ảnh chụp/URL, và một ghi chú sự cố đã xử lý.

Sau lộ trình, bạn phải tự làm được các việc sau mà không phụ thuộc giao diện Dokploy:

- Đăng nhập VPS bằng SSH key, dùng Linux cơ bản, kiểm tra dịch vụ và xử lý port bị chiếm.
- Viết Dockerfile tốt, build image nhỏ và chạy container có biến môi trường, volume, network.
- Viết `compose.yaml` cho app + database; biết dữ liệu nằm ở đâu và cách backup/restore.
- Hiểu đường đi `DNS → HTTPS/reverse proxy → container → ứng dụng`.
- Tạo pipeline kiểm tra mã, build image và triển khai có kiểm soát.
- Đọc log, biết healthcheck, rollback và cập nhật image an toàn.
- Dùng Dokploy như lớp quản lý triển khai, không coi nó là “hộp đen”.

## 2. Vì sao phải học theo thứ tự này

Dokploy là nền tảng tự host để triển khai ứng dụng/container; nó dựa nhiều vào Docker, Docker Compose và Traefik. Vì vậy, học giao diện Dokploy trước có thể giúp ra URL nhanh, nhưng khi app không lên, domain lỗi, volume mất dữ liệu hoặc port 80/443 xung đột thì sẽ bị kẹt.

```text
Git + Linux + mạng
        ↓
Docker + Docker Compose
        ↓
DNS + reverse proxy + HTTPS + secret
        ↓
CI/CD + logs + backup + rollback
        ↓
Dokploy (tự động hóa và quản trị các phần trên)
```

## 3. Cách học để nhanh nhưng không hổng

- Dành 2 giờ mỗi ngày, 5 ngày/tuần; thêm 2–4 giờ cuối tuần cho bài lab. Nếu ít thời gian hơn, giữ nguyên thứ tự và kéo dài lịch.
- Mỗi chủ đề theo nhịp: **20% đọc → 70% tự gõ/làm → 10% ghi lại**.
- Không sao chép file Compose/Dockerfile mà chưa giải thích được từng khối. Mỗi cấu hình đều trả lời được: nó chạy cái gì, mở port nào, dữ liệu lưu ở đâu, secret ở đâu, khi hỏng xem log nào.
- Có một repo cho mọi bài lab. Commit nhỏ, rõ nghĩa. Không commit `.env`, mật khẩu, API key, private key hay file backup thật.
- Đừng học Kubernetes trước giai đoạn này. Docker Compose + một VPS + Dokploy là đủ để xây phản xạ vận hành. Kubernetes để sau, khi đã cần multi-node/độ phức tạp cao hơn.

## 4. Chuẩn bị môi trường (buổi 0 — 2 đến 3 giờ)

### Máy local

Nếu dùng Windows, cài và dùng WSL2 với Ubuntu để các lệnh Linux/Docker nhất quán. Cần có:

- Git và một tài khoản Git hosting (GitHub/GitLab).
- Docker Desktop với WSL integration, hoặc Docker Engine trên Linux.
- VS Code và extension Docker/YAML (tùy chọn nhưng tiện).
- Một password manager để giữ secret; `.env` chỉ dùng cho secret local/dev.

### Máy chủ thực hành

- Ban đầu có thể chạy Docker local. Từ tuần 3, dùng một VPS test riêng để làm quen mạng thật.
- Chọn Ubuntu LTS hoặc Debian. Đừng dùng máy đang có dữ liệu/sản phẩm quan trọng làm sân tập.
- Tạo SSH key riêng cho học tập, dùng passphrase; tắt đăng nhập bằng mật khẩu sau khi chắc chắn SSH key hoạt động.
- Có domain rẻ hoặc subdomain để học DNS/TLS. Cloudflare DNS là một lựa chọn phổ biến, nhưng hiểu bản ghi A/AAAA/CNAME quan trọng hơn nhà cung cấp.

**Tiêu chí hoàn thành:** có thể `ssh` vào VPS bằng key; local chạy được `docker run hello-world`; repo Git có README nêu mục tiêu lab.

## 5. Lộ trình 6 tuần

## Tuần 1 — Linux, Git, mạng và Bash tối thiểu

### Cần hiểu

- Linux filesystem: `/etc`, `/var`, `/home`, `/opt`, `/tmp`; file owner/group/permission (`chmod`, `chown`).
- Tiến trình/dịch vụ: `ps`, `top`/`htop`, `systemctl`, `journalctl`.
- Mạng: IP private/public, port, TCP vs UDP, DNS, HTTP status code, NAT/firewall.
- Lệnh chẩn đoán quan trọng: `curl -I`, `ss -tulpn`, `dig`, `ping` (chỉ để kiểm tra reachability), `tail -f`.
- Git: branch, commit, remote, `.gitignore`, pull request căn bản, xử lý conflict đơn giản.
- Bash: biến, exit code, pipe, redirect, điều kiện, script idempotent đơn giản.

### Bài thực hành

1. Tạo một VM/VPS test và một user không phải root có quyền `sudo`.
2. Viết `health-report.sh`: in disk, RAM, load, 5 dịch vụ/listening ports; script phải trả non-zero khi disk gần đầy.
3. Dùng `systemd` chạy một web server thử nghiệm, đọc log bằng `journalctl`, rồi dừng/khởi động lại nó.
4. Từ local dùng `curl` gọi app trên server; dùng `ss` tìm chính xác tiến trình đang chiếm port.
5. Commit script và README hướng dẫn chạy. Viết một ghi chú: “port bị chiếm thì kiểm tra thế nào?”

**Qua tuần 2 khi:** bạn giải thích được sự khác nhau giữa SSH, HTTP và HTTPS; biết port 22/80/443/3000 dùng vào việc gì; không cần đăng nhập root để vận hành thường ngày.

## Tuần 2 — Docker nền tảng

### Cần hiểu

- Khác nhau giữa image, container, registry và volume.
- `CMD`/`ENTRYPOINT`, layer cache, `.dockerignore`, tag image và immutable digest.
- Cổng container khác cổng host; container network và DNS nội bộ.
- Log theo stdout/stderr; container không nên tự giữ state quan trọng trong filesystem tạm.
- Môi trường dev khác production: build repeatable, secret không bake vào image.

### Bài thực hành

1. Chọn một app nhỏ (Node/Express, Python/FastAPI hoặc Go). Chỉ dùng **một** stack, không đổi ngôn ngữ giữa chừng.
2. Viết Dockerfile multi-stage nếu ngôn ngữ có bước build; thêm `.dockerignore`.
3. Build/tag image, chạy container, map port, truyền biến môi trường.
4. Thử 3 lỗi có chủ đích: sai port, thiếu biến môi trường, app crash. Dùng `docker logs`, `docker inspect`, `docker exec` để tìm nguyên nhân.
5. So sánh image trước/sau `.dockerignore` hoặc multi-stage và ghi lại lý do chênh lệch.

**Qua tuần 3 khi:** bạn có thể nhìn Dockerfile và nêu app chạy user nào, lắng nghe port nào, source code có bị copy dư không, và secret có bị đưa vào image không.

## Tuần 3 — Docker Compose và dữ liệu bền vững

Đây là tuần quan trọng nhất trước Dokploy, vì app nhiều service trên Dokploy thường được biểu diễn bằng Docker Compose.

### Cần hiểu

- `services`, `networks`, `volumes`, `environment`, `env_file`, `depends_on`, `healthcheck`, `restart`.
- Tại sao app gọi database bằng tên service như `db:5432`, không phải `localhost`.
- Bind mount khác named volume; dữ liệu PostgreSQL/MySQL cần tồn tại qua lúc container bị thay thế.
- Phân biệt config/secret/data; không expose database port ra Internet nếu app và DB cùng một network.

### Bài thực hành

1. Nâng app tuần 2 thành 2–3 service: app + PostgreSQL + Redis (Redis có thể bỏ nếu app chưa cần).
2. Viết `compose.yaml`, `.env.example`, healthcheck cho app/DB phù hợp và một `.gitignore` chặn `.env`.
3. Tạo dữ liệu mẫu, dừng/xóa container, chạy lại và chứng minh dữ liệu còn trong named volume.
4. Backup database bằng tool chính thức của DB; tạo database/volume test khác, restore và xác minh dữ liệu.
5. Thử cho app kết nối `localhost` để thấy lỗi; sửa sang hostname service.

**Qua tuần 4 khi:** chỉ với repo + `.env` + bản backup, bạn dựng lại được cả môi trường ở một máy mới và biết dữ liệu nào cần khôi phục.

## Tuần 4 — Web production: DNS, reverse proxy, HTTPS và security cơ bản

### Cần hiểu

- DNS record A/AAAA/CNAME và TTL; domain chỉ “trỏ đường”, không tự tạo HTTPS.
- Reverse proxy nhận request 80/443, chấm dứt TLS rồi chuyển tiếp nội bộ đến port app.
- TLS certificate, HTTP→HTTPS redirect, `Host` header, WebSocket (nếu app dùng).
- Firewall: chỉ mở các port cần thiết; rule inbound khác outbound.
- Security baseline: SSH key, cập nhật hệ điều hành, UFW/firewall, user riêng, secret rotation, không public database/admin dashboard.

### Bài thực hành

1. Đưa app Compose lên VPS bằng quy trình tay (SSH + Git/pull hoặc copy artifact) để hiểu việc Dokploy sau này tự động hóa.
2. Trỏ một subdomain vào IP VPS. Xác minh bằng `dig` và `curl` trước khi cấu hình proxy.
3. Dùng reverse proxy có TLS tự động (Traefik hoặc Caddy) đặt app sau HTTPS. Không expose port app trực tiếp ra Internet.
4. Chỉ mở 22, 80, 443 (và tạm thời port quản trị nếu bắt buộc); kiểm tra từ ngoài vào.
5. Ghi runbook ngắn: domain chưa hoạt động kiểm tra DNS, firewall, proxy, app theo thứ tự nào.

**Qua tuần 5 khi:** bạn giải thích được request từ trình duyệt đi qua đâu, và sửa được lỗi phổ biến “domain vào không được” mà không reset server mù quáng.

## Tuần 5 — CI/CD, release và observability

### Cần hiểu

- CI: lint/test/build; CD: đưa artifact đã kiểm tra vào môi trường chạy.
- Một image được build một lần, dùng lại cho staging/production; không build lại trên production nếu tránh được.
- Tag release (`v1.2.3`, commit SHA), changelog, rollback và healthcheck sau deploy.
- Log tập trung tối thiểu, metrics mức host/container, uptime check, alert có hành động được.
- Deploy không phải xong: cần biết app đang sống, chậm hay lỗi, và có backup gần đây không.

### Bài thực hành

1. Tạo pipeline trên GitHub Actions hoặc GitLab CI: chạy test + build Docker image trên pull request/push.
2. Sau khi merge nhánh chính, build/push image với tag commit SHA. Chỉ dùng registry private/public phù hợp, không commit registry token.
3. Viết bước deploy staging (có thể là server/local riêng) và healthcheck URL sau deploy.
4. Cố ý phát hành image lỗi; rollback về tag trước. Đo thời gian khôi phục và ghi lại.
5. Dựng monitoring nhẹ: xem CPU/RAM/disk của VPS và logs container; đặt một uptime check cho URL HTTPS.

**Qua tuần 6 khi:** có thể chỉ ra pipeline đã deploy image/tag nào, xem log lỗi ở đâu, và rollback mà không mất database volume.

## Tuần 6 — Dokploy và bài capstone

### Điều kiện trước khi cài

Theo tài liệu Dokploy hiện tại, máy chủ nên có tối thiểu 2 GB RAM, 30 GB disk; port 80, 443 và 3000 phải còn trống. Dokploy quản lý Traefik riêng, nên không cài chồng một reverse proxy đang chiếm 80/443 nếu chưa có kế hoạch chuyển đổi. Kiểm tra tài liệu cài đặt ở thời điểm cài, vì phiên bản/hướng dẫn có thể đổi.

Nguồn chính thức: [Yêu cầu và cài đặt Dokploy](https://docs.dokploy.com/docs/core/installation), [cài đặt thủ công và lưu ý Docker Swarm/Traefik](https://docs.dokploy.com/docs/core/manual-installation), [domains cho Docker Compose](https://docs.dokploy.com/docs/core/docker-compose/domains).

### Thực hành Dokploy theo thứ tự

1. Cài trên VPS test mới hoặc đã dọn sạch đúng điều kiện. Lưu lại IP, domain panel, version và cách đăng nhập trong README riêng tư (không lưu mật khẩu).
2. Bảo vệ panel: dùng mật khẩu mạnh, chỉ cấp người cần thiết, kiểm tra firewall; không chia sẻ tài khoản chủ sở hữu.
3. Kết nối repo Git của app. Chọn cách build rõ ràng (Dockerfile/Compose) và thiết lập branch triển khai.
4. Khai báo biến môi trường/secret trong Dokploy, không đưa vào repo. Tạo `.env.example` đầy đủ tên biến nhưng không có giá trị thật.
5. Triển khai app đơn service trước. Gắn domain bằng tính năng Domains của Dokploy; cấu hình internal port đúng port mà app thực sự lắng nghe.
6. Chuyển sang Compose app + database. Tạo persistent volume, backup schedule/backup thủ công thử nghiệm, rồi restore thử vào môi trường test.
7. Thiết lập auto-deploy qua webhook hoặc cơ chế Git tích hợp. Push thay đổi nhỏ, theo dõi build log, deploy log và URL.
8. Làm một lần release hỏng có kiểm soát và rollback. Ghi lại điều gì không do Dokploy xử lý thay bạn: migration DB, rollback schema, secret, disk full, dependency ngoài.

### Capstone bắt buộc

Triển khai một app thật nhỏ nhưng đủ vòng đời:

- App API/web có endpoint `/health`.
- PostgreSQL với named/persistent volume.
- Domain `app.tenmiencuaban...`, HTTPS hoạt động.
- CI chạy test + build; Dokploy nhận release từ Git.
- Biến môi trường/secret tách khỏi repo.
- Backup DB và restore test thành công.
- README gồm kiến trúc, lệnh kiểm tra, đường dẫn log, cách deploy/rollback, và danh sách port mở.

## 6. Checklist “đủ nền trước Dokploy”

Chỉ chuyển sang dùng Dokploy cho app thật khi bạn tự tick được toàn bộ:

- [ ] Có Dockerfile và `compose.yaml` tự viết/hiểu rõ.
- [ ] Không có secret hay `.env` thật trong Git history.
- [ ] App có health endpoint hoặc ít nhất healthcheck hợp lý.
- [ ] Database dùng persistent volume và đã restore thử từ backup.
- [ ] Biết port nội bộ của app và không public DB ra Internet.
- [ ] DNS trỏ đúng; HTTPS hoạt động; biết `curl`/log để chẩn đoán.
- [ ] Có SSH key, firewall, quy trình update server cơ bản.
- [ ] Pipeline kiểm tra mã chạy trước deploy.
- [ ] Có tag/version release và quy trình rollback đã thử.
- [ ] Theo dõi được disk, RAM, container logs; có người/địa chỉ nhận cảnh báo nếu là app quan trọng.

## 7. Những bẫy phổ biến cần tránh

| Bẫy | Hậu quả | Cách tránh |
| --- | --- | --- |
| Đưa `.env` lên Git | Lộ mật khẩu/token, khó thu hồi | `.gitignore`, secret manager/Dokploy environment, đổi secret nếu lỡ lộ |
| Dùng `latest` cho production | Không biết đang chạy bản nào, rollback khó | Dùng tag version hoặc commit SHA |
| Chạy DB không có volume | Mất dữ liệu khi recreate container | Named volume + backup + restore test |
| Expose `5432/3306/6379` công khai | Bị quét/tấn công | Chỉ để trong Docker network nội bộ |
| Cài Dokploy lên VPS đã chạy Nginx/Traefik | Xung đột 80/443 | Dùng VPS mới hoặc lập kế hoạch migration |
| “Có backup” nhưng chưa restore | Backup vô dụng lúc sự cố | Lập lịch restore drill định kỳ |
| Đọc log sau cùng | Sự cố kéo dài, không biết đường đi request | Healthcheck, logs, alert và runbook |
| Học quá nhiều công cụ | Không hoàn thành được hệ thống nào | Ưu tiên Linux → Docker → Compose → networking → CI/CD → Dokploy |

## 8. Sau Dokploy nên học gì

Sau capstone, chọn theo nhu cầu thực tế:

1. **Ansible** để tự động chuẩn bị server, quản lý user/SSH/firewall/package.
2. **Terraform/OpenTofu** để tạo hạ tầng có thể tái lập (VPS, DNS, object storage).
3. **Monitoring sâu hơn:** Prometheus, Grafana, Loki, alert routing.
4. **Security:** image scanning, dependency scanning, SBOM, secrets rotation, access review.
5. **Kubernetes** chỉ khi workload/team/scale cần nó. Nền Compose và observability ở trên vẫn dùng nguyên giá trị.

## 9. Cách dùng workspace này để theo tiến độ

Đề xuất cấu trúc sau khi bắt đầu:

```text
devops/
├── README.md                 # mục tiêu và tiến độ tuần
├── week-01-linux-git/
├── week-02-docker/
├── week-03-compose/
├── week-04-networking-tls/
├── week-05-cicd-observability/
├── week-06-dokploy-capstone/
└── runbooks/                 # deploy, incident, backup-restore, rollback
```

Mỗi buổi học hãy ghi ba dòng: **đã làm**, **lỗi gặp**, **điều đã hiểu**. Khi cần review, gửi mình thư mục/bài lab bạn vừa làm hoặc nhắn “kiểm tra tuần N”; mình sẽ bám theo checklist, giải thích lỗi và giao bước tiếp theo phù hợp.

