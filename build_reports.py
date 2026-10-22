import re
# -*- coding: utf-8 -*-
"""
Generator for:
- reports/TONG_QUAN_3_KHOA_HOC_MASTER_CURRICULUM.md
- reports/TONG_QUAN_3_KHOA_HOC_MASTER_CURRICULUM.html
"""

import os
import json
from generate_master_curriculum_reports import build_data

def generate_markdown(data):
    md = []
    md.append("# BÁO CÁO TOÀN DIỆN & TỔNG QUAN CHI TIẾT 3 KHÓA HỌC")
    md.append("## BACKEND INTERNALS, SYSTEM DESIGN & KAFKA MASTERY")
    md.append("")
    md.append("> **Mục tiêu**: Báo cáo tổng hợp, phân tích chi tiết từng bài giảng và từng slide tài liệu của 3 khóa học trọng điểm. Giúp kỹ sư có cái nhìn toàn cảnh, sâu sắc từ bản chất tầng sâu hệ điều hành / database engine (Khóa 1), tư duy thiết kế kiến trúc phân tán chịu tải cao (Khóa 2), đến hạ tầng truyền sự kiện và streaming phân tán với Apache Kafka (Khóa 3).")
    md.append("> ")
    md.append("> Toàn bộ nội dung tuân thủ triết lý tại `AGENTS.md`: **Anti Over-Engineering**, **Thực chiến trực quan**, **Mô hình tích lũy cuốn chiếu (Cumulative Integration)**.")
    md.append("")
    md.append("---")
    md.append("")
    md.append("## 0. CHIẾN LƯỢC HỌC SIÊU TỐC: KHAI TỬ VIDEO 2 GIỜ & PHƯƠNG PHÁP ĐỌC ĐẢO NGƯỢC (HIGH-THROUGHPUT LEARNING)")
    md.append("")
    md.append("> **Phản biện từ CTO**: Ý định *\"lười xem video record 2 tiếng\"* là một bản năng tự vệ sinh học hoàn toàn chính xác. Một video bài giảng 120 phút thường chỉ có 20-25 phút kiến thức cốt lõi; 95-100 phút còn lại là nhiễu (Low Signal-to-Noise Ratio).")
    md.append("> ")
    md.append("> Thay vì tiêu tốn 80-100 giờ ngồi xem thụ động (với tỷ lệ nhớ < 15%), ta chuyển sang **Quy trình Thực thi Chủ động 4 Bước (Active Tactile Learning)** cắt giảm 70% thời gian nhưng nâng tỷ lệ làm chủ lên > 80%:")
    md.append("> ")
    md.append("> 1. **Bước 1 (10-15m) - Fast Scan Spec**: Mở file Markdown trong `Tài Liệu/advanced_backend/` đọc quét cấu trúc và 3 bất biến kiến trúc (nhanh gấp 5 lần tốc độ nói video).")
    md.append("> 2. **Bước 2 (20-25m) - Tactile Lab & Bẻ Gãy Code**: Vào `labs/` chạy các lab ESM, cố tình làm sai/phá hỏng để nhìn số liệu đo đạc (`EXPLAIN BUFFERS`, `pg_locks`, `latency`).")
    md.append("> 3. **Bước 3 (10m) - Socratic AI Sparring**: Mở chat bắt AI OMP đóng vai Tech Lead khó tính tra khảo 3 câu hỏi edge-cases và war stories thực tế.")
    md.append("> 4. **Bước 4 (Tối đa 5m) - Video as L3 Cache**: Chỉ mở video KÉO ĐÚNG THANH TUA xem 3-5 phút nếu có thắc mắc chưa giải tỏa sau Bước 2 & 3.")
    md.append("")
    md.append("---")
    md.append("")
    md.append("## 1. Bảng Chỉ Số Tổng Quan (KPI Dashboard)")
    md.append("")
    md.append("| Chỉ Số | Giá Trị Thực Tế | Chi Tiết Nội Dung |")
    md.append("| :--- | :--- | :--- |")
    for k in data["kpi"]:
        md.append(f"| **{k['label']}** | `{k['value']}` | {k['desc']} |")
    md.append("")
    md.append("---")
    md.append("")
    md.append("## 2. Bản Đồ Mối Quan Hệ Hữu Cơ & Ma Trận Bổ Trợ Giữa 3 Khóa Học")
    md.append("")
    md.append("Ba khóa học không tách rời mà tạo thành một **tam giác năng lực hoàn chỉnh** cho Kỹ sư Backend cấp cao (Senior Backend / System Architect):")
    md.append("")
    md.append("```")
    md.append("                                   [KHÓA 2: SYSTEM DESIGN]")
    md.append("                             Highly Concurrent Systems (Roninhub)")
    md.append("                                        ▲             ▲")
    md.append("                        Scale-out, Sharding,    │             │  Distributed Tx (Saga),")
    md.append("                        Rate Limit, Estimation  │             │  Trade-offs, Push vs Pull")
    md.append("                                                │             │")
    md.append("                    ┌───────────────────────────┴─────────────┴───────────────────────────┐")
    md.append("                    │                                                                     │")
    md.append("         [KHÓA 1: ADVANCED BACKEND]                                            [KHÓA 3: KAFKA NÂNG CAO]")
    md.append("      Backend Internals (Single-Node)                                      Event Streaming & Microservices")
    md.append("   ─────────────────────────────────────                                ────────────────────────────────────")
    md.append("   • OS: Paging, epoll, Zero-Copy                                       • Engine: Sequential I/O, Page Cache")
    md.append("   • DB: B-Tree, MVCC, Locks, WAL               Outbox Pattern          • Zero-Copy (sendfile), Batching")
    md.append("   • Cache: Stampede, Bloom Filter     ──────────────────────────────►  • Partitioning, Idempotent Producer")
    md.append("   • Arch: Clean Architecture, DDD             Debezium CDC             • Consumer Rebalance, Liveness")
    md.append("   • Resilience: Retry, Circuit Breaker                                 • Exactly-Once, Fraud Detection")
    md.append("```")
    md.append("")
    md.append("### Ma Trận Đối So sánh & Bổ Trợ Trực Tiếp:")
    md.append("")
    md.append("| Khía Cạnh Kỹ Thuật | Khóa 1: Advanced Backend | Khóa 2: System Design (Roninhub) | Khóa 3: Kafka Nâng Cao (Roninhub) | Mối Liên Kết Tích Hợp |")
    md.append("| :--- | :--- | :--- | :--- | :--- |")
    md.append("| **Tầng Lưu Trữ (Storage)** | Đi sâu vào cấu trúc B-Tree, Heap Tuple, HOT update, WAL, MVCC và các loại khóa (Row, Gap, Next-Key lock) trên 1 database node. | Mở rộng quy mô vượt ngưỡng 20k QPS bằng Range/Hash Partitioning, Sharding đa máy chủ, chọn Partition Key chống Hotspot. | Sử dụng Transactional Outbox Pattern kết hợp Debezium CDC đọc trực tiếp WAL của Postgres để phát event sang Kafka mà không bị lỗi Dual-Write. | Khóa 1 là nền móng để Khóa 2 sharding an toàn và Khóa 3 trích xuất dữ liệu không trễ. |")
    md.append("| **Tầng Caching & Tải** | Giải quyết 4 bệnh kinh điển: Stampede (Singleflight), Avalanche (Jitter), Penetration (Bloom Filter), Race Condition xóa cache. | Định vị Cache đa tầng (CDN, Reverse Proxy, Redis Cluster 16,384 slots), 5 thuật toán Rate Limiting (Token/Leaky Bucket). | Sử dụng Kafka làm bộ đệm Buffer / Traffic Smoothing để hấp thụ đỉnh tải trước khi đổ vào Cache và Database. | Cả 3 kết hợp thành một 'tấm khiên' 4 lớp chống sập hệ thống khi có Flash Sale. |")
    md.append("| **Giao Tiếp & Phân Tán** | Giao thức TCP Handshake, TLS 1.3, HTTP/1.1 vs HTTP/2 vs HTTP/3, WebSocket, Idempotent Webhooks. | So sánh REST vs gRPC over HTTP/2, WebSocket vs SSE, Phân rã Microservices qua Bounded Context, Saga Pattern (Orchestration vs Choreography). | Đi sâu vào Distributed Event Streaming, Consumer Groups, Cooperative Rebalance, Producer ACKs, Exactly-Once Semantics. | Từ kiến trúc mạng máy tính (K1) $\\rightarrow$ Thiết kế giao tiếp microservices (K2) $\\rightarrow$ Triển khai hạ tầng truyền tin bất đồng bộ (K3). |")
    md.append("| **Hiệu Năng & Kernel** | Phân tích User Space vs Kernel Space, System Calls, I/O Multiplexing (epoll), Zero-Copy `sendfile`. | Mô hình luồng Reactor Pattern (Netty), LMAX Disruptor Lock-Free Ring Buffer, Quản lý timer bằng Hashed Wheel Timer. | Ứng dụng thực tế của Sequential Disk I/O, OS Page Cache, Zero-Copy và Batching/Compression để đạt hàng triệu message/giây. | Khóa 1 giải thích lý thuyết OS $\\rightarrow$ Khóa 2 đưa vào giải thuật $\\rightarrow$ Khóa 3 chứng minh trong engine Kafka. |")
    md.append("")
    md.append("---")
    md.append("")

    for c in data["courses"]:
        md.append(f"## 3.{c['id'][1]} {c['title']}")
        md.append("")
        md.append(f"> **Giảng viên / Nguồn**: {c['instructor']}  ")
        md.append(f"> **Định vị**: *{c['tagline']}*  ")
        md.append(f"> **Quy mô**: `{c['badge']}`")
        md.append("")
        md.append(f"**Mô tả tổng quan**: {c['description']}")
        md.append("")
        md.append("### Bảng Chi Tiết Từng Bài Giảng & Nội Dung Slide:")
        md.append("")
        for m in c["modules"]:
            md.append(f"#### Bài {m['stt']}: {m['name']}")
            md.append(f"- 📁 **File tài liệu gốc**: `{m['file']}`")
            md.append(f"- 🏷️ **Tags / Chủ đề**: `{'`, `'.join(m['tags'])}`")
            md.append(f"- 💡 **Tóm tắt chuyên đề**: {m['summary']}")
            md.append("- 🔬 **Trọng tâm kiến thức chuyên sâu (Internals)**:")
            for item in m["internals"]:
                md.append(f"  + {item}")
            md.append("- 🛡️ **Các vấn đề thực tế giải quyết được (Problems Solved)**:")
            for item in m["problems_solved"]:
                md.append(f"  + {item}")
            md.append(f"- 📦 **Thực hành / Artifacts liên quan**: {m['artifacts']}")
            md.append("")
        md.append("---")
        md.append("")

    # Lộ trình 5 giai đoạn
    md.append("""## 4. LỘ TRÌNH THỰC CHIẾN CHÍNH THỨC: 4 CHẶNG TÍCH LŨY LIÊN HOÀN (SINGLE SOURCE OF TRUTH)

> **Nguyên tắc**: Bắt đầu ngay từ **Bài 03: Index (đang học)**, hoàn thành dứt điểm cụm Database của Khóa 1 ➔ cụm Hệ thống & Cache ➔ chuyển sang Khóa 3 (Kafka) ➔ về đích tại Khóa 2 (System Design). Không nhảy cóc lung tung!

```text
CHẶNG 1: DỨT ĐIỂM CỤM DATABASE & GIAO DỊCH ACID (KHÓA 1)
├── 1. Khóa 1 - Bài 03: Database Index (ĐANG HỌC NGAY BÂY GIỜ - B-Tree, Heap TID, 11 Labs)
├── 2. Khóa 1 - Bài 04 & 07: Clean Architecture & Data Modeling (Domain, Double-Entry Ledger)
├── 3. Khóa 1 - Bài 12: Database Transaction & MVCC (ACID, WAL log, 4 Isolation Levels, xmin/xmax)
└── 4. Khóa 1 - Bài 14: Database Locking & Concurrency (Row Lock, FOR UPDATE, Resource Ordering phá Deadlock)
➔ [Sản phẩm đầu ra]: 1 Core Ledger Service an toàn dữ liệu 100%, không bao giờ bị âm tiền hay mất mát giao dịch.

CHẶNG 2: DỨT ĐIỂM CỤM MẠNG, OS & CACHE BẢO VỆ TẢI (KHÓA 1)
├── 5. Khóa 1 - Bài 05: Computer Networking (TCP 3-way/4-way, TLS 1.3, HTTP/2 Multiplexing, WebSocket)
├── 6. Khóa 1 - Bài 06: Redis Mastery (Single-threaded event loop, SDS, skiplist, Khóa phân tán Redlock)
├── 7. Khóa 1 - Bài 15: Linux OS Internals (Virtual Memory, epoll, Page Cache, Zero-Copy sendfile)
└── 8. Khóa 1 - Bài 16: System Integration & Resilience (Retry Backoff + Full Jitter, Circuit Breaker)
➔ [Sản phẩm đầu ra]: Tấm khiên Cache-Aside và Rate Limiting bảo vệ Core Ledger trước tải đỉnh Flash Sale.

CHẶNG 3: HẠ TẦNG SỰ KIỆN PHÂN TÁN BẤT ĐỒNG BỘ (KHÓA 3: KAFKA NÂNG CAO)
├── 9.  Khóa 3 - Bài 01-05: Kafka Core & Producer (Kế thừa Zero-Copy K1-15, acks=all, enable.idempotence=true)
├── 10. Khóa 3 - Bài 07-08: Consumer Groups, Cooperative Sticky Rebalance, Liveness Threads
├── 11. Khóa 3 - Bài 09: Transactional Outbox Pattern + Debezium CDC (Giải quyết triệt để thảm họa Dual-Write)
└── 12. Khóa 3 - Bài 10: Case Study Real-Time Fraud Detection System (Xử lý dòng sự kiện thời gian thực)
➔ [Sản phẩm đầu ra]: Chuyển đổi hệ thống sang Event-Driven Architecture, phát sự kiện sang Kafka không bao giờ lệch pha.

CHẶNG 4: THIẾT KẾ HỆ THỐNG QUY MÔ LỚN (KHÓA 2: SYSTEM DESIGN HIGH CONCURRENCY)
├── 13. Khóa 2 - Bài 01-03: SD Methodology, Capacity Estimation (QPS, RAM, Disk) & Database Sharding
├── 14. Khóa 2 - Bài 04-06: Caching at Scale, 5 Rate Limiting Algorithms, Saga Pattern (Orchestration vs Choreography)
├── 15. Khóa 2 - Bài 08: Case Study Hệ thống rút gọn link URL Shortener (Bitly scale - Base62, Snowflake, KGS)
└── 16. Khóa 2 - Bài 09: Case Study Mạng xã hội News Feed (Threads/Twitter scale - Push vs Pull vs Hybrid Celebrity)
➔ [Sản phẩm đầu ra]: Năng lực Kiến trúc sư trưởng, tự tin phỏng vấn và thiết kế hệ thống hàng chục triệu người dùng.
```

---""")
    md.append("")
    md.append("## 5. Kết Luận & Hành Động Tiếp Theo")
    md.append("")
    md.append("- **Bản HTML tương tác cao cấp**: Đã được tạo sẵn tại `reports/TONG_QUAN_3_KHOA_HOC_MASTER_CURRICULUM.html` (kèm tính năng lọc theo khóa, tìm kiếm theo từ khóa, xem 5 sơ đồ SVG kiến trúc, và mở rộng chi tiết từng bài).")
    md.append("- **Lưu trữ chuẩn mực**: Toàn bộ báo cáo nằm trực tiếp trong project (`D:/study/advance-be/reports/`), tuân thủ nghiêm ngặt quy định không lưu ra ngoài thư mục dự án.")
    md.append("- **Khuyến nghị bắt đầu**: Bắt đầu thực hành từ các bài tập đã có sẵn trong `labs/lesson-02-caching/` và `labs/lesson-03-index/`, sau đó tuần tự tích lũy theo 5 giai đoạn đã đề ra.")
    
    return "\n".join(md)

