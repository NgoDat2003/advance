# Bài 06 · Chặng 9 — Terminal A (Git Bash): cùng bài toán 1 token, nhưng gọi token-bucket.lua (slide 41).
# Thứ tự: (1) claim-reset ở A, (2) claim ở B (B đứng chờ), (3) claim ở A. Dán từng dòng.

# #region claim-reset · Chuẩn bị: xóa bucket (bucket mới tạo = đầy = 1 token với sức chứa 1) (slide 41)
set -u
docker exec advance-be-redis redis-cli UNLINK l06:tb:store:8 l06:barrier:bucket-lua
# #endregion

# #region claim · A gọi token-bucket.lua (sức chứa 1, nạp 0,001 token/giây) (slide 41)
docker exec advance-be-redis redis-cli RPUSH l06:barrier:bucket-lua go
set -u
# Ba dòng trả về: allowed (1 = cho qua), số token còn, retry_after_ms.
MSYS_NO_PATHCONV=1 docker exec advance-be-redis redis-cli --eval /lab/lua/token-bucket.lua l06:tb:store:8 , 1 0.001
# #endregion
