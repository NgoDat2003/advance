-- Nhận nguyên tử 1 công việc đã đến hạn trong ZSET Delay Queue (Chặng 8 · Slide 34)
-- KEYS[1]: ZSET hàng chờ (score = giây Unix), KEYS[2]: List việc đã nhận
local now = tonumber(redis.call('TIME')[1])
local due = redis.call('ZRANGE', KEYS[1], '-inf', now, 'BYSCORE', 'LIMIT', 0, 1)
if #due == 0 then
  return nil
end
redis.call('ZREM', KEYS[1], due[1])
redis.call('RPUSH', KEYS[2], due[1])
redis.call('EXPIRE', KEYS[2], 600)
return due[1]