def generate_svg_architecture():
    return """<svg viewBox="0 0 1000 480" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e40af" />
      <stop offset="100%" stop-color="#3b82f6" />
    </linearGradient>
    <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#065f46" />
      <stop offset="100%" stop-color="#10b981" />
    </linearGradient>
    <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#92400e" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>
    <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#581c87" />
      <stop offset="100%" stop-color="#8b5cf6" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.4" />
    </filter>
  </defs>

  <!-- Canvas Background -->
  <rect width="1000" height="480" rx="16" fill="url(#bgGrad)" stroke="#334155" stroke-width="1.5" />

  <!-- Title -->
  <text x="500" y="38" text-anchor="middle" fill="#f8fafc" font-size="20" font-weight="700" letter-spacing="0.5">SƠ ĐỒ TỔNG THỂ KIẾN TRÚC PHÂN TÁN TÍCH HỢP 3 KHÓA HỌC</text>
  <text x="500" y="60" text-anchor="middle" fill="#94a3b8" font-size="12">End-to-End Distributed Architecture: Client ➔ Gateway ➔ Services ➔ Cache ➔ Database WAL ➔ Kafka Event Log ➔ Async Workers</text>

  <!-- Tier 1: Client & Edge -->
  <g transform="translate(40, 90)">
    <rect width="150" height="350" rx="12" fill="#1e293b" stroke="#475569" stroke-dasharray="4,4" />
    <text x="75" y="28" text-anchor="middle" fill="#38bdf8" font-size="13" font-weight="700">TẦNG 1: CLIENT & EDGE</text>
    <text x="75" y="44" text-anchor="middle" fill="#64748b" font-size="10">(Khóa 1 Bài 5, Khóa 2 Bài 4)</text>

    <!-- Client Box -->
    <rect x="15" y="65" width="120" height="60" rx="8" fill="#334155" stroke="#64748b" filter="url(#shadow)" />
    <text x="75" y="93" text-anchor="middle" fill="#f8fafc" font-size="12" font-weight="600">Web / Mobile Apps</text>
    <text x="75" y="110" text-anchor="middle" fill="#94a3b8" font-size="10">HTTP/2, WebSocket</text>

    <!-- CDN / Edge Box -->
    <rect x="15" y="150" width="120" height="70" rx="8" fill="#334155" stroke="#64748b" filter="url(#shadow)" />
    <text x="75" y="178" text-anchor="middle" fill="#f8fafc" font-size="12" font-weight="600">CDN & WAF</text>
    <text x="75" y="195" text-anchor="middle" fill="#94a3b8" font-size="10">Cloudflare Edge</text>
    <text x="75" y="210" text-anchor="middle" fill="#38bdf8" font-size="9">Static Assets Cache</text>

    <!-- API Gateway Box -->
    <rect x="15" y="245" width="120" height="85" rx="8" fill="url(#blueGrad)" filter="url(#shadow)" />
    <text x="75" y="272" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="700">API Gateway</text>
    <text x="75" y="290" text-anchor="middle" fill="#e0f2fe" font-size="10">Rate Limiter (Token)</text>
    <text x="75" y="306" text-anchor="middle" fill="#e0f2fe" font-size="10">Auth & Idempotency</text>
    <text x="75" y="322" text-anchor="middle" fill="#bae6fd" font-size="9">Reverse Proxy / Nginx</text>
  </g>

  <!-- Flow 1 -> 2 Arrow -->
  <path d="M 190 287 L 240 287" stroke="#38bdf8" stroke-width="2.5" marker-end="url(#arrow)" />

  <!-- Tier 2: Microservices Clean Architecture -->
  <g transform="translate(240, 90)">
    <rect width="210" height="350" rx="12" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5" />
    <text x="105" y="28" text-anchor="middle" fill="#60a5fa" font-size="13" font-weight="700">TẦNG 2: MICROSERVICES</text>
    <text x="105" y="44" text-anchor="middle" fill="#64748b" font-size="10">(Khóa 1 Bài 1,4,13, Khóa 2 Bài 6)</text>

    <!-- Order Service Box -->
    <rect x="15" y="65" width="180" height="75" rx="8" fill="#1e3a8a" stroke="#3b82f6" filter="url(#shadow)" />
    <text x="105" y="92" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="700">Order Service (Clean Arch)</text>
    <text x="105" y="110" text-anchor="middle" fill="#bfdbfe" font-size="10">Domain Entity & Use Cases</text>
    <text x="105" y="126" text-anchor="middle" fill="#93c5fd" font-size="9">Saga Orchestrator / Choreo</text>

    <!-- Payment Service Box -->
    <rect x="15" y="155" width="180" height="75" rx="8" fill="#1e3a8a" stroke="#3b82f6" filter="url(#shadow)" />
    <text x="105" y="182" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="700">Payment & Ledger Service</text>
    <text x="105" y="200" text-anchor="middle" fill="#bfdbfe" font-size="10">Double-Entry Ledger</text>
    <text x="105" y="216" text-anchor="middle" fill="#93c5fd" font-size="9">Circuit Breaker & Backoff</text>

    <!-- Feed / Shortener Service Box -->
    <rect x="15" y="245" width="180" height="85" rx="8" fill="#1e3a8a" stroke="#3b82f6" filter="url(#shadow)" />
    <text x="105" y="272" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="700">Feed & URL Services</text>
    <text x="105" y="290" text-anchor="middle" fill="#bfdbfe" font-size="10">Base62 KGS / Snowflake ID</text>
    <text x="105" y="306" text-anchor="middle" fill="#bfdbfe" font-size="10">Push/Pull Hybrid Feeds</text>
    <text x="105" y="322" text-anchor="middle" fill="#93c5fd" font-size="9">Non-blocking Reactor I/O</text>
  </g>

  <!-- Flow 2 -> 3 Arrow -->
  <path d="M 450 190 L 490 190" stroke="#10b981" stroke-width="2.5" />
  <path d="M 450 287 L 490 287" stroke="#10b981" stroke-width="2.5" />

  <!-- Tier 3: Storage & Caching Layer -->
  <g transform="translate(490, 90)">
    <rect width="210" height="350" rx="12" fill="#1e293b" stroke="#10b981" stroke-width="1.5" />
    <text x="105" y="28" text-anchor="middle" fill="#34d399" font-size="13" font-weight="700">TẦNG 3: STORAGE & CACHE</text>
    <text x="105" y="44" text-anchor="middle" fill="#64748b" font-size="10">(Khóa 1 Bài 2,3,6,12,14; Khóa 2 Bài 3,4)</text>

    <!-- Redis Cache Box -->
    <rect x="15" y="65" width="180" height="95" rx="8" fill="url(#greenGrad)" filter="url(#shadow)" />
    <text x="105" y="90" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="700">Redis Cluster (16K Slots)</text>
    <text x="105" y="108" text-anchor="middle" fill="#d1fae5" font-size="10">Cache-Aside + Singleflight</text>
    <text x="105" y="124" text-anchor="middle" fill="#d1fae5" font-size="10">Bloom Filter (Penetration)</text>
    <text x="105" y="140" text-anchor="middle" fill="#a7f3d0" font-size="9">Redlock & TTL Jitter</text>

    <!-- PostgreSQL Box -->
    <rect x="15" y="175" width="180" height="155" rx="8" fill="#064e3b" stroke="#10b981" filter="url(#shadow)" />
    <text x="105" y="200" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="700">PostgreSQL (Sharded / Part)</text>
    <text x="105" y="218" text-anchor="middle" fill="#a7f3d0" font-size="10">B-Tree + Covering Index</text>
    <text x="105" y="234" text-anchor="middle" fill="#a7f3d0" font-size="10">MVCC (xmin/xmax) + Locks</text>
    <text x="105" y="250" text-anchor="middle" fill="#6ee7b7" font-size="10">WAL (Write-Ahead Log)</text>

    <!-- Outbox Table Highlight -->
    <rect x="25" y="262" width="160" height="55" rx="6" fill="#047857" stroke="#34d399" />
    <text x="105" y="282" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="700">Transactional Outbox</text>
    <text x="105" y="298" text-anchor="middle" fill="#d1fae5" font-size="9">ACID Atomic with Business Data</text>
    <text x="105" y="310" text-anchor="middle" fill="#a7f3d0" font-size="8">Debezium CDC tailing WAL</text>
  </g>

  <!-- Flow 3 -> 4 Arrow (CDC to Kafka) -->
  <path d="M 700 290 L 740 290" stroke="#f59e0b" stroke-width="2.5" />
  <text x="720" y="280" text-anchor="middle" fill="#fbbf24" font-size="9" font-weight="700">CDC</text>

  <!-- Tier 4: Event Streaming & Async Backbone -->
  <g transform="translate(740, 90)">
    <rect width="220" height="350" rx="12" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5" />
    <text x="110" y="28" text-anchor="middle" fill="#fbbf24" font-size="13" font-weight="700">TẦNG 4: KAFKA & ASYNC</text>
    <text x="110" y="44" text-anchor="middle" fill="#64748b" font-size="10">(Khóa 3 Toàn Bộ 13 Chuyên Đề)</text>

    <!-- Kafka Cluster Box -->
    <rect x="15" y="65" width="190" height="130" rx="8" fill="url(#amberGrad)" filter="url(#shadow)" />
    <text x="110" y="90" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="700">Apache Kafka Cluster</text>
    <text x="110" y="108" text-anchor="middle" fill="#fef3c7" font-size="10">Sequential I/O + Page Cache</text>
    <text x="110" y="124" text-anchor="middle" fill="#fef3c7" font-size="10">Linux Zero-Copy (sendfile)</text>
    <text x="110" y="140" text-anchor="middle" fill="#fef3c7" font-size="10">Idempotent Producer (PID+Seq)</text>
    <text x="110" y="156" text-anchor="middle" fill="#fde68a" font-size="9">Cooperative Sticky Rebalance</text>
    <text x="110" y="172" text-anchor="middle" fill="#fde68a" font-size="9">Exactly-Once Semantics (EOS)</text>
    <text x="110" y="188" text-anchor="middle" fill="#ffffff" font-size="9">Schema Registry (Avro)</text>

    <!-- Downstream Consumers Box -->
    <rect x="15" y="210" width="190" height="120" rx="8" fill="#78350f" stroke="#f59e0b" filter="url(#shadow)" />
    <text x="110" y="235" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="700">Downstream & Workers</text>
    <text x="110" y="253" text-anchor="middle" fill="#fde68a" font-size="10">1. Real-time Fraud Detection</text>
    <text x="110" y="270" text-anchor="middle" fill="#fef3c7" font-size="9">Flink / Kafka Streams Scoring</text>
    <text x="110" y="288" text-anchor="middle" fill="#fde68a" font-size="10">2. Async Heavy Task Worker</text>
    <text x="110" y="305" text-anchor="middle" fill="#fef3c7" font-size="9">Export Excel ➔ S3 Presigned URL</text>
    <text x="110" y="322" text-anchor="middle" fill="#fde68a" font-size="10">3. Notification & Email Service</text>
  </g>
</svg>"""

