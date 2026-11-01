-- Bài 06 · Chặng 6 — Nhận MỘT việc đã đến hạn trong hàng chờ trễ (delay queue), nguyên tử.
-- Cả script chạy liền một mạch trên server: không lệnh nào của client khác chen vào giữa đọc và xóa.
-- KEYS[1] = Sorted Set hàng chờ (điểm = giờ đến hạn, giây Unix), KEYS[2] = List các việc đã nhận.
-- "Bây giờ" lấy từ đồng hồ của Redis (TIME), không do client truyền vào.
local now = tonumber(redis.call('TIME')[1])
local due = redis.call('ZRANGE', KEYS[1], '-inf', now, 'BYSCORE', 'LIMIT', 0, 1)
if #due == 0 then
  return nil -- chưa có việc nào đến hạn (hoặc người khác đã nhận mất)
end
redis.call('ZREM', KEYS[1], due[1])
redis.call('RPUSH', KEYS[2], due[1])
return due[1]
