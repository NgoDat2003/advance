# Bài 06 · Chặng 8 — Terminal A (Git Bash): trả khóa bằng Lua compare-and-delete, rồi fencing token (slide 40).
# Thứ tự mỗi kịch bản: (1) region *-reset ở A, (2) region cùng tên ở B (B đứng chờ), (3) region ở A. Dán từng dòng.
# Script Lua chạy từ file lua/*.lua trong container (mount /lab chỉ đọc).

# #region cad-reset · Chuẩn bị: chưa ai giữ khóa (slide 40)
set -u
docker exec advance-be-redis redis-cli UNLINK l06:lock:FA634:A34_S012C l06:barrier:lock-cad
# #endregion

# #region cad · Cùng nhịp với ttldel, nhưng A trả khóa bằng lock-release.lua: khóa của B còn nguyên (slide 40)
docker exec advance-be-redis redis-cli RPUSH l06:barrier:lock-cad go
set -u
docker exec advance-be-redis redis-cli SET l06:lock:FA634:A34_S012C tokA NX PX 2000
# A làm việc 3,5 s, lâu hơn TTL 2 s.
sleep 3.5
# Khóa giờ là của B (tokB) nên script trả 0 và không xóa.
MSYS_NO_PATHCONV=1 docker exec advance-be-redis redis-cli --eval /lab/lua/lock-release.lua l06:lock:FA634:A34_S012C , tokA
docker exec advance-be-redis redis-cli GET l06:lock:FA634:A34_S012C
# #endregion

# #region fencing-reset · Chuẩn bị: chưa ai giữ khóa, bộ đếm token và bản ghi ghế rỗng (slide 40)
set -u
docker exec advance-be-redis redis-cli UNLINK l06:lock:FA634:A34_S012C l06:fence:A34_S012C l06:seat:FA634:A34_S012C:row l06:barrier:lock-fencing
# #endregion

# #region fencing · A bị "GC pause" 4 s, khóa hết hạn, B ghi với token 2; A ghi muộn với token 1 bị từ chối (slide 40)
docker exec advance-be-redis redis-cli RPUSH l06:barrier:lock-fencing go
set -u
# Lấy khóa VÀ nhận fencing token trong MỘT script (SET NX PX, thành công thì INCR bộ đếm). A nhận token 1.
MSYS_NO_PATHCONV=1 docker exec advance-be-redis redis-cli --eval /lab/lua/lock-acquire-fenced.lua l06:lock:FA634:A34_S012C l06:fence:A34_S012C , tokA 2000
sleep 4
# A tỉnh dậy, tưởng mình còn giữ khóa, ghi với token 1 (gõ đúng số script vừa trả).
MSYS_NO_PATHCONV=1 docker exec advance-be-redis redis-cli --eval /lab/lua/fenced-write.lua l06:seat:FA634:A34_S012C:row , 1 A
docker exec advance-be-redis redis-cli HGETALL l06:seat:FA634:A34_S012C:row
# #endregion