def generate_svg_roadmap():
    return """<svg viewBox="0 0 1000 370" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <linearGradient id="p1Grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#059669" />
      <stop offset="100%" stop-color="#10b981" />
    </linearGradient>
    <linearGradient id="p2Grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1e40af" />
      <stop offset="100%" stop-color="#3b82f6" />
    </linearGradient>
    <linearGradient id="p3Grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#d97706" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>
    <linearGradient id="p4Grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6d28d9" />
      <stop offset="100%" stop-color="#8b5cf6" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1000" height="370" rx="14" fill="#0f172a" stroke="#334155" stroke-width="1.5" />
  <text x="500" y="32" text-anchor="middle" fill="#f8fafc" font-size="16" font-weight="700">LỘ TRÌNH THỰC CHIẾN CHÍNH THỨC: 4 CHẶNG TÍCH LŨY LIÊN HOÀN (SINGLE SOURCE OF TRUTH)</text>
  <text x="500" y="52" text-anchor="middle" fill="#94a3b8" font-size="11">Khởi đầu từ Bài 03 (Index) đang học ➔ Lõi Database ACID ➔ Mạng, OS &amp; Cache ➔ Kafka Event-Driven ➔ System Architect</text>

  <!-- Chặng 1 -->
  <g transform="translate(30, 75)">
    <rect width="215" height="270" rx="10" fill="#1e293b" stroke="#10b981" stroke-width="2" />
    <path d="M 0 0 L 215 0 L 215 38 L 0 38 Z" fill="url(#p1Grad)" rx="8" />
    <text x="107" y="24" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="700">CHẶNG 1: LÕI DATABASE</text>
    <text x="107" y="55" text-anchor="middle" fill="#34d399" font-size="10" font-weight="700">CSDL &amp; GIAO DỊCH (KHÓA 1)</text>

    <text x="12" y="80" fill="#fde68a" font-size="10" font-weight="700">1. K1-03: Index (Đang học!)</text>
    <text x="12" y="96" fill="#94a3b8" font-size="9">   (B-Tree, Heap TID, 11 Labs)</text>
    
    <text x="12" y="116" fill="#cbd5e1" font-size="10">2. K1-04 &amp; 07: Clean Arch &amp; Model</text>
    <text x="12" y="132" fill="#94a3b8" font-size="9">   (Domain, Double-Entry Ledger)</text>

    <text x="12" y="152" fill="#cbd5e1" font-size="10">3. K1-12: Transaction &amp; MVCC</text>
    <text x="12" y="168" fill="#94a3b8" font-size="9">   (ACID, WAL log, xmin/xmax)</text>

    <text x="12" y="188" fill="#cbd5e1" font-size="10">4. K1-14: Locking &amp; Concurrency</text>
    <text x="12" y="204" fill="#94a3b8" font-size="9">   (FOR UPDATE, Deadlock phá)</text>

    <rect x="10" y="225" width="195" height="32" rx="5" fill="#064e3b" />
    <text x="107" y="245" text-anchor="middle" fill="#a7f3d0" font-size="10" font-weight="700">🎯 Lõi Ledger Trừ Tiền ACID</text>
  </g>

  <!-- Chặng 2 -->
  <g transform="translate(270, 75)">
    <rect width="215" height="270" rx="10" fill="#1e293b" stroke="#3b82f6" stroke-width="2" />
    <path d="M 0 0 L 215 0 L 215 38 L 0 38 Z" fill="url(#p2Grad)" rx="8" />
    <text x="107" y="24" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="700">CHẶNG 2: MẠNG &amp; CACHE</text>
    <text x="107" y="55" text-anchor="middle" fill="#60a5fa" font-size="10" font-weight="700">BẢO VỆ TẢI &amp; OS (KHÓA 1)</text>

    <text x="12" y="80" fill="#cbd5e1" font-size="10">5. K1-05: Networking</text>
    <text x="12" y="96" fill="#94a3b8" font-size="9">   (TCP, TLS 1.3, HTTP/2, WS)</text>

    <text x="12" y="116" fill="#cbd5e1" font-size="10">6. K1-06: Redis Mastery</text>
    <text x="12" y="132" fill="#94a3b8" font-size="9">   (Event loop, skiplist, Redlock)</text>

    <text x="12" y="152" fill="#cbd5e1" font-size="10">7. K1-15: Linux OS Internals</text>
    <text x="12" y="168" fill="#94a3b8" font-size="9">   (Virtual Memory, Zero-Copy)</text>

    <text x="12" y="188" fill="#cbd5e1" font-size="10">8. K1-16: Integration &amp; Resilience</text>
    <text x="12" y="204" fill="#94a3b8" font-size="9">   (Retry + Jitter, Circuit Breaker)</text>

    <rect x="10" y="225" width="195" height="32" rx="5" fill="#1e3a8a" />
    <text x="107" y="245" text-anchor="middle" fill="#bfdbfe" font-size="10" font-weight="700">🛡️ Khiên Chống Sập FlashSale</text>
  </g>

  <!-- Chặng 3 -->
  <g transform="translate(510, 75)">
    <rect width="215" height="270" rx="10" fill="#1e293b" stroke="#f59e0b" stroke-width="2" />
    <path d="M 0 0 L 215 0 L 215 38 L 0 38 Z" fill="url(#p3Grad)" rx="8" />
    <text x="107" y="24" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="700">CHẶNG 3: KAFKA STREAMING</text>
    <text x="107" y="55" text-anchor="middle" fill="#fbbf24" font-size="10" font-weight="700">BẤT ĐỒNG BỘ (KHÓA 3)</text>

    <text x="12" y="80" fill="#cbd5e1" font-size="10">9. K3-01..05: Producer Internals</text>
    <text x="12" y="96" fill="#94a3b8" font-size="9">   (Zero-Copy, acks=all, idempotent)</text>

    <text x="12" y="116" fill="#cbd5e1" font-size="10">10. K3-07..08: Consumer Groups</text>
    <text x="12" y="132" fill="#94a3b8" font-size="9">   (Sticky Rebalance, Liveness)</text>

    <text x="12" y="152" fill="#cbd5e1" font-size="10">11. K3-09: Outbox Pattern + CDC</text>
    <text x="12" y="168" fill="#94a3b8" font-size="9">   (Debezium đọc WAL ➔ Kafka)</text>

    <text x="12" y="188" fill="#cbd5e1" font-size="10">12. K3-10: Fraud Detection Engine</text>
    <text x="12" y="204" fill="#94a3b8" font-size="9">   (Stream processing real-time)</text>

    <rect x="10" y="225" width="195" height="32" rx="5" fill="#78350f" />
    <text x="107" y="245" text-anchor="middle" fill="#fde68a" font-size="10" font-weight="700">⚡ Event-Driven &amp; Zero Lag</text>
  </g>

  <!-- Chặng 4 -->
  <g transform="translate(750, 75)">
    <rect width="220" height="270" rx="10" fill="#1e293b" stroke="#8b5cf6" stroke-width="2" />
    <path d="M 0 0 L 220 0 L 220 38 L 0 38 Z" fill="url(#p4Grad)" rx="8" />
    <text x="110" y="24" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="700">CHẶNG 4: SYSTEM DESIGN</text>
    <text x="110" y="55" text-anchor="middle" fill="#a78bfa" font-size="10" font-weight="700">KIẾN TRÚC LỚN (KHÓA 2)</text>

    <text x="12" y="80" fill="#cbd5e1" font-size="10">13. K2-01..03: Scale &amp; Sharding</text>
    <text x="12" y="96" fill="#94a3b8" font-size="9">   (Estimation, CAP, Partition Key)</text>

    <text x="12" y="116" fill="#cbd5e1" font-size="10">14. K2-04..06: Rate Limit &amp; Saga</text>
    <text x="12" y="132" fill="#94a3b8" font-size="9">   (Token Bucket, Saga Phân Tán)</text>

    <text x="12" y="152" fill="#cbd5e1" font-size="10">15. K2-08: URL Shortener Bitly</text>
    <text x="12" y="168" fill="#94a3b8" font-size="9">   (Base62, KGS, 301 vs 302)</text>

    <text x="12" y="188" fill="#cbd5e1" font-size="10">16. K2-09: Threads News Feed</text>
    <text x="12" y="204" fill="#94a3b8" font-size="9">   (Push vs Pull vs Hybrid Celebrity)</text>

    <rect x="10" y="225" width="200" height="32" rx="5" fill="#4c1d95" />
    <text x="110" y="245" text-anchor="middle" fill="#ddd6fe" font-size="10" font-weight="700">👑 High-Concurrency Architect</text>
  </g>
</svg>"""


