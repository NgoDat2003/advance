-- Xô Rò rỉ mô phỏng hàng đợi đều nhịp (Leaky Bucket · Chặng 4 · Slide 15)
-- KEYS[1]: ZSET các yêu cầu đang chờ tới lượt xử lý, KEYS[2]: mốc xử lý gần nhất (last_start_ms)
-- ARGV[1]: sức chứa hàng đợi Q, ARGV[2]: khoảng cách xuất chuồng I (ms), ARGV[3]: now_ms, ARGV[4]: req_id
local Q = tonumber(ARGV[1])
local I = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local id = ARGV[4] or ''

redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', now)
local waiting = redis.call('ZCARD', KEYS[1])
if waiting >= Q then
  local first = tonumber(redis.call('ZRANGE', KEYS[1], 0, 0, 'WITHSCORES')[2])
  return {0, waiting, first - now}
end

local last_raw = redis.call('GET', KEYS[2])
local start = last_raw and math.max(now, tonumber(last_raw) + I) or now
local ttl = (Q + 2) * I
redis.call('SET', KEYS[2], start, 'PX', ttl)

local added = 0
if start > now then
  redis.call('ZADD', KEYS[1], start, now .. '-' .. id)
  redis.call('PEXPIRE', KEYS[1], ttl)
  added = 1
end
return {1, waiting + added, start - now}
