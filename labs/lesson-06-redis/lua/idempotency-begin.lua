-- Bài 06 · Chặng 9 — Bắt đầu một request có Idempotency-Key (OmniPOS FR-M2-02, tiếp Bài 01).
-- KEYS[1] = bản ghi của key (Hash: hash, status, resp), ARGV[1] = hash của body request, ARGV[2] = TTL (giây).
-- Trả:
--   NEW          lần đầu thấy key: đã giữ chỗ với status IN_PROGRESS, app được phép xử lý
--   IN_PROGRESS  request trùng tới khi bản đầu còn đang chạy: app trả 409, không xử lý lại
--   {DONE, resp} đã xử lý xong: app trả lại đúng response đã lưu
--   MISMATCH     cùng key nhưng body khác: app trả 422
local h = redis.call('HGET', KEYS[1], 'hash')
if not h then
  redis.call('HSET', KEYS[1], 'hash', ARGV[1], 'status', 'IN_PROGRESS')
  redis.call('EXPIRE', KEYS[1], ARGV[2])
  return 'NEW'
end
if h ~= ARGV[1] then
  return 'MISMATCH'
end
local st = redis.call('HGET', KEYS[1], 'status')
if st == 'DONE' then
  return {'DONE', redis.call('HGET', KEYS[1], 'resp')}
end
return st