def generate_svg_outbox():
    return """<svg viewBox="0 0 900 320" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <!-- Background -->
  <rect width="900" height="320" rx="12" fill="#0f172a" stroke="#334155" stroke-width="1.5" />
  <text x="450" y="32" text-anchor="middle" fill="#f8fafc" font-size="16" font-weight="700">GIẢI PHÁP TRIỆT TIÊU THẢM HỌA DUAL-WRITE: TRANSACTIONAL OUTBOX PATTERN</text>
  <text x="450" y="52" text-anchor="middle" fill="#94a3b8" font-size="11">Khóa 1 (Bài 12 Transaction) ➔ Khóa 2 (Bài 6 Saga Event) ➔ Khóa 3 (Bài 9 Problems & Patterns)</text>

  <!-- Left: Service -->
  <rect x="30" y="80" width="190" height="210" rx="10" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5" />
  <text x="125" y="110" text-anchor="middle" fill="#60a5fa" font-size="13" font-weight="700">Order Service</text>
  <text x="125" y="130" text-anchor="middle" fill="#94a3b8" font-size="10">User Request:</text>
  <text x="125" y="148" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600">POST /api/orders</text>

  <rect x="45" y="170" width="160" height="100" rx="6" fill="#1e3a8a" stroke="#60a5fa" />
  <text x="125" y="195" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="700">Single Local Tx</text>
  <text x="125" y="215" text-anchor="middle" fill="#bfdbfe" font-size="10">1. INSERT into orders</text>
  <text x="125" y="235" text-anchor="middle" fill="#bfdbfe" font-size="10">2. INSERT into outbox</text>
  <text x="125" y="255" text-anchor="middle" fill="#93c5fd" font-size="9" font-weight="700">COMMIT (ACID Atomic)</text>

  <!-- Arrow Service -> DB -->
  <path d="M 220 220 L 280 220" stroke="#34d399" stroke-width="2.5" />
  <text x="250" y="212" text-anchor="middle" fill="#34d399" font-size="10" font-weight="700">1-Step</text>

  <!-- Middle: Database -->
  <rect x="280" y="80" width="230" height="210" rx="10" fill="#064e3b" stroke="#10b981" stroke-width="1.5" />
  <text x="395" y="110" text-anchor="middle" fill="#34d399" font-size="13" font-weight="700">PostgreSQL Database</text>

  <rect x="300" y="130" width="190" height="60" rx="6" fill="#047857" />
  <text x="395" y="155" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="600">Table: orders</text>
  <text x="395" y="175" text-anchor="middle" fill="#a7f3d0" font-size="9">Business Data Saved</text>

  <rect x="300" y="200" width="190" height="75" rx="6" fill="#065f46" stroke="#34d399" stroke-width="1.5" />
  <text x="395" y="223" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="700">Table: outbox</text>
  <text x="395" y="243" text-anchor="middle" fill="#d1fae5" font-size="9">id, aggregate_id, event_type,</text>
  <text x="395" y="260" text-anchor="middle" fill="#d1fae5" font-size="9">payload (JSONB), created_at</text>

  <!-- Arrow DB -> Debezium CDC -->
  <path d="M 510 235 L 560 235" stroke="#fbbf24" stroke-width="2.5" />
  <text x="535" y="225" text-anchor="middle" fill="#fbbf24" font-size="9" font-weight="700">WAL Log</text>

  <!-- CDC Engine -->
  <rect x="560" y="150" width="130" height="110" rx="8" fill="#78350f" stroke="#f59e0b" stroke-width="1.5" />
  <text x="625" y="180" text-anchor="middle" fill="#fbbf24" font-size="12" font-weight="700">Debezium CDC</text>
  <text x="625" y="200" text-anchor="middle" fill="#fde68a" font-size="9">Tailing WAL Log</text>
  <text x="625" y="218" text-anchor="middle" fill="#fef3c7" font-size="9">Zero-Poll Overhead</text>
  <text x="625" y="240" text-anchor="middle" fill="#ffffff" font-size="9" font-weight="600">Near Zero Latency</text>

  <!-- Arrow CDC -> Kafka -->
  <path d="M 690 205 L 730 205" stroke="#f59e0b" stroke-width="2.5" />

  <!-- Right: Kafka Topic -->
  <rect x="730" y="80" width="140" height="210" rx="10" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5" />
  <text x="800" y="110" text-anchor="middle" fill="#fbbf24" font-size="13" font-weight="700">Apache Kafka</text>
  <rect x="745" y="130" width="110" height="70" rx="6" fill="#b45309" />
  <text x="800" y="155" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="700">Topic: orders</text>
  <text x="800" y="175" text-anchor="middle" fill="#fef3c7" font-size="9">Partitioned by</text>
  <text x="800" y="190" text-anchor="middle" fill="#ffffff" font-size="9" font-weight="600">user_id (Order)</text>

  <rect x="745" y="215" width="110" height="65" rx="6" fill="#334155" />
  <text x="800" y="238" text-anchor="middle" fill="#38bdf8" font-size="10" font-weight="600">Consumers</text>
  <text x="800" y="255" text-anchor="middle" fill="#94a3b8" font-size="9">Email, Payment,</text>
  <text x="800" y="270" text-anchor="middle" fill="#94a3b8" font-size="9">Fraud Detection</text>
</svg>"""

