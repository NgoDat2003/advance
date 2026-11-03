-- Đưa yêu cầu vào hàng đợi List có trần kích thước (Leaky Worker Demo · Chặng 4 · Slide 15)
-- KEYS[1]: khóa List hàng đợi, ARGV[1]: trần hàng đợi, ARGV[2]: mã yêu cầu kèm mốc giờ
local cap = tonumber(ARGV[1])
if redis.call('LLEN', KEYS[1]) < cap then
  redis.call('RPUSH', KEYS[1], ARGV[2])
  redis.call('PEXPIRE', KEYS[1], 60000)
  return 1
end
return 0
