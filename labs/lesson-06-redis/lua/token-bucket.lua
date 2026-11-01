-- Bài 06 · Chặng 9 — Token bucket nguyên tử (OmniPOS FR-M2-05: giới hạn request theo storeId).
-- Đọc số token, nạp thêm theo thời gian đã trôi, trừ 1 nếu đủ, ghi lại: tất cả trong một script nên không ai chen vào.
-- KEYS[1] = Hash của bucket (tokens, ts), ARGV[1] = sức chứa (capacity), ARGV[2] = số token nạp lại mỗi giây.
-- "Bây giờ" lấy từ TIME của Redis (mili giây), không do client truyền vào.
-- Trả {allowed 1/0, số token còn (làm tròn xuống), retry_after_ms}. retry_after_ms làm tròn lên cả giây
-- vì header HTTP Retry-After tính bằng giây.
local cap = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])
local t = redis.call('TIME')
local now = tonumber(t[1]) * 1000 + math.floor(tonumber(t[2]) / 1000)
local tokens = tonumber(redis.call('HGET', KEYS[1], 'tokens'))
local ts = tonumber(redis.call('HGET', KEYS[1], 'ts'))
if tokens == nil then
  tokens = cap -- bucket mới: đầy
  ts = now
end
-- Đồng hồ server có thể bị chỉnh lùi (chặng 8 đã thấy trên máy ảo Docker): khi đó now < ts, không được nạp số âm.
local elapsed = math.max(0, now - ts)
tokens = math.min(cap, tokens + elapsed / 1000 * rate)
local allowed, retry = 0, 0
if tokens >= 1 then
  allowed = 1
  tokens = tokens - 1
else
  retry = math.ceil((1 - tokens) / rate) * 1000
end
redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', now)
-- Bucket không ai gọi tới thì tự hết hạn sau thời gian nạp đầy lại.
redis.call('PEXPIRE', KEYS[1], math.ceil(cap / rate * 1000))
return {allowed, math.floor(tokens), retry}
