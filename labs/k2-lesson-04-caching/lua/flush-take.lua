-- Đọc toàn bộ delta rồi xóa nguyên tử để xả xuống PostgreSQL (Write-Behind Flush · Chặng 5 · Slide 21)
-- KEYS[1]: Hash lưu delta chưa xả (k2l04:cnt:delta)
local all = redis.call('HGETALL', KEYS[1])
if #all > 0 then
  redis.call('DEL', KEYS[1])
end
return all
