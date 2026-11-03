-- Giới hạn tốc độ Cửa sổ Cố định (Fixed Window · Chặng 3 · Slide 13)
-- KEYS[1]: k2l04:rl:fw:{store}:<window_index>
-- ARGV[1]: L (định mức), ARGV[2]: W (độ rộng cửa sổ ms), ARGV[3]: now_ms
local L = tonumber(ARGV[1])
local W = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local n = redis.call('INCR', KEYS[1])
if n == 1 then
  redis.call('PEXPIRE', KEYS[1], 2 * W)
end

if n <= L then
  return {1, n, 0}
end
return {0, n, W - (now % W)}