def generate_svg_zerocopy():
    return """<svg viewBox="0 0 900 280" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <rect width="900" height="280" rx="12" fill="#0f172a" stroke="#334155" stroke-width="1.5" />
  <text x="450" y="30" text-anchor="middle" fill="#f8fafc" font-size="16" font-weight="700">SO SÁNH CƠ CHẾ TRUYỀN DỮ LIỆU: TRUYỀN THỐNG (BIO) VS KAFKA ZERO-COPY</text>
  <text x="450" y="50" text-anchor="middle" fill="#94a3b8" font-size="11">Khóa 1 (Bài 15 OS Internals) ➔ Khóa 3 (Bài 2 Why Kafka High-Performance Mechanics)</text>

  <!-- Left: Traditional BIO -->
  <g transform="translate(30, 70)">
    <rect width="400" height="190" rx="8" fill="#1e293b" stroke="#ef4444" stroke-width="1.5" />
    <text x="200" y="25" text-anchor="middle" fill="#f87171" font-size="12" font-weight="700">MÔ HÌNH TRUYỀN THỐNG (4 Copies + 4 Context Switches)</text>

    <!-- Components -->
    <rect x="20" y="45" width="80" height="35" rx="4" fill="#334155" />
    <text x="60" y="67" text-anchor="middle" fill="#e2e8f0" font-size="10">Hard Disk</text>

    <rect x="120" y="45" width="100" height="35" rx="4" fill="#475569" />
    <text x="170" y="67" text-anchor="middle" fill="#e2e8f0" font-size="10">OS Page Cache</text>

    <rect x="240" y="45" width="140" height="35" rx="4" fill="#b91c1c" />
    <text x="310" y="67" text-anchor="middle" fill="#fee2e2" font-size="10" font-weight="700">User Space App Buffer</text>

    <rect x="120" y="115" width="100" height="35" rx="4" fill="#475569" />
    <text x="170" y="137" text-anchor="middle" fill="#e2e8f0" font-size="10">Socket Buffer</text>

    <rect x="20" y="115" width="80" height="35" rx="4" fill="#334155" />
    <text x="60" y="137" text-anchor="middle" fill="#e2e8f0" font-size="10">Network NIC</text>

    <!-- Flow Arrows -->
    <path d="M 100 62 L 120 62" stroke="#ef4444" stroke-width="2" />
    <path d="M 220 62 L 240 62" stroke="#ef4444" stroke-width="2" />
    <path d="M 310 80 L 310 132 L 220 132" stroke="#ef4444" stroke-width="2" />
    <path d="M 120 132 L 100 132" stroke="#ef4444" stroke-width="2" />

    <text x="200" y="175" text-anchor="middle" fill="#fca5a5" font-size="10">Nhược điểm: Tốn CPU copy qua lại User Space, làm chậm I/O</text>
  </g>

  <!-- Right: Kafka Zero-Copy -->
  <g transform="translate(470, 70)">
    <rect width="400" height="190" rx="8" fill="#1e293b" stroke="#10b981" stroke-width="1.5" />
    <text x="200" y="25" text-anchor="middle" fill="#34d399" font-size="12" font-weight="700">KAFKA ZERO-COPY (sendfile: 2 Switches + 0 CPU Copy)</text>

    <!-- Components -->
    <rect x="20" y="55" width="90" height="40" rx="4" fill="#334155" />
    <text x="65" y="80" text-anchor="middle" fill="#e2e8f0" font-size="10">Hard Disk</text>

    <rect x="150" y="55" width="110" height="40" rx="4" fill="#065f46" stroke="#10b981" stroke-width="1.5" />
    <text x="205" y="80" text-anchor="middle" fill="#d1fae5" font-size="11" font-weight="700">OS Page Cache</text>

    <rect x="290" y="55" width="90" height="40" rx="4" fill="#334155" />
    <text x="335" y="80" text-anchor="middle" fill="#e2e8f0" font-size="10">Network NIC</text>

    <!-- Zero-Copy Direct Path -->
    <path d="M 110 75 L 150 75" stroke="#10b981" stroke-width="2.5" />
    <path d="M 260 75 L 290 75" stroke="#10b981" stroke-width="3" />
    <text x="275" y="65" text-anchor="middle" fill="#34d399" font-size="9" font-weight="700">DMA</text>

    <!-- Bypass box -->
    <rect x="130" y="115" width="150" height="30" rx="4" fill="#047857" />
    <text x="205" y="135" text-anchor="middle" fill="#ffffff" font-size="10" font-weight="700">Bỏ Qua User Space!</text>

    <text x="200" y="175" text-anchor="middle" fill="#6ee7b7" font-size="10">Ưu điểm: Tốc độ chạm ngưỡng băng thông card mạng NIC!</text>
  </g>
</svg>"""

def generate_svg_feed():
    return """<svg viewBox="0 0 900 290" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <rect width="900" height="290" rx="12" fill="#0f172a" stroke="#334155" stroke-width="1.5" />
  <text x="450" y="30" text-anchor="middle" fill="#f8fafc" font-size="16" font-weight="700">KIẾN TRÚC MẠNG XÃ HỘI (THREADS/TWITTER): PUSH VS PULL VS HYBRID MODEL</text>
  <text x="450" y="50" text-anchor="middle" fill="#94a3b8" font-size="11">Khóa 2 (Bài 9 Microblogging Case Study) ➔ Khóa 1 (Bài 6 Redis Sorted Set Feed Cache)</text>

  <!-- Push Model Box -->
  <g transform="translate(30, 75)">
    <rect width="260" height="195" rx="8" fill="#1e293b" stroke="#3b82f6" />
    <text x="130" y="24" text-anchor="middle" fill="#60a5fa" font-size="12" font-weight="700">1. PUSH MODEL (Fan-out-on-write)</text>
    <text x="15" y="50" fill="#cbd5e1" font-size="10">• Cơ chế: Khi post bài ➔ đẩy thẳng</text>
    <text x="15" y="68" fill="#cbd5e1" font-size="10">  vào Inbox/Timeline của mọi followers.</text>
    <text x="15" y="95" fill="#34d399" font-size="10">✔ Ưu điểm: Đọc Feed siêu tốc $O(1)$</text>
    <text x="15" y="113" fill="#34d399" font-size="10">  từ Redis Sorted Set.</text>
    <text x="15" y="140" fill="#f87171" font-size="10">✘ Nhược điểm: Celebrity Problem!</text>
    <text x="15" y="158" fill="#f87171" font-size="10">  Ca sĩ 30M follow post bài ➔ 30M writes</text>
    <text x="15" y="176" fill="#f87171" font-size="10">  làm nghẽn toàn bộ hàng đợi ghi.</text>
  </g>

  <!-- Pull Model Box -->
  <g transform="translate(320, 75)">
    <rect width="260" height="195" rx="8" fill="#1e293b" stroke="#f59e0b" />
    <text x="130" y="24" text-anchor="middle" fill="#fbbf24" font-size="12" font-weight="700">2. PULL MODEL (Fan-out-on-read)</text>
    <text x="15" y="50" fill="#cbd5e1" font-size="10">• Cơ chế: Khi mở app ➔ query lấy</text>
    <text x="15" y="68" fill="#cbd5e1" font-size="10">  bài mới của những người mình follow.</text>
    <text x="15" y="95" fill="#34d399" font-size="10">✔ Ưu điểm: Đăng bài nhanh tức thì,</text>
    <text x="15" y="113" fill="#34d399" font-size="10">  không tốn tài nguyên write fan-out.</text>
    <text x="15" y="140" fill="#f87171" font-size="10">✘ Nhược điểm: Đọc Feed rất chậm!</text>
    <text x="15" y="158" fill="#f87171" font-size="10">  User follow 2,000 người ➔ DB phải</text>
    <text x="15" y="176" fill="#f87171" font-size="10">  quét và merge hàng trăm ngàn post.</text>
  </g>

  <!-- Hybrid Model Box -->
  <g transform="translate(610, 75)">
    <rect width="260" height="195" rx="8" fill="#1e293b" stroke="#10b981" stroke-width="2" />
    <text x="130" y="24" text-anchor="middle" fill="#34d399" font-size="12" font-weight="700">3. HYBRID (Chuẩn Twitter/Threads)</text>
    <text x="15" y="50" fill="#cbd5e1" font-size="10">• 99% User thường (&lt; 50k follow):</text>
    <text x="15" y="68" fill="#6ee7b7" font-size="10">  ➔ Dùng PUSH MODEL nung sẵn feed.</text>
    <text x="15" y="95" fill="#cbd5e1" font-size="10">• 1% Celebrity (&gt; 50k follow):</text>
    <text x="15" y="113" fill="#fde68a" font-size="10">  ➔ Dùng PULL MODEL khi user mở app.</text>
    <text x="15" y="140" fill="#ffffff" font-size="10" font-weight="700">⚡ Client Merge:</text>
    <text x="15" y="158" fill="#cbd5e1" font-size="10">  Lấy Feed nung sẵn trong Redis +</text>
    <text x="15" y="176" fill="#cbd5e1" font-size="10">  Merge động bài mới Celebrity ➔ &lt; 50ms!</text>
  </g>
</svg>"""


def escape_html(text):
    if not isinstance(text, str):
        return text
    # Keep backticks or convert to code tags
    t = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    # Convert `code` to <code>code</code>
    t = re.sub(r'`([^`]+)`', r'<code>\1</code>', t)
    return t


