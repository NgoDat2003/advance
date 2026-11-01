-- Bài 06 · Chặng 8 — Trả khóa an toàn (compare-and-delete), giống Bài 02 lab 06.
-- Chỉ xóa khi khóa VẪN là của mình. GET và DEL nằm trong một script nên không ai chen vào giữa.
-- KEYS[1] = khóa, ARGV[1] = token của mình. Trả 1 = đã xóa, 0 = khóa không còn là của mình (không đụng vào).
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
