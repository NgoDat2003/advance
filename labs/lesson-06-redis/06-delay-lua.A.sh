# Bài 06 · Chặng 6 — Terminal A (Git Bash): poller dùng Lua delay-claim.lua, đọc + xóa + ghi trong một bước (slide 37).
# Thứ tự: (1) claim-reset ở A, (2) claim ở B (B đứng chờ), (3) claim ở A. Dán từng dòng.
# Script chạy từ file lua/delay-claim.lua trong container (mount /lab chỉ đọc), nên chữ chạy chính là file bạn đọc.

# #region claim-reset · Chuẩn bị lại đúng như bản ngây thơ: o1 đến hạn, o2 và o3 năm 2100 (slide 37)
set -u
docker exec advance-be-redis redis-cli UNLINK l06:delay:orders l06:delay:done l06:barrier:delay-lua
docker exec advance-be-redis redis-cli ZADD l06:delay:orders 1704790435 o1 4102444800 o2 4102444800 o3
# #endregion

# #region claim · Hai poller cùng gọi delay-claim.lua: chỉ một người nhận o1 (slide 37)
docker exec advance-be-redis redis-cli RPUSH l06:barrier:delay-lua go
set -u
MSYS_NO_PATHCONV=1 docker exec advance-be-redis redis-cli --eval /lab/lua/delay-claim.lua l06:delay:orders l06:delay:done
sleep 1
# o1 có đúng MỘT lần trong danh sách đã nhận; o2, o3 vẫn chờ tới năm 2100.
docker exec advance-be-redis redis-cli LRANGE l06:delay:done 0 -1
docker exec advance-be-redis redis-cli ZRANGE l06:delay:orders 0 -1
# #endregion