def generate_svg_learning_loop():
    return """<svg viewBox="0 0 1000 440" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7f1d1d" />
      <stop offset="100%" stop-color="#991b1b" />
    </linearGradient>
    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#064e3b" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>
  </defs>

  <rect width="1000" height="440" rx="14" fill="#0f172a" stroke="#334155" stroke-width="1.5" />
  <text x="500" y="32" text-anchor="middle" fill="#f8fafc" font-size="16" font-weight="700">MÔ HÌNH HỌC TẬP SIÊU TỐC: PHƯƠNG PHÁP ĐỌC ĐẢO NGƯỢC &amp; VIDEO LÀ BỘ NHỚ ĐỆM L3</text>
  <text x="500" y="52" text-anchor="middle" fill="#94a3b8" font-size="11">Cắt giảm 70% thời gian vô bổ • Chuyển hóa 100 giờ thụ động thành 30 giờ tác chiến thực tế (Tuân thủ AGENTS.md)</text>

  <!-- Left: The Video Trap (Red) -->
  <g transform="translate(30, 75)">
    <rect width="360" height="335" rx="10" fill="#1e293b" stroke="#ef4444" stroke-width="1.5" />
    <path d="M 0 0 L 360 0 L 360 38 L 0 38 Z" fill="url(#redGrad)" rx="8" />
    <text x="180" y="24" text-anchor="middle" fill="#fee2e2" font-size="12" font-weight="700">MÔ HÌNH XEM VIDEO 2 GIỜ (BĂNG THÔNG THẤP)</text>

    <text x="20" y="65" fill="#fca5a5" font-size="11" font-weight="700">1. Tỷ lệ Tín hiệu / Nhiễu cực thấp (Low SNR):</text>
    <text x="25" y="85" fill="#cbd5e1" font-size="10">• 120 phút video chỉ có ~20 phút kiến thức cốt lõi.</text>
    <text x="25" y="103" fill="#cbd5e1" font-size="10">• 100 phút còn lại: chào hỏi, setup lỗi, mạng lag,</text>
    <text x="25" y="121" fill="#cbd5e1" font-size="10">  trả lời câu hỏi ngoài lề của người khác.</text>

    <text x="20" y="150" fill="#fca5a5" font-size="11" font-weight="700">2. Ảo tưởng về năng lực (Illusion of Competence):</text>
    <text x="25" y="170" fill="#cbd5e1" font-size="10">• Xem người khác gõ code tạo cảm giác "mình đã hiểu".</text>
    <text x="25" y="188" fill="#cbd5e1" font-size="10">• Đóng video lại, mở terminal trắng: hoàn toàn tê liệt!</text>

    <text x="20" y="218" fill="#fca5a5" font-size="11" font-weight="700">3. Chi phí cơ hội khổng lồ:</text>
    <text x="25" y="238" fill="#cbd5e1" font-size="10">• 39 bài x 2h = ~80 đến 100 giờ ngồi thụ động.</text>
    <text x="25" y="256" fill="#cbd5e1" font-size="10">• Sau 2 tuần, tỷ lệ quên sạch &gt; 80% (Ebbinghaus Decay).</text>

    <rect x="20" y="280" width="320" height="35" rx="6" fill="#7f1d1d" />
    <text x="180" y="302" text-anchor="middle" fill="#fecaca" font-size="10" font-weight="700">KẾT QUẢ: Mất 6 tháng, biến thành "Thợ xem slide"</text>
  </g>

  <!-- Right: 4-Step High Throughput Loop (Emerald) -->
  <g transform="translate(420, 75)">
    <rect width="550" height="335" rx="10" fill="#1e293b" stroke="#10b981" stroke-width="2" />
    <path d="M 0 0 L 550 0 L 550 38 L 0 38 Z" fill="url(#emeraldGrad)" rx="8" />
    <text x="275" y="24" text-anchor="middle" fill="#d1fae5" font-size="12" font-weight="700">QUY TRÌNH HỌC SIÊU TỐC 4 BƯỚC (45 PHÚT / BÀI GIẢNG)</text>

    <!-- Step 1 -->
    <rect x="20" y="55" width="510" height="55" rx="6" fill="#064e3b" stroke="#10b981" />
    <text x="35" y="75" fill="#34d399" font-size="11" font-weight="700">BƯỚC 1: FAST SCAN MARKDOWN &amp; SƠ ĐỒ (10 - 15 Phút)</text>
    <text x="35" y="95" fill="#cbd5e1" font-size="10">Đọc file .md tại Tài Liệu/ ➔ Trích xuất 3 câu hỏi: "Nỗi đau là gì? Cơ chế ngầm là gì? Đánh đổi ở đâu?"</text>

    <!-- Step 2 -->
    <rect x="20" y="120" width="510" height="60" rx="6" fill="#064e3b" stroke="#10b981" />
    <text x="35" y="140" fill="#34d399" font-size="11" font-weight="700">BƯỚC 2: TACTILE LAB &amp; "CỐ TÌNH PHÁ HỎNG" (20 - 25 Phút)</text>
    <text x="35" y="158" fill="#cbd5e1" font-size="10">Chạy lab có sẵn trong labs/ ➔ Break it to understand it! Nhìn tận mắt EXPLAIN BUFFERS, Locks, Latency.</text>
    <text x="35" y="172" fill="#a7f3d0" font-size="9">Cố tình làm sai để thấy query chậm từ 2ms nhảy lên 10,000ms ➔ Cơ bắp thần kinh ghi nhớ vĩnh viễn!</text>

    <!-- Step 3 -->
    <rect x="20" y="190" width="510" height="55" rx="6" fill="#064e3b" stroke="#10b981" />
    <text x="35" y="210" fill="#34d399" font-size="11" font-weight="700">BƯỚC 3: SOCRATIC AI SPARRING &amp; PHẢN BIỆN (10 Phút)</text>
    <text x="35" y="230" fill="#cbd5e1" font-size="10">Bắt AI OMP đóng vai Tech Lead khó tính tra khảo 3 câu hỏi hóc búa ➔ Lôi toàn bộ War Stories thực chiến ra mổ xẻ.</text>

    <!-- Step 4 -->
    <rect x="20" y="255" width="510" height="55" rx="6" fill="#0f766e" stroke="#2dd4bf" />
    <text x="35" y="275" fill="#5eead4" font-size="11" font-weight="700">BƯỚC 4: VIDEO AS L3 CACHE (Tùy chọn: Tối đa 5 Phút - CHỈ KHI CÓ CACHE MISS)</text>
    <text x="35" y="295" fill="#f0fdfa" font-size="10">Nếu Bước 2 &amp; 3 có chỗ chưa thông: Mở video, KÉO ĐÚNG THANH TUA xem 3-5 phút giảng viên nói rồi TẮT!</text>

    <!-- Highlight badge -->
    <text x="275" y="325" text-anchor="middle" fill="#6ee7b7" font-size="10" font-weight="700">⚡ TỔNG THỜI GIAN: 45 PHÚT/BÀI • TIẾT KIỆM 70% THỜI GIAN • RETENTION &gt; 80%</text>
  </g>
</svg>"""

