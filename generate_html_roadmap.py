# -*- coding: utf-8 -*-
import os

html_content = """<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bàn Điều Khiển Tác Chiến: Lộ Trình Tăng Tốc A-Z (Senior Backend / Architect)</title>
  <style>
    :root {
      --bg: #0b1120;
      --surface: #1e293b;
      --surface-hover: #293548;
      --surface-light: #334155;
      --border: #334155;
      --text: #f8fafc;
      --muted: #94a3b8;
      --accent: #38bdf8;
      --accent-glow: rgba(56, 189, 248, 0.2);
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --c1: #3b82f6;
      --c2: #8b5cf6;
      --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      --radius: 12px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding-bottom: 80px;
    }

    .container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 24px;
    }

    /* Hero Header */
    header.hero {
      padding: 40px 0 28px 0;
      border-bottom: 1px solid var(--border);
      background: linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(11, 17, 32, 0) 100%);
    }
    .badge-bar {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      background: var(--surface-light);
      color: var(--accent);
      border: 1px solid rgba(56, 189, 248, 0.3);
    }
    .badge.warning {
      color: var(--warning);
      border-color: rgba(245, 158, 11, 0.3);
      background: rgba(245, 158, 11, 0.1);
    }
    .badge.success {
      color: var(--success);
      border-color: rgba(16, 185, 129, 0.3);
      background: rgba(16, 185, 129, 0.1);
    }
    h1 {
      font-size: 2.2rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 12px;
      background: linear-gradient(90deg, #ffffff 0%, #38bdf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .lead {
      color: var(--muted);
      font-size: 1.05rem;
      max-width: 900px;
      margin-bottom: 24px;
    }

    /* KPI Row */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-top: 24px;
    }
    .kpi-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 18px 20px;
      transition: transform 0.2s, border-color 0.2s;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      border-color: var(--accent);
    }
    .kpi-title {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted);
      margin-bottom: 6px;
    }
    .kpi-val {
      font-size: 1.6rem;
      font-weight: 800;
      color: #fff;
    }
    .kpi-desc {
      font-size: 0.85rem;
      color: var(--muted);
      margin-top: 4px;
    }

    /* Progress Tracker */
    .progress-section {
      margin: 32px 0;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px 24px;
    }
    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .progress-bar-bg {
      background: var(--surface-light);
      height: 12px;
      border-radius: 9999px;
      overflow: hidden;
    }
    .progress-bar-fill {
      background: linear-gradient(90deg, var(--c1) 0%, var(--success) 100%);
      height: 100%;
      width: 4%;
      transition: width 0.3s ease;
    }

    /* Navigation Tabs */
    .tabs {
      display: flex;
      gap: 12px;
      margin: 28px 0 20px 0;
      border-bottom: 1px solid var(--border);
      padding-bottom: 12px;
      overflow-x: auto;
    }
    .tab-btn {
      background: transparent;
      border: 1px solid transparent;
      color: var(--muted);
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.95rem;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .tab-btn:hover {
      background: var(--surface);
      color: var(--text);
    }
    .tab-btn.active {
      background: var(--surface-light);
      color: #fff;
      border-color: var(--accent);
      box-shadow: 0 0 12px var(--accent-glow);
    }

    /* Day Card (The 3-Box Cockpit) */
    .day-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      margin-bottom: 24px;
      overflow: hidden;
      transition: border-color 0.2s;
    }
    .day-card.completed {
      border-color: var(--success);
      opacity: 0.85;
    }
    .day-card.completed .day-header {
      background: rgba(16, 185, 129, 0.1);
    }
    .day-header {
      padding: 16px 20px;
      background: rgba(51, 65, 85, 0.4);
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .day-title-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .day-check {
      width: 22px;
      height: 22px;
      cursor: pointer;
      accent-color: var(--success);
    }
    .day-number {
      background: var(--c1);
      color: #fff;
      font-size: 0.8rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
    }
    .day-number.sprint {
      background: var(--warning);
      color: #000;
    }
    .day-number.capstone {
      background: var(--danger);
      color: #fff;
    }
    .day-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #fff;
    }
    .day-time {
      font-size: 0.85rem;
      color: var(--muted);
      font-family: var(--font-mono);
    }

    .cockpit-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1px;
      background: var(--border);
    }
    .box {
      background: var(--surface);
      padding: 20px;
    }
    .box-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }
    .box-title.input-title { color: var(--accent); }
    .box-title.exec-title { color: var(--warning); }
    .box-title.dod-title { color: var(--success); }

    .box-content {
      font-size: 0.92rem;
      color: #cbd5e1;
    }
    .box-content ul {
      padding-left: 20px;
    }
    .box-content li {
      margin-bottom: 8px;
    }
    .code-block {
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 10px 14px;
      font-family: var(--font-mono);
      font-size: 0.85rem;
      color: #38bdf8;
      overflow-x: auto;
      margin: 8px 0;
      position: relative;
    }
    .code-block button.copy-btn {
      position: absolute;
      top: 6px;
      right: 6px;
      background: var(--surface-light);
      border: 1px solid var(--border);
      color: var(--muted);
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: 4px;
      cursor: pointer;
    }
    .code-block button.copy-btn:hover {
      color: #fff;
      background: var(--c1);
    }

    .interview-q {
      background: rgba(30, 41, 59, 0.6);
      border-left: 3px solid var(--c2);
      padding: 12px 16px;
      margin-top: 14px;
      border-radius: 0 6px 6px 0;
      font-size: 0.88rem;
    }
    .interview-q strong {
      color: #e2e8f0;
      display: block;
      margin-bottom: 4px;
    }
    .interview-q em {
      color: var(--muted);
      font-style: normal;
    }

    /* Warning Box */
    .warning-box {
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: var(--radius);
      padding: 16px 20px;
      margin: 24px 0;
      display: flex;
      gap: 14px;
      align-items: flex-start;
    }
    .warning-icon {
      font-size: 1.5rem;
      line-height: 1;
    }
    .warning-title {
      font-weight: 700;
      color: var(--warning);
      margin-bottom: 4px;
    }
    .warning-desc {
      font-size: 0.9rem;
      color: #e2e8f0;
    }

    /* Architecture Visual Block */
    .arch-preview {
      background: #0f172a;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px;
      margin: 24px 0;
      overflow-x: auto;
      font-family: var(--font-mono);
      font-size: 0.82rem;
      line-height: 1.4;
      color: #38bdf8;
    }

    footer {
      text-align: center;
      margin-top: 40px;
      color: var(--muted);
      font-size: 0.85rem;
    }
  </style>
</head>
<body>

  <header class="hero">
    <div class="container">
      <div class="badge-bar">
        <span class="badge">🚀 Lộ Trình Tác Chiến 3-4 Tuần</span>
        <span class="badge warning">⚡ Cắt 70% Thời Gian Video</span>
        <span class="badge success">🎯 Mục Tiêu Lương 35M - 50M+</span>
        <span class="badge">🛡️ Advisory: Khổng Minh Approved</span>
      </div>
      <h1>Bàn Điều Khiển Tác Chiến: Senior Backend & Distributed Systems</h1>
      <p class="lead">
        Hệ thống quy chuẩn 3 Hộp (Input - Execution - DoD) loại bỏ 100% thời gian chần chừ và suy nghĩ lan man.
        Mỗi ngày ngồi vào máy: <strong>Mở đúng file ➔ Chạy đúng lệnh ➔ Nhìn đúng số liệu đo đạc</strong> để nghiệm thu.
      </p>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-title">Tổng Thời Lượng Deep Work</div>
          <div class="kpi-val">65 Giờ</div>
          <div class="kpi-desc">2.5h/ngày (24 ngày) hoặc 6h/ngày (11 ngày)</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Hệ Thống Thực Hành</div>
          <div class="kpi-val">14 Labs + 4 Sprints</div>
          <div class="kpi-desc">Chạy thẳng trên Docker Compose local 0 VNĐ</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Điểm Khởi Hành Ngay Bây Giờ</div>
          <div class="kpi-val" style="color: var(--warning);">Bài 03: Index</div>
          <div class="kpi-desc">Hoàn thành 3 lý thuyết trên bảng 500k hợp đồng</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Đồ Án Tốt Nghiệp (Capstone)</div>
          <div class="kpi-val" style="color: var(--accent);">Maycha Refactor</div>
          <div class="kpi-desc">Cải tạo codebase hợp đồng đang đóng băng</div>
        </div>
      </div>
    </div>
  </header>

  <main class="container">

    <div class="warning-box">
      <div class="warning-icon">⚠️</div>
      <div>
        <div class="warning-title">Khổng Minh Cảnh Báo: Bẫy Tư Duy Khóa Của SQL Server</div>
        <div class="warning-desc">
          Đạt có kinh nghiệm vững về SQL Server (nơi SELECT giữ Shared Lock chặn UPDATE). Ở PostgreSQL, <strong>Readers NEVER block Writers</strong> (nhờ MVCC).
          Bắt buộc phải học <strong>Bài 12 (MVCC) TRƯỚC Bài 14 (Locking)</strong> để tránh lạm dụng <code>SELECT FOR UPDATE</code> bừa bãi làm nghẽn DB và sinh Deadlock liên tục!
        </div>
      </div>
    </div>

    <!-- Progress Tracker -->
    <section class="progress-section">
      <div class="progress-header">
        <div>
          <strong style="font-size: 1.1rem;">Tiến Độ Hoàn Thành Lộ Trình</strong>
          <span style="color: var(--muted); font-size: 0.9rem; margin-left: 8px;" id="progressText">0 / 24 Ngày (0%)</span>
        </div>
        <button onclick="resetProgress()" style="background: transparent; border: 1px solid var(--border); color: var(--muted); padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">Reset Tiến Độ</button>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" id="progressBar" style="width: 4%;"></div>
      </div>
    </section>

    <!-- Navigation Tabs -->
    <div class="tabs">
      <button class="tab-btn active" onclick="filterTab('all', this)">Tất Cả (24 Ngày)</button>
      <button class="tab-btn" onclick="filterTab('step0', this)">Bước 0: Index Tối Nay</button>
      <button class="tab-btn" onclick="filterTab('chang1', this)">Chặng 1: DB & Tiền Cọc</button>
      <button class="tab-btn" onclick="filterTab('chang2', this)">Chặng 2: Khiên Flash Sale</button>
      <button class="tab-btn" onclick="filterTab('chang3', this)">Chặng 3: Kafka & Outbox</button>
      <button class="tab-btn" onclick="filterTab('chang4', this)">Chặng 4: System Design & Maycha</button>
    </div>

    <!-- DAY CARDS LIST -->

    <!-- NGÀY 1 / BƯỚC 0 -->
    <div class="day-card" data-group="step0" id="card-day-1">
      <div class="day-header">
        <div class="day-title-wrap">
          <input type="checkbox" class="day-check" id="check-day-1" onchange="toggleDay(1)">
          <span class="day-number">Ngày 01 (Tối Nay)</span>
          <span class="day-title">Dứt Điểm Bài 03: Database Index (B-Tree & Covering Index)</span>
        </div>
        <span class="day-time">⏱️ 2.5 Giờ Deep Work</span>
      </div>
      <div class="cockpit-grid">
        <div class="box">
          <div class="box-title input-title">📁 1. Hộp Đầu Vào (Input)</div>
          <div class="box-content">
            <ul>
              <li><strong>Thư mục:</strong> <code>labs/lesson-03-index/</code></li>
              <li><strong>File cần làm:</strong> <code>homework-theories.mine.mjs</code> (Tìm các chữ <code>'???'</code> để điền dự đoán).</li>
              <li><strong>Tài liệu đối chiếu:</strong> Mở <code>reports/advanced_backend/lesson_03_index_teacher_guide.html</code> xem hình minh họa.</li>
            </ul>
          </div>
        </div>
        <div class="box">
          <div class="box-title exec-title">⚡ 2. Hộp Thực Thi (Execution)</div>
          <div class="box-content">
            <p>Mở terminal gõ lệnh:</p>
            <div class="code-block">
              cd labs/lesson-03-index<br>
              npm run homework:setup<br>
              npm run homework
              <button class="copy-btn" onclick="copyCode(this)">Copy</button>
            </div>
            <p>Sau khi điền dự đoán, đối chiếu nghiệm thu mẫu:</p>
            <div class="code-block">
              npm run homework:solution
              <button class="copy-btn" onclick="copyCode(this)">Copy</button>
            </div>
          </div>
        </div>
        <div class="box">
          <div class="box-title dod-title">🎯 3. Hộp Nghiệm Thu (DoD)</div>
          <div class="box-content">
            <ul>
              <li>[ ] <strong>T1:</strong> Thấy index <code>(store_id, status)</code> vô dụng nếu query chỉ lọc <code>status</code>.</li>
              <li>[ ] <strong>T2:</strong> Cột <code>INCLUDE (total)</code> biến câu lệnh thành Index Only Scan, <strong>Heap Fetches = 0</strong>.</li>
              <li>[ ] <strong>T3:</strong> Partial index cho <code>status = 'TERMINATED'</code> có dung lượng siêu nhỏ (~200KB vs ~11MB).</li>
              <li>[ ] Toàn bộ console in ra <code>✔ PASS</code>.</li>
            </ul>
            <div class="interview-q">
              <strong>Phỏng vấn tự vấn:</strong>
              <em>"Tại sao có index mà câu lệnh vẫn Heap Fetch?"</em> ➔ Vì cột trong SELECT chưa nằm trong Index, phải thêm INCLUDE để che phủ (Covering).
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- NGÀY 2 -->
    <div class="day-card" data-group="chang1" id="card-day-2">
      <div class="day-header">
        <div class="day-title-wrap">
          <input type="checkbox" class="day-check" id="check-day-2" onchange="toggleDay(2)">
          <span class="day-number">Ngày 02</span>
          <span class="day-title">Bài 12: Bản Chất Giao Dịch, WAL Log & MVCC Trong PostgreSQL</span>
        </div>
        <span class="day-time">⏱️ 2.5 Giờ Deep Work</span>
      </div>
      <div class="cockpit-grid">
        <div class="box">
          <div class="box-title input-title">📁 1. Hộp Đầu Vào (Input)</div>
          <div class="box-content">
            <ul>
              <li><strong>Tài liệu:</strong> <code>Tài Liệu/advanced_backend/12. Transaction.md</code></li>
              <li><strong>Khái niệm cốt lõi:</strong> 4 thuộc tính ACID, Write-Ahead Logging (WAL), biến ẩn <code>xmin</code>, <code>xmax</code>, địa chỉ vật lý <code>ctid</code>.</li>
            </ul>
          </div>
        </div>
        <div class="box">
          <div class="box-title exec-title">⚡ 2. Hộp Thực Thi (Execution)</div>
          <div class="box-content">
            <p>Mở 2 cửa sổ psql kiểm tra Readers never block Writers:</p>
            <div class="code-block">
              -- T1: BEGIN; SELECT xmin, xmax, ctid, total FROM hw_contracts WHERE id=1;<br>
              -- T2: UPDATE hw_contracts SET total = total + 100 WHERE id = 1;<br>
              -- T1: SELECT xmin, xmax, ctid, total FROM hw_contracts WHERE id=1; COMMIT;
              <button class="copy-btn" onclick="copyCode(this)">Copy</button>
            </div>
          </div>
        </div>
        <div class="box">
          <div class="box-title dod-title">🎯 3. Hộp Nghiệm Thu (DoD)</div>
          <div class="box-content">
            <ul>
              <li>[ ] Tận mắt thấy: UPDATE sinh ra tuple mới với <code>ctid</code> mới, tuple cũ giữ <code>xmax = txid</code>.</li>
              <li>[ ] Thấy Terminal 1 vẫn đọc dữ liệu cũ bình thường mà không hề bị Terminal 2 khóa (Readers never block Writers).</li>
              <li>[ ] Hiểu bản chất tại sao UPDATE nhiều làm sinh ra <strong>Dead Tuples</strong> và làm phình bảng (Bloat).</li>
            </ul>
            <div class="interview-q">
              <strong>Phỏng vấn tự vấn:</strong>
              <em>"Tại sao UPDATE liên tục làm SELECT bị chậm?"</em> ➔ Vì sinh nhiều dead tuples trên page 8KB, SELECT phải đọc nhiều page hơn từ đĩa.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- NGÀY 3 -->
    <div class="day-card" data-group="chang1" id="card-day-3">
      <div class="day-header">
        <div class="day-title-wrap">
          <input type="checkbox" class="day-check" id="check-day-3" onchange="toggleDay(3)">
          <span class="day-number">Ngày 03</span>
          <span class="day-title">Bài 12: 4 Mức Cô Lập & Tái Hiện Dị Thường Write Skew</span>
        </div>
        <span class="day-time">⏱️ 2.5 Giờ Deep Work</span>
      </div>
      <div class="cockpit-grid">
        <div class="box">
          <div class="box-title input-title">📁 1. Hộp Đầu Vào (Input)</div>
          <div class="box-content">
            <ul>
              <li><strong>Tài liệu:</strong> Mục "4 Isolation Levels" trong <code>12. Transaction.md</code>.</li>
              <li><strong>Trọng tâm:</strong> Dirty Read, Non-repeatable Read, Phantom Read, và <strong>Write Skew</strong>.</li>
            </ul>
          </div>
        </div>
        <div class="box">
          <div class="box-title exec-title">⚡ 2. Hộp Thực Thi (Execution)</div>
          <div class="box-content">
            <p>Tái hiện Write Skew trên 2 session psql:</p>
            <div class="code-block">
              BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;<br>
              -- 2 session cùng đếm người đại diện active (đều ra 2)<br>
              -- S1 vô hiệu người A; S2 vô hiệu người B; Cả 2 cùng COMMIT!<br>
              -- Kết quả: Không còn ai active (vi phạm nghiệp vụ)!
              <button class="copy-btn" onclick="copyCode(this)">Copy</button>
            </div>
          </div>
        </div>
        <div class="box">
          <div class="box-title dod-title">🎯 3. Hộp Nghiệm Thu (DoD)</div>
          <div class="box-content">
            <ul>
              <li>[ ] Chứng minh: <code>Repeatable Read</code> trong Postgres chống được Phantom Read nhưng <strong>KHÔNG chống được Write Skew</strong>.</li>
              <li>[ ] Đổi mức cô lập lên <code>SERIALIZABLE</code>: Thấy Postgres tự động bắn lỗi <code>40001</code> để chặn đứng lỗi.</li>
            </ul>
            <div class="interview-q">
              <strong>Phỏng vấn tự vấn:</strong>
              <em>"Repeatable Read có giải quyết được mọi race condition không?"</em> ➔ Không, vẫn bị Write Skew nếu 2 transaction đọc snapshot cũ rồi cập nhật chéo nhau.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- NGÀY 4 -->
    <div class="day-card" data-group="chang1" id="card-day-4">
      <div class="day-header">
        <div class="day-title-wrap">
          <input type="checkbox" class="day-check" id="check-day-4" onchange="toggleDay(4)">
          <span class="day-number">Ngày 04</span>
          <span class="day-title">Bài 14: Database Locking & Triệt Tiêu Toàn Diện Deadlock</span>
        </div>
        <span class="day-time">⏱️ 2.5 Giờ Deep Work</span>
      </div>
      <div class="cockpit-grid">
        <div class="box">
          <div class="box-title input-title">📁 1. Hộp Đầu Vào (Input)</div>
          <div class="box-content">
            <ul>
              <li><strong>Tài liệu:</strong> <code>Tài Liệu/advanced_backend/14. Locking.md</code></li>
              <li><strong>Trọng tâm:</strong> <code>SELECT ... FOR UPDATE</code>, <code>SKIP LOCKED</code>, <code>NOWAIT</code>, Deadlock Graph.</li>
            </ul>
          </div>
        </div>
        <div class="box">
          <div class="box-title exec-title">⚡ 2. Hộp Thực Thi (Execution)</div>
          <div class="box-content">
            <p>Tái hiện Deadlock trên 2 session:</p>
            <div class="code-block">
              -- S1: SELECT * FROM hw_contracts WHERE id = 1 FOR UPDATE;<br>
              -- S2: SELECT * FROM hw_contracts WHERE id = 2 FOR UPDATE;<br>
              -- S1: SELECT * FROM hw_contracts WHERE id = 2 FOR UPDATE;<br>
              -- S2: SELECT * FROM hw_contracts WHERE id = 1 FOR UPDATE; ➔ 40P01 Deadlock!
              <button class="copy-btn" onclick="copyCode(this)">Copy</button>
            </div>
          </div>
        </div>
        <div class="box">
          <div class="box-title dod-title">🎯 3. Hộp Nghiệm Thu (DoD)</div>
          <div class="box-content">
            <ul>
              <li>[ ] Tận mắt thấy mã lỗi <code>ERROR: deadlock detected (40P01)</code>.</li>
              <li>[ ] Khắc phục bằng <strong>Resource Ordering</strong>: Luôn <code>ORDER BY id ASC</code> trước khi khóa $\rightarrow$ Deadlock biến mất 100%.</li>
            </ul>
            <div class="interview-q">
              <strong>Phỏng vấn tự vấn:</strong>
              <em>"Làm thế nào để chuyển tiền giữa 2 tài khoản không bao giờ bị Deadlock?"</em> ➔ Luôn khóa tài khoản có ID nhỏ hơn trước, ID lớn hơn sau.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- NGÀY 5 -->
    <div class="day-card" data-group="chang1" id="card-day-5">
      <div class="day-header">
        <div class="day-title-wrap">
          <input type="checkbox" class="day-check" id="check-day-5" onchange="toggleDay(5)">
          <span class="day-number">Ngày 05</span>
          <span class="day-title">Bài 07 & 14: Sổ Cái Kép (Double-Entry) & Khóa Lạc Quan (OCC)</span>
        </div>
        <span class="day-time">⏱️ 2.5 Giờ Deep Work</span>
      </div>
      <div class="cockpit-grid">
        <div class="box">
          <div class="box-title input-title">📁 1. Hộp Đầu Vào (Input)</div>
          <div class="box-content">
            <ul>
              <li><strong>Tài liệu:</strong> <code>7. Data Modeling.md</code> (Double-Entry Ledger) & <code>14. Locking.md</code> (Optimistic Lock).</li>
              <li><strong>Bất biến:</strong> Tổng tiền Nợ (Debit) = Tổng tiền Có (Credit). Ràng buộc số dư không âm.</li>
            </ul>
          </div>
        </div>
        <div class="box">
          <div class="box-title exec-title">⚡ 2. Hộp Thực Thi (Execution)</div>
          <div class="box-content">
            <p>Tạo schema và logic versioning:</p>
            <div class="code-block">
              CREATE TABLE contract_balances (contract_id bigint PK, deposit_balance numeric CHECK (deposit_balance >= 0), version int);<br>
              UPDATE contract_balances SET deposit_balance = deposit_balance - 500, version = version + 1 WHERE contract_id = 1 AND version = 1;
              <button class="copy-btn" onclick="copyCode(this)">Copy</button>
            </div>
          </div>
        </div>
        <div class="box">
          <div class="box-title dod-title">🎯 3. Hộp Nghiệm Thu (DoD)</div>
          <div class="box-content">
            <ul>
              <li>[ ] Ràng buộc <code>CHECK (deposit_balance >= 0)</code> chặn đứng lỗi âm tiền ở tầng DB.</li>
              <li>[ ] Phân biệt rạch ròi: Dùng Optimistic khi ít xung đột; dùng Pessimistic khi xung đột cao (Flash Sale, nạp rút tiền).</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- NGÀY 6: SPRINT 1 -->
    <div class="day-card" data-group="chang1" id="card-day-6" style="border: 2px solid var(--warning);">
      <div class="day-header" style="background: rgba(245, 158, 11, 0.15);">
        <div class="day-title-wrap">
          <input type="checkbox" class="day-check" id="check-day-6" onchange="toggleDay(6)">
          <span class="day-number sprint">🔥 Sprint 1 Lab</span>
          <span class="day-title" style="color: var(--warning);">Đồ Án Tích Lũy 1: Contract Deposit Settlement Engine</span>
        </div>
        <span class="day-time">⏱️ 3.5 Giờ Deep Work</span>
      </div>
      <div class="cockpit-grid">
        <div class="box">
          <div class="box-title input-title">📁 1. Hộp Đầu Vào (Input)</div>
          <div class="box-content">
            <p>Tạo thư mục mới: <code>engine/sprint-1-settlement/</code></p>
            <p>Bài toán: Viết API thanh lý cọc hợp đồng Maycha khi kết thúc sớm, ghi sổ cái nợ/có và cấn trừ tiền cọc.</p>
          </div>
        </div>
        <div class="box">
          <div class="box-title exec-title">⚡ 2. Hộp Thực Thi (Execution)</div>
          <div class="box-content">
            <p>Viết code Node.js + pg native: <code>SELECT ... FOR UPDATE</code> có <code>SET lock_timeout = '2s'</code>.</p>
            <p>Chạy stress test 500 requests đồng thời:</p>
            <div class="code-block">
              npx autocannon -c 50 -d 5 http://localhost:3000/api/settle-contract
              <button class="copy-btn" onclick="copyCode(this)">Copy</button>
            </div>
          </div>
        </div>
        <div class="box">
          <div class="box-title dod-title">🎯 3. Hộp Nghiệm Thu (Milestone 1 DoD)</div>
          <div class="box-content">
            <ul>
              <li>[ ] Đúng 1 request thành công (hoặc trừ đến hết cọc thì thôi).</li>
              <li>[ ] 499 requests còn lại nhận <code>400/409</code> lỗi số dư không đủ.</li>
              <li>[ ] <strong>0 trường hợp số dư âm</strong>.</li>
              <li>[ ] <strong>0 lỗi Deadlock (40P01)</strong>.</li>
              <li>[ ] <strong>Tổng Nợ = Tổng Có 100.00%</strong>.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- CÁC NGÀY TIẾP THEO (TÓM TẮT CHẶNG 2, 3, 4) -->
    <div class="day-card" data-group="chang2" id="card-day-7">
      <div class="day-header">
        <div class="day-title-wrap">
          <input type="checkbox" class="day-check" id="check-day-7" onchange="toggleDay(7)">
          <span class="day-number">Ngày 07 - 11</span>
          <span class="day-title">Chặng 2: Redis, High-Performance epoll, Zero-Copy & Rate Limiting</span>
        </div>
        <span class="day-time">⏱️ 12.5 Giờ</span>
      </div>
      <div class="cockpit-grid">
        <div class="box">
          <div class="box-title input-title">📁 Input</div>
          <div class="box-content">Khóa 1 (Bài 06, 15, 16) + Khóa 2 (Bài 04). Labs: <code>labs/lesson-02-caching/</code>.</div>
        </div>
        <div class="box">
          <div class="box-title exec-title">⚡ Execution</div>
          <div class="box-content">Dựng Redis 7 Docker. Viết Token Bucket bằng Redis Lua Script. Chạy Singleflight Mutex chống Stampede.</div>
        </div>
        <div class="box">
          <div class="box-title dod-title">🎯 DoD</div>
          <div class="box-content">5,000 req cùng ập vào 1 key hết hạn: DB chỉ nhận đúng 1 query. Rate Limiter chặn chính xác request 101 với HTTP 429.</div>
        </div>
      </div>
    </div>

    <div class="day-card" data-group="chang2" id="card-day-12" style="border: 2px solid var(--warning);">
      <div class="day-header" style="background: rgba(245, 158, 11, 0.15);">
        <div class="day-title-wrap">
          <input type="checkbox" class="day-check" id="check-day-12" onchange="toggleDay(12)">
          <span class="day-number sprint">🔥 Sprint 2 Lab</span>
          <span class="day-title" style="color: var(--warning);">Đồ Án Tích Lũy 2: Flash Sale Shield (Token Bucket + Singleflight)</span>
        </div>
        <span class="day-time">⏱️ 3.5 Giờ</span>
      </div>
      <div class="cockpit-grid">
        <div class="box">
          <div class="box-title input-title">📁 Input</div>
          <div class="box-content">Bọc lớp middleware: Rate Limiter ➔ Bloom Filter ➔ Singleflight Cache ➔ Core Ledger.</div>
        </div>
        <div class="box">
          <div class="box-title exec-title">⚡ Execution</div>
          <div class="box-content">Bắn 10,000 req/s bằng <code>k6</code> vào API xem hợp đồng và cấn trừ cọc.</div>
        </div>
        <div class="box">
          <div class="box-title dod-title">🎯 Milestone 2 DoD</div>
          <div class="box-content">P99 latency &lt; 20ms, CPU database &lt; 35%, hệ thống miễn nhiễm hoàn toàn với bão traffic.</div>
        </div>
      </div>
    </div>

    <div class="day-card" data-group="chang3" id="card-day-13">
      <div class="day-header">
        <div class="day-title-wrap">
          <input type="checkbox" class="day-check" id="check-day-13" onchange="toggleDay(13)">
          <span class="day-number">Ngày 13 - 17</span>
          <span class="day-title">Chặng 3: Kafka KRaft, Cooperative Rebalance & Debezium Outbox CDC</span>
        </div>
        <span class="day-time">⏱️ 12.5 Giờ</span>
      </div>
      <div class="cockpit-grid">
        <div class="box">
          <div class="box-title input-title">📁 Input</div>
          <div class="box-content">Khóa 4: Bài 01-05 (KRaft, Producer), Bài 07-08 (Consumer Liveness), Bài 09 (Outbox CDC).</div>
        </div>
        <div class="box">
          <div class="box-title exec-title">⚡ Execution</div>
          <div class="box-content">Dựng Kafka KRaft (không ZooKeeper). Bật <code>wal_level=logical</code> trên Postgres. Đăng ký Debezium CDC.</div>
        </div>
        <div class="box">
          <div class="box-title dod-title">🎯 DoD</div>
          <div class="box-content">Ghi đơn hàng vào Postgres kèm bảng outbox: Debezium tự đọc WAL bắn sang Kafka &lt; 80ms, <strong>triệt tiêu 100% lỗi Dual-Write</strong>.</div>
        </div>
      </div>
    </div>

    <div class="day-card" data-group="chang3" id="card-day-18" style="border: 2px solid var(--warning);">
      <div class="day-header" style="background: rgba(245, 158, 11, 0.15);">
        <div class="day-title-wrap">
          <input type="checkbox" class="day-check" id="check-day-18" onchange="toggleDay(18)">
          <span class="day-number sprint">🔥 Sprint 3 Lab</span>
          <span class="day-title" style="color: var(--warning);">Đồ Án Tích Lũy 3: Pipeline Đồng Bộ Hợp Đồng Maycha Sang SAP ERP</span>
        </div>
        <span class="day-time">⏱️ 3.5 Giờ</span>
      </div>
      <div class="cockpit-grid">
        <div class="box">
          <div class="box-title input-title">📁 Input</div>
          <div class="box-content">Đường ống: Duyệt Hợp Đồng ➔ Postgres Outbox ➔ Debezium CDC ➔ Kafka ➔ SAP Consumer Mock.</div>
        </div>
        <div class="box">
          <div class="box-title exec-title">⚡ Execution</div>
          <div class="box-content">Stream 1,000 sự kiện liên tục. Cố tình rút mạng Consumer giữa chừng rồi bật lại.</div>
        </div>
        <div class="box">
          <div class="box-title dod-title">🎯 Milestone 3 DoD</div>
          <div class="box-content">1,000 sự kiện xuất hiện đầy đủ bên SAP Consumer, đúng thứ tự từng cửa hàng (Key = store_id), 0 lost event.</div>
        </div>
      </div>
    </div>

    <div class="day-card" data-group="chang4" id="card-day-19">
      <div class="day-header">
        <div class="day-title-wrap">
          <input type="checkbox" class="day-check" id="check-day-19" onchange="toggleDay(19)">
          <span class="day-number">Ngày 19 - 22</span>
          <span class="day-title">Chặng 4: System Design Framework, URL Shortener, Threads & Top 40 CCDAK</span>
        </div>
        <span class="day-time">⏱️ 10.0 Giờ</span>
      </div>
      <div class="cockpit-grid">
        <div class="box">
          <div class="box-title input-title">📁 Input</div>
          <div class="box-content">Khóa 2 (Bài 01, 02, 08, 09) + Khóa 4 (File <code>CCDAK Exam_2.pdf</code>).</div>
        </div>
        <div class="box">
          <div class="box-title exec-title">⚡ Execution</div>
          <div class="box-content">Luyện vẽ 4 bước cho Bitly URL Shortener và Twitter/Threads (Celebrity 30M followers). Giải 40 câu CCDAK.</div>
        </div>
        <div class="box">
          <div class="box-title dod-title">🎯 DoD</div>
          <div class="box-content">Tự tính nhẩm capacity trong 10 phút. Trả lời đúng &gt;= 85% các câu hỏi CCDAK về Rebalance và EOS.</div>
        </div>
      </div>
    </div>

    <div class="day-card" data-group="chang4" id="card-day-23" style="border: 2px solid var(--danger);">
      <div class="day-header" style="background: rgba(239, 68, 68, 0.15);">
        <div class="day-title-wrap">
          <input type="checkbox" class="day-check" id="check-day-23" onchange="toggleDay(23)">
          <span class="day-number capstone">🏆 Capstone Showcase</span>
          <span class="day-title" style="color: var(--danger);">Ngày 23 - 24: Refactor Codebase Quản Lý Hợp Đồng Maycha Đóng Băng</span>
        </div>
        <span class="day-time">⏱️ 5.0 Giờ (Tốt Nghiệp)</span>
      </div>
      <div class="cockpit-grid">
        <div class="box">
          <div class="box-title input-title">📁 Input</div>
          <div class="box-content">Mở thư mục: <code>D:\work\maycha\quan_ly_hop_dong</code>.</div>
        </div>
        <div class="box">
          <div class="box-title exec-title">⚡ Execution</div>
          <div class="box-content">
            1. Đưa <code>SELECT FOR UPDATE</code> vào luồng duyệt cọc hợp đồng.<br>
            2. Thêm bảng <code>OutboxEvent</code> đồng bộ SAP ERP bất đồng bộ.<br>
            3. Tối ưu Covering Index cho API danh sách hợp đồng.
          </div>
        </div>
        <div class="box">
          <div class="box-title dod-title">🎯 Graduation DoD</div>
          <div class="box-content">
            Soạn file <code>ARCHITECTURE_SHOWCASE.md</code> trong repo Maycha. Điền vào CV: <em>"Core Settlement & Streaming Engine 5,000 TPS, Zero Data Loss SAP Sync"</em>. Tự tin phỏng vấn Senior!
          </div>
        </div>
      </div>
    </div>

  </main>

  <footer>
    <div class="container">
      <p>Lộ Trình Tác Chiến Cá Nhân Hóa Dành Cho Đạt | Phiên Bản 1.0 (Advisory Approved)</p>
      <p style="margin-top: 6px;">File gốc: <code>reports/LO_TRINH_HOC_CHI_TIET_A_Z_TANG_TOC.md</code></p>
    </div>
  </footer>

  <script>
    // LocalStorage State Management
    const TOTAL_DAYS = 24;

    function init() {
      let saved = JSON.parse(localStorage.getItem('dat_study_progress') || '{}');
      let doneCount = 0;
      for (let i = 1; i <= TOTAL_DAYS; i++) {
        let el = document.getElementById('check-day-' + i);
        if (el) {
          if (saved[i]) {
            el.checked = true;
            document.getElementById('card-day-' + i).classList.add('completed');
            doneCount++;
          }
        }
      }
      updateProgressBar(doneCount);
    }

    function toggleDay(dayNum) {
      let el = document.getElementById('check-day-' + dayNum);
      let card = document.getElementById('card-day-' + dayNum);
      let saved = JSON.parse(localStorage.getItem('dat_study_progress') || '{}');

      if (el.checked) {
        saved[dayNum] = true;
        card.classList.add('completed');
      } else {
        delete saved[dayNum];
        card.classList.remove('completed');
      }

      localStorage.setItem('dat_study_progress', JSON.stringify(saved));
      let doneCount = Object.keys(saved).length;
      updateProgressBar(doneCount);
    }

    function updateProgressBar(doneCount) {
      let pct = Math.round((doneCount / TOTAL_DAYS) * 100);
      pct = Math.max(pct, 4); // min visual
      document.getElementById('progressBar').style.width = pct + '%';
      document.getElementById('progressText').innerText = doneCount + ' / ' + TOTAL_DAYS + ' Ngày (' + pct + '%)';
    }

    function resetProgress() {
      if (confirm('Bạn có chắc chắn muốn reset toàn bộ tiến độ học?')) {
        localStorage.removeItem('dat_study_progress');
        location.reload();
      }
    }

    function filterTab(group, btn) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.day-card').forEach(card => {
        if (group === 'all' || card.getAttribute('data-group') === group) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    }

    function copyCode(btn) {
      let block = btn.parentElement;
      let text = block.innerText.replace('Copy', '').trim();
      navigator.clipboard.writeText(text).then(() => {
        let orig = btn.innerText;
        btn.innerText = 'Copied!';
        setTimeout(() => { btn.innerText = orig; }, 1500);
      });
    }

    document.addEventListener('DOMContentLoaded', init);
  </script>
</body>
</html>
"""

report_dir = "reports"
os.makedirs(report_dir, exist_ok=True)
output_path = os.path.join(report_dir, "LO_TRINH_HOC_CHI_TIET_A_Z_TANG_TOC.html")

with open(output_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"Generated visual interactive HTML roadmap at: {output_path}")
