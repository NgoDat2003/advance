-- Đổi mã giảm giá nguyên tử bằng Lua (Chặng 2 · Slide 33)
-- KEYS[1]: khóa tồn kho (ví dụ k2l04:voucher:V1:stock)
-- KEYS[2]: danh sách người đã đổi thành công
-- ARGV[1]: mã người dùng / thiết bị
local stock = tonumber(redis.call('GET', KEYS[1]) or '0')
if stock > 0 then
  redis.call('DECR', KEYS[1])
  redis.call('RPUSH', KEYS[2], ARGV[1])
  return 1
end
return 0
