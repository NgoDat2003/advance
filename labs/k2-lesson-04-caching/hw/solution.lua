-- Lời giải tham chiếu Bài tập K2 Bài 04 (FR-M2-05 Token Bucket theo storeId)
-- KEYS[1] = k2l04:hw:tb:{<storeId>}
-- ARGV[1] = cap, ARGV[2] = rate (tokens/s), ARGV[3] = now_ms tùy chọn (mặc định TIME)
local cap = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
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
  local elapsed = math.max(0, now - old_last)
  tokens = math.min(cap, old_tokens + (elapsed * rate) / 1000)
  last_ms = math.max(old_last, now)
end

local ttl = math.max(1, math.ceil((cap / rate) * 1000))
if tokens >= 1 then
  tokens = tokens - 1
  redis.call('HSET', KEYS[1], 'tokens', tostring(tokens), 'last_ms', tostring(last_ms))
  redis.call('PEXPIRE', KEYS[1], ttl)
  return {1, math.floor(tokens), 0}
end

local retry = math.ceil(((1 - tokens) * 1000) / rate)
redis.call('HSET', KEYS[1], 'tokens', tostring(tokens), 'last_ms', tostring(last_ms))
redis.call('PEXPIRE', KEYS[1], ttl)
return {0, math.floor(tokens), retry}
