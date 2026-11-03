-- Giới hạn tốc độ Nhật ký Cửa sổ Trượt (Sliding Window Log · Chặng 3)
-- KEYS[1]: ZSET lưu dấu thời gian các request được nhận
-- ARGV[1]: L, ARGV[2]: W (ms), ARGV[3]: now_ms, ARGV[4]: req_id
local L = tonumber(ARGV[1])
local W = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local id = ARGV[4] or ''

-- Dọn các mục đã lọt ra ngoài khoảng (now - W, now]
redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', now - W)
local n = redis.call('ZCARD', KEYS[1])

if n < L then
  redis.call('ZADD', KEYS[1], now, now .. '-' .. id)
  redis.call('PEXPIRE', KEYS[1], 2 * W)
  return {1, n + 1, 0}
end

local oldest = tonumber(redis.call('ZRANGE', KEYS[1], 0, 0, 'WITHSCORES')[2])
return {0, n, oldest + W - now}
