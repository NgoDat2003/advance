# Bài 06 · Chặng 9 — Terminal B (Git Bash): request thứ hai gọi cùng script (slide 41). Dán ở B TRƯỚC khi dán ở A.

# #region claim · B gọi sau A 0,2 s: allowed = 0 và được báo đợi bao lâu (slide 41)
docker exec advance-be-redis redis-cli BLPOP l06:barrier:bucket-lua 5
set -u
# B chậm hơn 0,2 s để lần nào chạy cũng cùng người được qua. Bỏ sleep thì người được qua đổi ngẫu nhiên,
# nhưng vẫn chỉ MỘT người.
sleep 0.2
MSYS_NO_PATHCONV=1 docker exec advance-be-redis redis-cli --eval /lab/lua/token-bucket.lua l06:tb:store:8 , 1 0.001
# #endregion
