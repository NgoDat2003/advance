-- Bộ lọc Bloom tự dựng trên Redis 7.2.3 chuẩn bằng sha1hex + SETBIT/GETBIT (Chặng 8 · Slide 37)
-- KEYS[1]: khóa Bitmap của bộ lọc Bloom
-- ARGV[1]: "add" hoặc "check", ARGV[2]: m (số bit), ARGV[3]: k (số hàm băm), ARGV[4]: chuỗi phần tử
local op = ARGV[1]
local m = tonumber(ARGV[2])
local k = tonumber(ARGV[3])
local item = ARGV[4]
local h = redis.sha1hex(item)

if op == 'add' then
  for j = 0, k - 1 do
    local chunk = (j < 5) and string.sub(h, 8 * j + 1, 8 * j + 8) or string.sub(redis.sha1hex(item .. ':' .. j), 1, 8)
    local pos = tonumber(chunk, 16) % m
    redis.call('SETBIT', KEYS[1], pos, 1)
  end
  return 1
end

for j = 0, k - 1 do
  local chunk = (j < 5) and string.sub(h, 8 * j + 1, 8 * j + 8) or string.sub(redis.sha1hex(item .. ':' .. j), 1, 8)
  local pos = tonumber(chunk, 16) % m
  if redis.call('GETBIT', KEYS[1], pos) == 0 then
    return 0
  end
end
return 1
