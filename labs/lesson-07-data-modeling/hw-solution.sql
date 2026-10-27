-- Bài 07 · LỜI GIẢI MẪU bài tập slide 35: schema đặt vé máy bay theo table template.
-- Hãy tự làm trước (tạo bảng hw_* của bạn), chạy hw-check.sql, rồi mới mở file này để so.
-- Chạy file này sẽ XÓA các bảng hw_flights, hw_seats, hw_bookings, hw_airports của bạn và dựng bản mẫu.

-- #region solution · Sân bay, chuyến bay, ghế, vé
SET search_path = lab07_modeling;  -- DB mặc định trỏ vào lab03_indexing
SET statement_timeout = '60s'; SET lock_timeout = '5s';
DROP TABLE IF EXISTS hw_bookings, hw_seats, hw_flights, hw_airports;
-- Bảng cấu hình (config table, slide 8): ít đổi, nhiều nơi tham chiếu.
CREATE TABLE hw_airports (
  code       char(3) PRIMARY KEY,                     -- SGN, HAN, DAD
  name       text NOT NULL,
  timezone   text NOT NULL,                           -- hiển thị giờ địa phương (slide 24)
  version    int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE hw_flights (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code         text NOT NULL,                         -- VN123
  origin       char(3) NOT NULL REFERENCES hw_airports (code),
  destination  char(3) NOT NULL REFERENCES hw_airports (code),
  departs_at   timestamptz NOT NULL,
  arrives_at   timestamptz NOT NULL,
  base_fare    numeric(12,2) NOT NULL CHECK (base_fare >= 0),
  status       text NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'BOARDING', 'DEPARTED', 'CANCELLED')),
  data         jsonb NOT NULL DEFAULT '{}',           -- thuộc tính mở rộng: loại máy bay, suất ăn…
  version      int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (code, departs_at),
  CHECK (arrives_at > departs_at),
  CHECK (origin <> destination)
);
CREATE INDEX ON hw_flights (origin);
CREATE INDEX ON hw_flights (destination);
-- Mỗi ghế của mỗi chuyến là một dòng sinh sẵn (giống homestay slide 29): trạng thái và giá riêng từng ghế.
CREATE TABLE hw_seats (
  flight_id  bigint NOT NULL REFERENCES hw_flights (id),
  seat_no    text NOT NULL,                           -- 12A
  cabin      text NOT NULL CHECK (cabin IN ('ECONOMY', 'BUSINESS')),
  fare       numeric(12,2) NOT NULL CHECK (fare >= 0),
  status     text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'HELD', 'SOLD')),
  version    int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (flight_id, seat_no)                    -- index bắt đầu bằng flight_id phục vụ luôn FK
);
CREATE TABLE hw_bookings (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  flight_id       bigint NOT NULL,
  seat_no         text NOT NULL,
  passenger_name  text NOT NULL,
  amount          numeric(12,2) NOT NULL CHECK (amount >= 0),
  status          text NOT NULL DEFAULT 'HELD' CHECK (status IN ('HELD', 'PAID', 'CANCELLED')),
  idempotency_key text NOT NULL UNIQUE,
  version         int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (flight_id, seat_no) REFERENCES hw_seats (flight_id, seat_no)
);
CREATE INDEX ON hw_bookings (flight_id, seat_no);
-- Một ghế chỉ có tối đa một vé còn hiệu lực (vé đã hủy không chặn người sau): EXCLUDE với điều kiện WHERE.
ALTER TABLE hw_bookings ADD CONSTRAINT hw_bookings_seat_active_uniq EXCLUDE (flight_id WITH =, seat_no WITH =) WHERE (status <> 'CANCELLED');
-- #endregion
