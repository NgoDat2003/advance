# Bài 06 · Chặng 6 — Terminal B (Git Bash): poller thứ hai dùng cùng script Lua (slide 37). Dán ở B TRƯỚC khi dán ở A.

# #region claim · B gọi delay-claim.lua sau A 0,2 s: nhận nil (dòng trống) (slide 37)
docker exec advance-be-redis redis-cli BLPOP l06:barrier:delay-lua 5
set -u
# B chậm hơn 0,2 s để lần nào chạy cũng cùng người thắng. Bỏ dòng sleep thì người thắng đổi ngẫu nhiên,
# nhưng vẫn chỉ MỘT người nhận được o1.
sleep 0.2
MSYS_NO_PATHCONV=1 docker exec advance-be-redis redis-cli --eval /lab/lua/delay-claim.lua l06:delay:orders l06:delay:done
# #endregion
