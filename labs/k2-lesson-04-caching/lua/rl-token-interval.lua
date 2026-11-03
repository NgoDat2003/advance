-- Xô Thẻ bài nạp theo đợt cố định như hình vẽ Slide 16 (thực chất tương đương Fixed Window)
-- KEYS[1]: Hash lưu {slot, tokens}
-- ARGV[1]: cap, ARGV[2]: chu kỳ nạp I (ms), ARGV[3]: now_ms
local cap = tonumber(ARGV[1])
local I = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local slot = math.floor(now / I)
local vals = redis.call('HMGET', KEYS[1], 'slot', 'tokens')
local tokens
if (not vals[1]) or (tonumber(vals[1]) ~= slot) then
  tokens = cap
else
  tokens = tonumber(vals[2])
end

if tokens >= 1 then
  tokens = tokens - 1
  redis.call('HSET', KEYS[1], 'slot', slot, 'tokens', tokens)
  redis.call('PEXPIRE', KEYS[1], 2 * I)
  return {1, tokens, 0}
end

redis.call('HSET', KEYS[1], 'slot', slot, 'tokens', 0)
redis.call('PEXPIRE', KEYS[1], 2 * I)
return {0, 0, (slot + 1) * I - now}
