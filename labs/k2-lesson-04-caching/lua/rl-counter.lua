-- Bộ đếm Cửa sổ Trượt xấp xỉ (Sliding Window Counter · Chặng 3 · Slide 14)
-- KEYS[1]: khóa cửa sổ hiện tại w, KEYS[2]: khóa cửa sổ liền trước w-1
-- ARGV[1]: L, ARGV[2]: W (ms), ARGV[3]: now_ms
local L = tonumber(ARGV[1])
local W = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local w = math.floor(now / W)
local prev = tonumber(redis.call('GET', KEYS[2]) or '0')
local cur = tonumber(redis.call('GET', KEYS[1]) or '0')

-- Ước lượng số request trong khoảng trượt W ms vừa qua (công thức Slide 14)
local est = prev * (1 - (now % W) / W) + cur
local est_str = string.format('%.14g', est + 1)

if est + 1 <= L then
  redis.call('INCR', KEYS[1])
  redis.call('PEXPIRE', KEYS[1], 3 * W)
  return {1, est_str, 0, prev, cur + 1}
end

local need = L - 1 - cur
local retry
if need < 0 then
  retry = (w + 1) * W + math.ceil(W * (1 - (L - 1) / cur)) - now
else
  retry = w * W + math.ceil(W * (1 - need / prev)) - now
end
return {0, est_str, retry, prev, cur}