def generate_html(data):
    svg_arch = generate_svg_architecture()
    svg_roadmap = generate_svg_roadmap()
    svg_outbox = generate_svg_outbox()
    svg_zerocopy = generate_svg_zerocopy()
    svg_feed = generate_svg_feed()
    svg_loop = generate_svg_learning_loop()

    # Pre-render module cards
    courses_html = []
    for c in data["courses"]:
        mod_cards = []
        for m in data["courses"][data["courses"].index(c)]["modules"]:
            tags_html = "".join([f'<span class="badge tag-badge">{escape_html(t)}</span>' for t in m["tags"]])
            internals_html = "".join([f'<li>{escape_html(item)}</li>' for item in m["internals"]])
            problems_html = "".join([f'<li>{escape_html(item)}</li>' for item in m["problems_solved"]])

            card = f"""
            <div class="module-card" data-course="{c['id']}" data-search="{m['name'].lower()} {m['summary'].lower()} {' '.join(m['tags']).lower()}">
              <div class="module-header" onclick="toggleCard(this)">
                <div class="module-title-wrap">
                  <span class="module-number" style="background: {c['color']};">#{m['stt']}</span>
                  <div>
                    <h4 class="module-name">{m['name']}</h4>
                    <p class="module-file">📁 <code>{m['file']}</code></p>
                  </div>
                </div>
                <div class="module-header-right">
                  <div class="tag-list">{tags_html}</div>
                  <span class="toggle-icon">▼</span>
                </div>
              </div>

              <div class="module-body">
                <p class="module-summary">💡 <strong>Tóm tắt cốt lõi:</strong> {escape_html(m['summary'])}</p>
                
                <div class="details-grid">
                  <div class="internals-box">
                    <h5>🔬 Trọng Tâm Kiến Thức Chuyên Sâu (Internals & Cơ Chế)</h5>
                    <ul>{internals_html}</ul>
                  </div>

                  <div class="problems-box">
                    <h5>🛡️ Các Bài Toán & Sự Cố Sản Xuất Giải Quyết Được</h5>
                    <ul>{problems_html}</ul>
                    <div class="artifacts-tag">
                      <strong>📦 Artifacts / Labs:</strong> <code>{m['artifacts']}</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            """
            mod_cards.append(card)

        c_section = f"""
        <section id="{c['id']}" class="course-section" data-course="{c['id']}">
          <div class="course-banner" style="border-left: 6px solid {c['color']};">
            <div class="course-banner-meta">
              <span class="badge course-badge" style="background: {c['color']};">{c['code']}</span>
              <span class="badge stats-badge">{c['badge']}</span>
            </div>
            <h2 class="course-title">{c['title']}</h2>
            <p class="course-instructor">👨‍🏫 Giảng viên: <strong>{c['instructor']}</strong></p>
            <p class="course-tagline">🎯 <em>"{c['tagline']}"</em></p>
            <p class="course-desc">{c['description']}</p>
          </div>

          <div class="modules-container">
            {''.join(mod_cards)}
          </div>
        </section>
        """
        courses_html.append(c_section)

    html = f"""<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Báo Cáo Toàn Diện 3 Khóa Học: Backend Internals, System Design & Kafka</title>
  <style>
    :root {{
      --bg: #0b1120;
      --surface: #1e293b;
      --surface-light: #334155;
      --border: #334155;
      --text: #f8fafc;
      --muted: #94a3b8;
      --c1: #3b82f6;
      --c2: #10b981;
      --c3: #f59e0b;
      --accent: #38bdf8;
      --card-radius: 12px;
      --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    }}

    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding-bottom: 80px;
    }}

    /* Container */
    .container {{
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 24px;
    }}

    /* Header & Hero */
    header.hero {{
      padding: 48px 0 32px 0;
      border-bottom: 1px solid var(--border);
      background: linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(11, 17, 32, 0) 100%);
    }}
    .hero-badge-wrap {{
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }}
    .badge {{
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }}
    .badge-hero {{ background: #1e3a8a; color: #bfdbfe; border: 1px solid #3b82f6; }}
    .badge-status {{ background: #064e3b; color: #a7f3d0; border: 1px solid #10b981; }}
    
    h1.hero-title {{
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 12px;
      background: linear-gradient(90deg, #ffffff 0%, #cbd5e1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }}
    p.hero-subtitle {{
      color: var(--muted);
      font-size: 16px;
      max-width: 900px;
      margin-bottom: 28px;
    }}

    /* KPI Grid */
    .kpi-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }}
    .kpi-card {{
      background: var(--surface);
      border: 1px solid var(--border);
      padding: 20px;
      border-radius: var(--card-radius);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
    }}
    .kpi-label {{
      font-size: 12px;
      color: var(--muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }}
    .kpi-value {{
      font-size: 24px;
      font-weight: 800;
      color: #38bdf8;
      margin-bottom: 4px;
    }}
    .kpi-desc {{
      font-size: 12px;
      color: #94a3b8;
    }}

    /* Navigation & Controls */
    .nav-bar {{
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--border);
      padding: 16px 0;
      margin-bottom: 32px;
    }}
    .nav-inner {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }}
    .tab-group {{
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }}
    .tab-btn {{
      background: var(--surface);
      color: var(--muted);
      border: 1px solid var(--border);
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }}
    .tab-btn:hover {{
      background: var(--surface-light);
      color: var(--text);
    }}
    .tab-btn.active {{
      background: #3b82f6;
      color: #ffffff;
      border-color: #3b82f6;
    }}
    .search-wrap {{
      position: relative;
      min-width: 280px;
    }}
    .search-input {{
      width: 100%;
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 8px 16px 8px 36px;
      border-radius: 8px;
      font-size: 13px;
      outline: none;
    }}
    .search-input:focus {{
      border-color: #38bdf8;
    }}
    .search-icon {{
      position: absolute;
      left: 12px;
      top: 9px;
      color: var(--muted);
      font-size: 13px;
    }}

    /* Diagrams Section */
    .diagram-section {{
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--card-radius);
      padding: 24px;
      margin-bottom: 40px;
    }}
    .section-header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--surface-light);
      padding-bottom: 12px;
    }}
    .section-title {{
      font-size: 20px;
      font-weight: 700;
      color: var(--text);
    }}
    .diagram-grid {{
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
    }}

    /* Course Section */
    .course-section {{
      margin-bottom: 48px;
    }}
    .course-banner {{
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--card-radius);
      padding: 24px;
      margin-bottom: 20px;
    }}
    .course-banner-meta {{
      display: flex;
      gap: 10px;
      margin-bottom: 12px;
    }}
    .course-badge {{ color: #ffffff; }}
    .stats-badge {{ background: var(--surface-light); color: var(--muted); }}
    .course-title {{
      font-size: 22px;
      font-weight: 800;
      margin-bottom: 6px;
    }}
    .course-instructor {{
      color: var(--muted);
      font-size: 13px;
      margin-bottom: 4px;
    }}
    .course-tagline {{
      color: #38bdf8;
      font-size: 14px;
      margin-bottom: 12px;
    }}
    .course-desc {{
      color: #cbd5e1;
      font-size: 14px;
      line-height: 1.6;
    }}

    /* Module Cards */
    .modules-container {{
      display: flex;
      flex-direction: column;
      gap: 14px;
    }}
    .module-card {{
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
      transition: border-color 0.2s;
    }}
    .module-card:hover {{
      border-color: #475569;
    }}
    .module-header {{
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      background: rgba(30, 41, 59, 0.4);
      user-select: none;
    }}
    .module-title-wrap {{
      display: flex;
      align-items: center;
      gap: 16px;
    }}
    .module-number {{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 14px;
      color: #ffffff;
      flex-shrink: 0;
    }}
    .module-name {{
      font-size: 16px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 4px;
    }}
    .module-file {{
      font-size: 12px;
      color: var(--muted);
    }}
    .module-file code {{
      font-family: var(--font-mono);
      background: rgba(0,0,0,0.3);
      padding: 2px 6px;
      border-radius: 4px;
      color: #93c5fd;
    }}
    .module-header-right {{
      display: flex;
      align-items: center;
      gap: 16px;
    }}
    .tag-list {{
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }}
    .tag-badge {{
      background: rgba(51, 65, 85, 0.8);
      color: #cbd5e1;
      font-size: 10px;
      border: 1px solid #475569;
    }}
    .toggle-icon {{
      font-size: 12px;
      color: var(--muted);
      transition: transform 0.2s;
    }}
    .module-card.expanded .toggle-icon {{
      transform: rotate(180deg);
    }}

    /* Module Body */
    .module-body {{
      padding: 0 20px 20px 20px;
      display: none;
      border-top: 1px solid var(--surface-light);
      margin-top: 10px;
      padding-top: 16px;
    }}
    .module-card.expanded .module-body {{
      display: block;
    }}
    .module-summary {{
      background: rgba(15, 23, 42, 0.6);
      border-left: 3px solid #38bdf8;
      padding: 10px 14px;
      border-radius: 4px;
      font-size: 13px;
      color: #e2e8f0;
      margin-bottom: 16px;
    }}
    .details-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 16px;
    }}
    .internals-box, .problems-box {{
      background: rgba(15, 23, 42, 0.4);
      border: 1px solid var(--surface-light);
      padding: 16px;
      border-radius: 8px;
    }}
    .internals-box h5, .problems-box h5 {{
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }}
    .internals-box h5 {{ color: #60a5fa; }}
    .problems-box h5 {{ color: #34d399; }}
    .internals-box ul, .problems-box ul {{
      padding-left: 18px;
      font-size: 13px;
      color: #cbd5e1;
    }}
    .internals-box li, .problems-box li {{
      margin-bottom: 6px;
      line-height: 1.5;
    }}
    .artifacts-tag {{
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px solid var(--surface-light);
      font-size: 12px;
      color: var(--muted);
    }}
    .artifacts-tag code {{
      font-family: var(--font-mono);
      color: #fde68a;
    }}

    /* Tables */
    .table-wrap {{
      overflow-x: auto;
      margin: 16px 0;
    }}
    table.data-table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: left;
    }}
    table.data-table th {{
      background: var(--surface-light);
      color: var(--text);
      padding: 10px 14px;
      border: 1px solid var(--border);
      font-weight: 700;
    }}
    table.data-table td {{
      padding: 10px 14px;
      border: 1px solid var(--border);
      color: #cbd5e1;
    }}
    table.data-table tr:nth-child(even) {{
      background: rgba(30, 41, 59, 0.5);
    }}

    /* Footer */
    footer.page-footer {{
      margin-top: 60px;
      text-align: center;
      padding: 30px 0;
      border-top: 1px solid var(--border);
      color: var(--muted);
      font-size: 13px;
    }}
  </style>
</head>
<body>

  <!-- Hero Section -->
  <header class="hero">
    <div class="container">
      <div class="hero-badge-wrap">
        <span class="badge badge-hero">MASTER CURRICULUM OVERVIEW</span>
        <span class="badge badge-status">SCOUT REPORT & ARCHITECTURE MAP</span>
        <span class="badge" style="background:#581c87; color:#ddd6fe; border:1px solid #8b5cf6;">CUMULATIVE ROADMAP</span>
      </div>
      <h1 class="hero-title">TỔNG QUAN CHI TIẾT 3 KHÓA HỌC: BACKEND INTERNALS, SYSTEM DESIGN & KAFKA</h1>
      <p class="hero-subtitle">Bản đồ giải phẫu toàn diện 39 chuyên đề, 540+ slides và 1 cuốn sách toàn thư kiến trúc 400 trang. Định hình tư duy kỹ sư Backend cấp cao (Senior / Lead Architect) từ hạt nhân Linux & Database đến Streaming phân tán quy mô lớn.</p>

      <!-- KPI Dashboard -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Tổng Số Khóa Học</div>
          <div class="kpi-value">3 Khóa Lớn</div>
          <div class="kpi-desc">Backend Internals, System Design & Kafka Nâng Cao</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Tổng Chuyên Đề</div>
          <div class="kpi-value">39 Chuyên Đề</div>
          <div class="kpi-desc">16 Backend + 10 System Design + 13 Kafka Mastery</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Tài Liệu Chi Tiết</div>
          <div class="kpi-value">540+ Trang Slide</div>
          <div class="kpi-desc">Kèm 400 trang Sách Kiến Trúc & 15 Bản Markdown</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Thực Hành & Đề Thi</div>
          <div class="kpi-value">11+ Labs & 150+ CCDAK</div>
          <div class="kpi-desc">PostgreSQL/Redis Labs + Bộ câu hỏi Confluent Certified</div>
        </div>
      </div>
    </div>
  </header>

  <!-- Sticky Navigation -->
  <nav class="nav-bar">
    <div class="container nav-inner">
      <div class="tab-group">
        <button class="tab-btn active" onclick="filterCourse('strategy', this)">🎯 Chiến Lược Siêu Tốc (Anti-Video)</button>
        <button class="tab-btn" onclick="filterCourse('all', this)">Tất Cả (39 Chuyên Đề)</button>
        <button class="tab-btn" onclick="filterCourse('c1', this)">Khóa 1: Advanced Backend (16)</button>
        <button class="tab-btn" onclick="filterCourse('c2', this)">Khóa 2: System Design (10)</button>
        <button class="tab-btn" onclick="filterCourse('c3', this)">Khóa 3: Kafka Nâng Cao (13)</button>
        <button class="tab-btn" onclick="filterCourse('diagrams', this)">Sơ Đồ Kiến Trúc & Lộ Trình</button>
      </div>

      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input type="text" id="searchInput" class="search-input" placeholder="Tìm kiếm chuyên đề, từ khóa (Saga, B-Tree, Outbox, Lock...)" oninput="handleSearch()">
      </div>
    </div>
  </nav>

  <main class="container">

    <!-- Strategic High-Throughput Learning Brief Section -->
    <section id="strategy-section" class="diagram-section" style="border: 2px solid #10b981; margin-bottom: 40px;">
      <div class="section-header" style="border-bottom: 1px solid #065f46;">
        <div>
          <span class="badge" style="background:#065f46; color:#a7f3d0; margin-bottom:8px;">CTO ADVISORY &amp; BRAINSTORM CONTRACT</span>
          <h3 class="section-title" style="color:#34d399;">🎯 Chiến Lược Học Tập Siêu Tốc: Khai Tử Video 2 Giờ &amp; Mô Hình Đọc Đảo Ngược</h3>
        </div>
        <span class="badge" style="background:#047857; color:#ffffff;">45 Min / Lecture Protocol</span>
      </div>

      <div style="margin-bottom: 24px;">
        {svg_loop}
      </div>

      <div class="details-grid" style="margin-bottom: 20px;">
        <div class="internals-box" style="border-color: #059669;">
          <h5 style="color: #34d399;">⚡ Bản Hợp Đồng Brainstorm Contract (Giao Thức Thực Thi)</h5>
          <ul style="list-style-type: none; padding-left: 0;">
            <li style="margin-bottom: 10px;"><strong>🎯 Outcome (Mục tiêu):</strong> Hoàn thành 39 chuyên đề với tốc độ nhanh gấp 3 lần, làm chủ kiến thức tầng sâu và xây dựng thành công 1 Mini Production Engine duy nhất mang đi phỏng vấn.</li>
            <li style="margin-bottom: 10px;"><strong>🔒 Constraints (Ràng buộc):</strong> Tuân thủ nghiêm ngặt <code>AGENTS.md</code>: Anti Over-Engineering, Walkthrough ➔ Challenge, thực chứng bằng DBeaver/Postman/cURL/CLI.</li>
            <li style="margin-bottom: 10px;"><strong>🚫 Non-goals (Loại trừ):</strong> Không ngồi xem thụ động toàn bộ 2 tiếng video; không đọc thuộc lòng lý thuyết chay; không làm UI/Frontend.</li>
            <li style="margin-bottom: 10px;"><strong>✅ Acceptance Criteria:</strong> Tự tay chạy và bẻ gãy được lab; vượt qua 3 câu hỏi phản biện của AI Tech Lead; chỉ ra được ít nhất 1 cạm bẫy thực tế của công nghệ đó.</li>
          </ul>
        </div>

        <div class="problems-box" style="border-color: #d97706;">
          <h5 style="color: #fbbf24;">🛡️ Kế Hoạch Tác Chiến 3 Bước Ngay Hôm Nay Cho Bài 3 (Index)</h5>
          <ol style="padding-left: 20px; font-size: 13px; color: #cbd5e1; line-height: 1.6;">
            <li style="margin-bottom: 8px;"><strong>Đọc Spec (10 phút):</strong> Mở <code>Tài Liệu/advanced_backend/3. Index.md</code>, quét nhanh cấu trúc B-Tree Leaf Node, TID <code>(page, tuple)</code> và cơ chế HOT updates.</li>
            <li style="margin-bottom: 8px;"><strong>Chạy Lab &amp; Bẻ gãy (20 phút):</strong> Vào <code>labs/lesson-03-index/</code>, chạy ngay <code>node 01-when-index-helps.mjs</code> và <code>node 05-composite-order.mjs</code>. Tận mắt nhìn thấy Buffers và Seq Scan thay đổi.</li>
            <li style="margin-bottom: 8px;"><strong>AI Sparring (10 phút):</strong> Chat với OMP: <em>"Tao vừa chạy xong lab 05 và 06, hãy hỏi tao 3 câu phản biện xem tao hiểu thật chưa!"</em>. Nhận phản biện và đóng nắp Bài 3 trong chưa đầy 45 phút!</li>
          </ol>
        </div>
      </div>
    </section>


    <!-- Interactive Diagrams Section -->
    <section id="diagrams-section" class="diagram-section">
      <div class="section-header">
        <h3 class="section-title">📊 Bộ Sơ Đồ Kiến Trúc Độc Quyền (Visual Architecture Maps)</h3>
        <span class="badge" style="background:#1e3a8a; color:#93c5fd;">5 Core Diagrams</span>
      </div>

      <div class="diagram-grid">
        <!-- Sơ đồ 1: Tổng thể -->
        <div>
          <h4 style="margin-bottom:8px; color:#38bdf8;">1. Sơ Đồ Tích Hợp Đa Tầng 3 Khóa Học (End-to-End System Map)</h4>
          {svg_arch}
        </div>

        <!-- Sơ đồ 2: Lộ trình 5 giai đoạn -->
        <div style="margin-top:24px;">
          <h4 style="margin-bottom:8px; color:#34d399;">2. Lộ Trình Học Cuốn Chiếu 5 Giai Đoạn (Cumulative Integration)</h4>
          {svg_roadmap}
        </div>

        <!-- Sơ đồ 3: Transactional Outbox -->
        <div style="margin-top:24px;">
          <h4 style="margin-bottom:8px; color:#fbbf24;">3. Khắc Phục Thảm Họa Dual-Write Bằng Transactional Outbox & Debezium CDC</h4>
          {svg_outbox}
        </div>

        <!-- Sơ đồ 4: Zero-Copy -->
        <div style="margin-top:24px;">
          <h4 style="margin-bottom:8px; color:#a78bfa;">4. Cơ Chế Kafka Zero-Copy (Linux Kernel sendfile) vs Traditional BIO</h4>
          {svg_zerocopy}
        </div>

        <!-- Sơ đồ 5: Push vs Pull -->
        <div style="margin-top:24px;">
          <h4 style="margin-bottom:8px; color:#f472b6;">5. Phân Phối News Feed (Threads / Twitter): Push vs Pull vs Hybrid Model</h4>
          {svg_feed}
        </div>
      </div>
    </section>

    <!-- Cross-Course Comparative Matrix Table -->
    <section class="diagram-section" style="margin-bottom:40px;">
      <div class="section-header">
        <h3 class="section-title">⚡ Ma Trận So Sánh & Mối Liên Kết Tích Hợp Giữa 3 Khóa Học</h3>
        <span class="badge" style="background:#065f46; color:#a7f3d0;">Synergy Matrix</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Khía Cạnh Kỹ Thuật</th>
              <th>Khóa 1: Advanced Backend</th>
              <th>Khóa 2: System Design (Roninhub)</th>
              <th>Khóa 3: Kafka Nâng Cao (Roninhub)</th>
              <th>Mối Quan Hệ Tích Hợp</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Tầng Lưu Trữ (Storage)</strong></td>
              <td>B-Tree, Heap Tuples, HOT updates, MVCC, Locks (Row, Gap, Next-Key lock) trên 1 database node.</td>
              <td>Mở rộng vượt ngưỡng 20k QPS bằng Range/Hash Partitioning, Sharding đa node, chọn Shard Key chống Hotspot.</td>
              <td>Transactional Outbox Pattern kết hợp Debezium CDC đọc trực tiếp WAL của Postgres để phát event sang Kafka mà không bị lỗi Dual-Write.</td>
              <td>Khóa 1 làm nền móng để Khóa 2 sharding an toàn và Khóa 3 trích xuất dữ liệu không trễ.</td>
            </tr>
            <tr>
              <td><strong>Tầng Caching & Tải</strong></td>
              <td>Giải quyết 4 bệnh kinh điển: Stampede (Singleflight), Avalanche (Jitter), Penetration (Bloom Filter), Race Condition xóa cache.</td>
              <td>Định vị Cache đa tầng (CDN, Nginx, Redis Cluster 16K slots), 5 thuật toán Rate Limiting (Token/Leaky Bucket).</td>
              <td>Kafka làm bộ đệm Buffer / Traffic Smoothing hấp thụ đỉnh tải trước khi đổ vào Cache và Database.</td>
              <td>Cả 3 kết hợp thành một 'tấm khiên' 4 lớp chống sập hệ thống khi có Flash Sale.</td>
            </tr>
            <tr>
              <td><strong>Giao Tiếp & Phân Tán</strong></td>
              <td>Giao thức TCP Handshake, TLS 1.3, HTTP/2, WebSocket, Idempotent Webhooks.</td>
              <td>REST vs gRPC over HTTP/2, WebSocket vs SSE, Phân rã Microservices qua Bounded Context, Saga Pattern (Orchestration vs Choreography).</td>
              <td>Distributed Event Streaming, Consumer Groups, Cooperative Rebalance, Producer ACKs, Exactly-Once Semantics.</td>
              <td>Từ socket mạng (K1) ➔ Thiết kế giao tiếp microservices (K2) ➔ Triển khai hạ tầng truyền tin bất đồng bộ (K3).</td>
            </tr>
            <tr>
              <td><strong>Hiệu Năng & Kernel</strong></td>
              <td>User Space vs Kernel Space, System Calls, I/O Multiplexing (epoll), Zero-Copy <code>sendfile</code>.</td>
              <td>Mô hình Reactor Pattern (Netty), LMAX Disruptor Lock-Free Ring Buffer, Timer Hashed Wheel.</td>
              <td>Ứng dụng thực tế của Sequential Disk I/O, OS Page Cache, Zero-Copy và Batching để đạt hàng triệu msg/s.</td>
              <td>Khóa 1 giải thích lý thuyết OS ➔ Khóa 2 đưa vào giải thuật ➔ Khóa 3 chứng minh trong engine Kafka.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Courses Content -->
    {''.join(courses_html)}

  </main>

  <footer class="page-footer">
    <div class="container">
      <p>Báo Cáo Phân Tích & Tổng Quan Chi Tiết 3 Khóa Học (Master Curriculum Overview)</p>
      <p style="margin-top:6px; color:#64748b;">Tuân thủ triết lý AGENTS.md: Anti Over-Engineering • Làm mẫu ➔ Tự làm • Đa dạng hóa công cụ • Tích lũy cuốn chiếu</p>
      <p style="margin-top:4px; font-family:var(--font-mono); font-size:11px; color:#475569;">Path: D:/study/advance-be/reports/TONG_QUAN_3_KHOA_HOC_MASTER_CURRICULUM.html</p>
    </div>
  </footer>

  <script>
    // Toggle Module Card Expansion
    function toggleCard(headerElement) {{
      const card = headerElement.closest('.module-card');
      card.classList.toggle('expanded');
    }}

    // Filter Courses by Tab
    function filterCourse(courseId, btn) {{
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const diagramsSection = document.getElementById('diagrams-section');
      const courseSections = document.querySelectorAll('.course-section');

      if (courseId === 'diagrams') {{
        diagramsSection.style.display = 'block';
        courseSections.forEach(s => s.style.display = 'none');
        window.scrollTo({{ top: diagramsSection.offsetTop - 80, behavior: 'smooth' }});
        return;
      }}

      diagramsSection.style.display = 'block';

      courseSections.forEach(s => {{
        if (courseId === 'all' || s.dataset.course === courseId) {{
          s.style.display = 'block';
        }} else {{
          s.style.display = 'none';
        }}
      }});
    }}

    // Real-time Search Filter
    function handleSearch() {{
      const query = document.getElementById('searchInput').value.toLowerCase().trim();
      const cards = document.querySelectorAll('.module-card');
      let visibleCount = 0;

      cards.forEach(card => {{
        const searchData = card.getAttribute('data-search');
        if (!query || searchData.includes(query)) {{
          card.style.display = 'block';
          visibleCount++;
        }} else {{
          card.style.display = 'none';
        }}
      }});

      // Auto expand cards if search query is active
      if (query.length > 2) {{
        cards.forEach(card => {{
          if (card.style.display !== 'none') {{
            card.classList.add('expanded');
          }}
        }});
      }}
    }}
  </script>
</body>
</html>
"""
    return html

def run():
    print("Loading curriculum data...")
    data = build_data()
    
    os.makedirs("reports", exist_ok=True)
    
    print("Generating Markdown report...")
    md_content = generate_markdown(data)
    md_path = os.path.join("reports", "TONG_QUAN_3_KHOA_HOC_MASTER_CURRICULUM.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)
    print(f"-> Generated {md_path} ({len(md_content.encode('utf-8'))} bytes)")

    print("Generating HTML report...")
    html_content = generate_html(data)
    html_path = os.path.join("reports", "TONG_QUAN_3_KHOA_HOC_MASTER_CURRICULUM.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"-> Generated {html_path} ({len(html_content.encode('utf-8'))} bytes)")

if __name__ == "__main__":
    run()
