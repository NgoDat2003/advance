# Bài 06 · Chặng 6 — Big key: DEL chặn luồng chính, UNLINK giải phóng ở luồng nền. Dán từng dòng vào Git Bash.
# Dựng 2 hash 1 triệu trường bằng seq | awk | redis-cli --pipe (mỗi dòng 1 lệnh HSET 1000 trường, 1000 dòng).
# Hai hash chiếm vài chục MB mỗi cái; region tự xóa chúng ở cuối.

# #region bigkey · Hash 1 triệu trường: DEL và UNLINK mất bao lâu trên luồng chính (slide 38)
set -u
docker exec advance-be-redis redis-cli UNLINK l06:big:h l06:big:h2 > /dev/null
seq 0 999 | awk '{f=""; for(i=1;i<=1000;i++) f=f" f"($1*1000+i)" v"; print "HSET l06:big:h"f}' | docker exec -i advance-be-redis redis-cli --pipe
seq 0 999 | awk '{f=""; for(i=1;i<=1000;i++) f=f" f"($1*1000+i)" v"; print "HSET l06:big:h2"f}' | docker exec -i advance-be-redis redis-cli --pipe
docker exec advance-be-redis redis-cli HLEN l06:big:h
docker exec advance-be-redis redis-cli MEMORY USAGE l06:big:h SAMPLES 0
# lazyfreed_objects = số đối tượng đã được luồng nền giải phóng (đọc trước để so).
docker exec advance-be-redis redis-cli INFO memory | grep ^lazyfreed_objects
# Ngưỡng SLOWLOG 0 µs: ghi MỌI lệnh, để thấy cả UNLINK rất nhanh. Đo xong trả 10000.
# Làm chặng này TRƯỚC khi bật replica (chặng 7): replica gửi REPLCONF ACK mỗi giây, ngưỡng 0 sẽ ghi cả lệnh đó và SLOWLOG GET 1 có thể ra REPLCONF.
docker exec advance-be-redis redis-cli CONFIG SET slowlog-log-slower-than 0
docker exec advance-be-redis redis-cli SLOWLOG RESET
docker exec advance-be-redis redis-cli DEL l06:big:h
docker exec advance-be-redis redis-cli SLOWLOG GET 1
docker exec advance-be-redis redis-cli SLOWLOG RESET
docker exec advance-be-redis redis-cli UNLINK l06:big:h2
docker exec advance-be-redis redis-cli SLOWLOG GET 1
docker exec advance-be-redis redis-cli CONFIG SET slowlog-log-slower-than 10000
docker exec advance-be-redis redis-cli INFO memory | grep ^lazyfreed_objects
# #endregion

# #region lazyfree · Tùy chọn. lazyfree-lazy-user-del yes: DEL tự chạy như UNLINK (slide 38)
set -u
seq 0 999 | awk '{f=""; for(i=1;i<=1000;i++) f=f" f"($1*1000+i)" v"; print "HSET l06:big:h3"f}' | docker exec -i advance-be-redis redis-cli --pipe
docker exec advance-be-redis redis-cli CONFIG SET lazyfree-lazy-user-del yes
docker exec advance-be-redis redis-cli CONFIG SET slowlog-log-slower-than 0
docker exec advance-be-redis redis-cli SLOWLOG RESET
docker exec advance-be-redis redis-cli DEL l06:big:h3
docker exec advance-be-redis redis-cli SLOWLOG GET 1
docker exec advance-be-redis redis-cli CONFIG SET slowlog-log-slower-than 10000
docker exec advance-be-redis redis-cli CONFIG SET lazyfree-lazy-user-del no
# #endregion

# #region bigkeys · redis-cli --bigkeys: quét bằng SCAN, in khóa lớn nhất của mỗi kiểu (slide 38)
set -u
# Chỉ in phần tóm tắt cuối (phần đầu là tiến trình quét, thứ tự phụ thuộc SCAN).
docker exec advance-be-redis redis-cli --bigkeys | sed -n '/summary/,$p'
# #endregion
