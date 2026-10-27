-- Fixture SAI cố ý (chỉ controller dùng): hw-check phải báo ✘ đúng ở H2, H3, H4, H5, H9.
SET search_path = lab07_modeling;
DROP TABLE IF EXISTS hw_bookings, hw_seats, hw_flights, hw_airports;
CREATE TABLE hw_flights (
  id         bigint PRIMARY KEY,
  code       text NOT NULL,
  departs_at timestamp NOT NULL,          -- sai: không có múi giờ
  fare       double precision NOT NULL,   -- sai: tiền dùng float
  status     text NOT NULL CHECK (status IN ('SCHEDULED', 'CANCELLED')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE hw_bookings (
  id         bigint PRIMARY KEY,
  flight_id  bigint NOT NULL REFERENCES hw_flights (id),  -- sai: không có index
  seat_no    text NOT NULL,
  status     text NOT NULL CHECK (status IN ('HELD', 'PAID', 'CANCELLED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seat_no, flight_id)   -- index bắt đầu bằng seat_no nên không phục vụ được flight_id
);
