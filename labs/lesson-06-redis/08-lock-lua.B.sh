# Bài 06 · Chặng 8 — Terminal B (Git Bash): request thứ hai (slide 40). Dán ở B TRƯỚC khi dán ở A.

# #region cad · B lấy khóa sau khi khóa A hết hạn, rồi tự trả đúng khóa của mình (slide 40)
docker exec advance-be-redis redis-cli BLPOP l06:barrier:lock-cad 5
set -u
sleep 2.8
docker exec advance-be-redis redis-cli SET l06:lock:FA634:A34_S012C tokB NX PX 5000
sleep 2
# Trả khóa của chính B → 1.
MSYS_NO_PATHCONV=1 docker exec advance-be-redis redis-cli --eval /lab/lua/lock-release.lua l06:lock:FA634:A34_S012C , tokB
# #endregion

# #region fencing · B lấy khóa lúc 2,8 s, nhận token 2 và ghi trước A (slide 40)
docker exec advance-be-redis redis-cli BLPOP l06:barrier:lock-fencing 5
set -u
sleep 2.8
# Cùng script lấy khóa + cấp token như A: B nhận token 2.
MSYS_NO_PATHCONV=1 docker exec advance-be-redis redis-cli --eval /lab/lua/lock-acquire-fenced.lua l06:lock:FA634:A34_S012C l06:fence:A34_S012C , tokB 5000
MSYS_NO_PATHCONV=1 docker exec advance-be-redis redis-cli --eval /lab/lua/fenced-write.lua l06:seat:FA634:A34_S012C:row , 2 B
MSYS_NO_PATHCONV=1 docker exec advance-be-redis redis-cli --eval /lab/lua/lock-release.lua l06:lock:FA634:A34_S012C , tokB
# #endregion
