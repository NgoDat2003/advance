# Bài 06 · Chặng 1 — Đo bằng redis-benchmark (có sẵn trong container). Dán từng dòng vào Git Bash.
# Con số phụ thuộc máy: so TỈ LỆ giữa hai dòng, đừng so con số tuyệt đối với máy khác.

# #region threads · Đếm luồng của tiến trình redis-server (slide 14)
set -u
# /proc/1/task = các luồng của tiến trình số 1 trong container (redis-server).
docker exec advance-be-redis sh -c 'ls /proc/1/task | wc -l'
# Tên từng luồng: bio_* là luồng nền (đóng file, fsync AOF, lazy free), không phải I/O threads.
docker exec advance-be-redis sh -c 'cat /proc/1/task/*/comm'
docker exec advance-be-redis redis-cli CONFIG GET io-threads
# #endregion

# #region pipeline · Cùng 100000 lệnh GET: gửi từng lệnh (-P 1) và gửi lô 16 lệnh (-P 16) (slide 12)
set -u
docker exec advance-be-redis redis-benchmark -q -n 100000 -t get -P 1
docker exec advance-be-redis redis-benchmark -q -n 100000 -t get -P 16
# -t get chỉ ĐỌC khóa key:__rand_int__, không ghi gì: dòng dưới phải in ra rỗng.
docker exec advance-be-redis redis-cli --scan --pattern 'key:*'
# #endregion

# #region size · Giá trị 16 byte và 100 KB: băng thông mới là nút cổ chai (slide 12)
set -u
docker exec advance-be-redis redis-cli SET l06:bench:small 0123456789abcdef
# SETRANGE tại vị trí 102399 tạo chuỗi dài đúng 102400 byte (phần trước là byte 0). Đừng GET khóa này trong redis-cli.
docker exec advance-be-redis redis-cli SETRANGE l06:bench:big 102399 x
docker exec advance-be-redis redis-cli STRLEN l06:bench:big
docker exec advance-be-redis redis-benchmark -q -n 20000 GET l06:bench:small
docker exec advance-be-redis redis-benchmark -q -n 20000 GET l06:bench:big
# #endregion

# #region mget · Một client (-c 1): 10 lệnh GET hay 1 lệnh MGET 10 khóa (slide 41)
set -u
docker exec advance-be-redis redis-cli MSET l06:bench:1 v1 l06:bench:2 v2 l06:bench:3 v3 l06:bench:4 v4 l06:bench:5 v5 l06:bench:6 v6 l06:bench:7 v7 l06:bench:8 v8 l06:bench:9 v9 l06:bench:10 v10
docker exec advance-be-redis redis-benchmark -q -c 1 -n 20000 GET l06:bench:1
docker exec advance-be-redis redis-benchmark -q -c 1 -n 20000 MGET l06:bench:1 l06:bench:2 l06:bench:3 l06:bench:4 l06:bench:5 l06:bench:6 l06:bench:7 l06:bench:8 l06:bench:9 l06:bench:10
# #endregion
