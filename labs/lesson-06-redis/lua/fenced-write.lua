-- Bài 06 · Chặng 8 — Ghi có fencing token: nơi lưu dữ liệu nhớ token lớn nhất đã nhận, chỉ nhận token MỚI hơn.
-- Cùng ý với cột version của Bài 14: chính chỗ ghi kiểm tra, không tin người đang cầm khóa. Khác ở phép so:
-- version so BẰNG với số đã đọc (WHERE version = $v), fencing so LỚN HƠN token đã ghi gần nhất (token tăng dần).
-- KEYS[1] = bản ghi ghế (Hash: owner, token), ARGV[1] = token (số lock-acquire-fenced.lua trả khi lấy khóa), ARGV[2] = người ghi.
-- Trả "OK" khi ghi được, "STALE <token đang có>" khi token không mới hơn (người giữ khóa đã hết hạn mà không biết).
-- Token bằng token đã ghi cũng bị từ chối: mỗi lần giữ khóa ghi một lần (giống điều kiện fence < $2 ở Postgres).
local last = tonumber(redis.call('HGET', KEYS[1], 'token') or '0')
local token = tonumber(ARGV[1])
if token <= last then
  return 'STALE ' .. last
end
redis.call('HSET', KEYS[1], 'owner', ARGV[2], 'token', token)
return 'OK'
