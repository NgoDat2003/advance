-- Bài 06 · Chặng 8 — Lấy khóa VÀ nhận fencing token trong cùng một script (nguyên tử).
-- KEYS[1] = khóa, KEYS[2] = bộ đếm fencing token, ARGV[1] = token riêng của lần giữ khóa, ARGV[2] = TTL (ms).
-- Lấy được khóa → INCR bộ đếm, trả số token mới. Khóa đang có người giữ → trả nil, bộ đếm không đổi.
-- Vì sao phải chung một script: nếu SET NX xong mới INCR bằng một lệnh riêng, người giữ khóa có thể bị dừng
-- giữa hai lệnh; khóa hết hạn, người sau lấy khóa và INCR trước, nên người đến muộn lại cầm token LỚN hơn
-- và nơi ghi chấp nhận người đến muộn. Thứ tự token phải trùng thứ tự giữ khóa.
if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2]) then
  return redis.call('INCR', KEYS[2])
end
return false
