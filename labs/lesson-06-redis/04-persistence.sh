# Bài 06 · Chặng 4 — RDB, AOF, hybrid: kill tiến trình rồi xem còn bao nhiêu khóa. Dán từng dòng vào Git Bash.
# Chạy trên 2 container RIÊNG (không đụng main): bash labs/lesson-06-redis/00-containers.sh up persist
#   advance-be-redis-rdb: --appendonly no --save ""   (chỉ có snapshot khi ta gọi BGSAVE/SAVE)
#   advance-be-redis-aof: --appendonly yes --appendfsync everysec --save ""
# docker kill = SIGKILL: Redis chết ngay, không kịp lưu gì thêm. /data (volume ẩn danh) vẫn còn khi docker start lại.

# #region rdb-loss · RDB: dữ liệu ghi SAU lần snapshot cuối mất khi tiến trình chết (slide 26)
echo "→ advance-be-redis-rdb"
set -u
docker exec advance-be-redis-rdb redis-cli FLUSHALL
# Xóa dump cũ để lần khởi động sau chắc chắn chỉ đọc snapshot của region này.
MSYS_NO_PATHCONV=1 docker exec advance-be-redis-rdb rm -f /data/dump.rdb
docker exec advance-be-redis-rdb redis-cli CONFIG SET save ""
seq 1 1000 | awk '{print "SET l06:p:"$1" v"$1}' | docker exec -i advance-be-redis-rdb redis-cli > /dev/null
# BGSAVE: tiến trình con (fork) ghi snapshot, tiến trình chính vẫn phục vụ lệnh.
docker exec advance-be-redis-rdb redis-cli BGSAVE
for i in $(seq 100); do docker exec advance-be-redis-rdb redis-cli INFO persistence | grep -q '^rdb_bgsave_in_progress:0' && break; sleep 0.2; done
docker exec advance-be-redis-rdb redis-cli INFO persistence | grep -E '^(rdb_bgsave_in_progress|rdb_last_bgsave_status|rdb_last_save_time):'
# latest_fork_usec (INFO stats) = thời gian fork của lần BGSAVE vừa rồi, tính bằng µs.
docker exec advance-be-redis-rdb redis-cli INFO stats | grep ^latest_fork_usec
# 500 khóa ghi SAU snapshot.
seq 1001 1500 | awk '{print "SET l06:p:"$1" v"$1}' | docker exec -i advance-be-redis-rdb redis-cli > /dev/null
docker exec advance-be-redis-rdb redis-cli DBSIZE
docker kill advance-be-redis-rdb
docker start advance-be-redis-rdb
for i in $(seq 50); do docker exec advance-be-redis-rdb redis-cli PING 2>/dev/null | grep -q PONG && break; sleep 0.2; done
docker exec advance-be-redis-rdb redis-cli DBSIZE
# SAVE chạy ngay trên luồng chính (chặn mọi client). Ngưỡng SLOWLOG 0 để thấy nó mất bao nhiêu µs, đo xong trả 10000.
docker exec advance-be-redis-rdb redis-cli CONFIG SET slowlog-log-slower-than 0
docker exec advance-be-redis-rdb redis-cli SLOWLOG RESET
docker exec advance-be-redis-rdb redis-cli SAVE
docker exec advance-be-redis-rdb redis-cli SLOWLOG GET 1
docker exec advance-be-redis-rdb redis-cli CONFIG SET slowlog-log-slower-than 10000
# Trả save về giá trị lúc khởi động của container (--save "").
docker exec advance-be-redis-rdb redis-cli CONFIG SET save ""
# #endregion

# #region aof-loss · AOF everysec: kill tiến trình sau 2 s không mất khóa nào (slide 25)
echo "→ advance-be-redis-aof"
set -u
docker exec advance-be-redis-aof redis-cli FLUSHALL
docker exec advance-be-redis-aof redis-cli CONFIG GET appendonly
docker exec advance-be-redis-aof redis-cli CONFIG GET appendfsync
seq 1 1500 | awk '{print "SET l06:p:"$1" v"$1}' | docker exec -i advance-be-redis-aof redis-cli > /dev/null
# Không cần đợi fsync: thường thì write() đã đưa lệnh vào page cache của hệ điều hành trước khi redis-cli nhận OK, và kill
# tiến trình không xóa page cache (ngoại lệ khi fsync nền chậm: xem chặng 4). Đợi 2 s chỉ để chắc lệnh cuối của pipe đã ghi xong.
sleep 2
docker kill advance-be-redis-aof
docker start advance-be-redis-aof
for i in $(seq 50); do docker exec advance-be-redis-aof redis-cli PING 2>/dev/null | grep -q PONG && break; sleep 0.2; done
docker exec advance-be-redis-aof redis-cli DBSIZE
# #endregion

# #region hybrid · Hybrid: file nền của AOF là RDB (preamble); tắt preamble thì file nền là lệnh RESP (slide 27)
echo "→ advance-be-redis-aof"
set -u
seq 1 100 | awk '{print "SET l06:p:"$1" v"$1}' | docker exec -i advance-be-redis-aof redis-cli > /dev/null
docker exec advance-be-redis-aof redis-cli CONFIG GET aof-use-rdb-preamble
docker exec advance-be-redis-aof redis-cli BGREWRITEAOF
for i in $(seq 100); do docker exec advance-be-redis-aof redis-cli INFO persistence | grep -q '^aof_rewrite_in_progress:0' && break; sleep 0.2; done
# sed thay số thế hệ (appendonly.aof.3.base.rdb → .N.) cho dễ so giữa các lần chạy.
MSYS_NO_PATHCONV=1 docker exec advance-be-redis-aof ls /data/appendonlydir | sed 's/\.[0-9][0-9]*\./.N./'
# 5 byte đầu của file nền: "REDIS" = định dạng RDB.
docker exec advance-be-redis-aof sh -c 'head -c 5 /data/appendonlydir/*.base.rdb; echo'
docker exec advance-be-redis-aof redis-cli CONFIG SET aof-use-rdb-preamble no
docker exec advance-be-redis-aof redis-cli BGREWRITEAOF
for i in $(seq 100); do docker exec advance-be-redis-aof redis-cli INFO persistence | grep -q '^aof_rewrite_in_progress:0' && break; sleep 0.2; done
MSYS_NO_PATHCONV=1 docker exec advance-be-redis-aof ls /data/appendonlydir | sed 's/\.[0-9][0-9]*\./.N./'
# tr đổi \r\n thành khoảng trắng. "*2  $" = mở đầu một lệnh RESP (mảng 2 phần tử, ví dụ SELECT 0): file nền giờ là lệnh, không phải RDB.
docker exec advance-be-redis-aof sh -c 'head -c 5 /data/appendonlydir/*.base.aof | tr "\r\n" "  "; echo'
docker exec advance-be-redis-aof redis-cli CONFIG SET aof-use-rdb-preamble yes
# #endregion

# #region kiem-chung · Kiểm chứng chặng 4 (slide 25, 26, 27)
set -u
docker exec advance-be-redis-rdb redis-cli DBSIZE
docker exec advance-be-redis-aof redis-cli DBSIZE
docker exec advance-be-redis-aof redis-cli CONFIG GET aof-use-rdb-preamble
docker exec advance-be-redis redis-cli CONFIG GET appendonly
docker exec advance-be-redis redis-cli CONFIG GET save
# #endregion
