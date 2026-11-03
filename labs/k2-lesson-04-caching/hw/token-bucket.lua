-- Bài tập tối K2 Bài 04 (50/50 Scaffold · hình mẫu FR-M2-05 của OmniPOS)
-- Điền đúng 8 chỗ trống __1__ … __8__ rồi tự chấm bằng:
--   HW_LUA=labs/k2-lesson-04-caching/hw/token-bucket.lua bash labs/k2-lesson-04-caching/hw-check.sh
--
-- Hợp đồng:
--   KEYS[1] = k2l04:hw:tb:{<storeId>} (Hash gồm 2 trường: tokens, last_ms)
--   ARGV[1] = sức chứa tối đa (cap)
--   ARGV[2] = tốc độ nạp lại mỗi giây (rate)
--   ARGV[3] = now_ms tùy chọn (nếu vắng mặt thì lấy từ đồng hồ TIME của Redis)
--   Trả về  = {allowed (1|0), math.floor(tokens), retry_after_ms}

local cap = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
if not now then
  local t = redis.call('TIME')
  -- [Chỗ trống 1] Đổi cặp {giây, micro-giây} của TIME sang mili-giây nguyên (math.floor)
  now = __1__
end

local vals = redis.call('HMGET', KEYS[1], 'tokens', 'last_ms')
local tokens, last_ms
if not vals[1] then
  -- [Chỗ trống 2] Khóa mới tinh thì khởi tạo đầy xô
  tokens = __2__
  last_ms = now
else
  local old_tokens = tonumber(vals[1])
  local old_last = tonumber(vals[2])
  -- [Chỗ trống 3] Chặn trường hợp đồng hồ bị giật lùi (elapsed không bao giờ âm)
  local elapsed = __3__
  -- [Chỗ trống 4] Nạp thêm token theo elapsed * rate / 1000 nhưng không vượt trần cap
  tokens = __4__
  -- [Chỗ trống 7] Giữ last_ms đơn điệu không giảm ngay cả khi now < old_last
  last_ms = __7__
end

-- [Chỗ trống 8] Thời gian tự dọn khóa (ms) đủ để xô nạp đầy lại từ 0: ceil(cap / rate * 1000)
local ttl = __8__

-- [Chỗ trống 5] Điều kiện cho phép tiêu 1 token
if __5__ then
  tokens = tokens - 1
  redis.call('HSET', KEYS[1], 'tokens', tostring(tokens), 'last_ms', tostring(last_ms))
  redis.call('PEXPIRE', KEYS[1], ttl)
  return {1, math.floor(tokens), 0}
end

-- [Chỗ trống 6] Số mili-giây cần chờ tới khi đủ 1 token (làm tròn lên bằng math.ceil)
local retry = __6__
redis.call('HSET', KEYS[1], 'tokens', tostring(tokens), 'last_ms', tostring(last_ms))
redis.call('PEXPIRE', KEYS[1], ttl)
return {0, math.floor(tokens), retry}
