-- Xô Thẻ bài nạp liên tục (Token Bucket · Chặng 4 · Slide 16)
-- KEYS[1]: Hash lưu {tokens, last_ms}
-- ARGV[1]: sức chứa (cap), ARGV[2]: tốc độ nạp (tokens/giây), ARGV[3]: chi phí (mặc định 1), ARGV[4]: now_ms tùy chọn (mặc định gọi TIME)
local cap = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])
local cost = tonumber(ARGV[3]) or 1
local now = tonumber(ARGV[4])
if not now then
  local t = redis.call('TIME')
  now = math.floor(tonumber(t[1]) * 1000 + tonumber(t[2]) / 1000)
end

local vals = redis.call('HMGET', KEYS[1], 'tokens', 'last_ms')
local tokens, last_ms
if not vals[1] then
  tokens = cap
  last_ms = now
else
  local old_tokens = tonumber(vals[1])
  local old_last = tonumber(vals[2])
  -- Chặn đồng hồ lùi (clamp >= 0) và giữ last_ms đơn điệu không giảm
  local elapsed = math.max(0, now - old_last)
  tokens = math.min(cap, old_tokens + (elapsed * rate) / 1000)
  last_ms = math.max(old_last, now)
end

local ttl = math.max(1, math.ceil((cap / rate) * 1000))
if tokens >= cost then
  tokens = tokens - cost
  redis.call('HSET', KEYS[1], 'tokens', tostring(tokens), 'last_ms', tostring(last_ms))
  redis.call('PEXPIRE', KEYS[1], ttl)
  return {1, math.floor(tokens), 0}
end

local retry = math.ceil(((cost - tokens) * 1000) / rate)
redis.call('HSET', KEYS[1], 'tokens', tostring(tokens), 'last_ms', tostring(last_ms))
redis.call('PEXPIRE', KEYS[1], ttl)
return {0, math.floor(tokens), retry}
