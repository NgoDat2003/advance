# Bài 06 · Chặng 3 — Xóa khóa hết hạn: passive (khi có người đọc) và active (chu kỳ nền). Dán từng dòng vào Git Bash.
# Trước khi chạy: không còn khóa TTL nào khác trên main (đợi > 10 s sau region expire-dict), để số đếm expires đúng 1000 / 10000.

# #region passive · Tắt active expiry: khóa hết hạn vẫn nằm đó cho tới khi bị đọc (slide 19)
set -u
# DEBUG SET-ACTIVE-EXPIRE 0 tắt chu kỳ xóa nền (chỉ để học). Cuối region bật lại bằng ... 1.
docker exec advance-be-redis redis-cli DEBUG SET-ACTIVE-EXPIRE 0
seq 1 1000 | awk '{print "SET l06:exp:p:"$1" v PX 100"}' | docker exec -i advance-be-redis redis-cli > /dev/null
docker exec advance-be-redis redis-cli INFO stats | grep ^expired_keys
sleep 0.5
# Đã quá 100 ms nhưng expires vẫn = 1000: không ai xóa vì không ai đọc.
docker exec advance-be-redis redis-cli INFO keyspace | grep ^db0
# Đọc 1 khóa: Redis thấy nó hết hạn, xóa ngay, trả nil (dòng trống), expired_keys tăng đúng 1.
docker exec advance-be-redis redis-cli GET l06:exp:p:1
docker exec advance-be-redis redis-cli INFO stats | grep ^expired_keys
docker exec advance-be-redis redis-cli DEBUG SET-ACTIVE-EXPIRE 1
# #endregion

# #region active · 10000 khóa PX 1000, không ai đọc: chu kỳ nền tự dọn (slide 20, 21)
set -u
docker exec advance-be-redis redis-cli INFO stats | grep ^expired_keys
# --pipe đẩy 10000 lệnh trong vài chục ms, để khóa đầu chưa kịp hết hạn khi khóa cuối được ghi.
seq 1 10000 | awk '{print "SET l06:exp:a:"$1" v PX 1000"}' | docker exec -i advance-be-redis redis-cli --pipe
docker exec advance-be-redis redis-cli INFO keyspace | grep ^db0
sleep 3
# Chu kỳ nền 7.2 quét dần bảng expires bằng con trỏ (khoảng 20 khóa mỗi vòng, nối tiếp chỗ lần trước dừng),
# lặp khi > 10 % khóa vừa quét đã hết hạn, tối đa khoảng 25 % CPU.
# expired_stale_perc = trung bình trượt (mỗi chu kỳ nặng 5 %) tỉ lệ khóa hết hạn trong các lần quét gần đây: số trễ, không phải
# % khóa đang sót lúc này (dòng db0 bên dưới mới là thực tế). expire_cycle_cpu_milliseconds = CPU đã dùng cho chu kỳ.
docker exec advance-be-redis redis-cli INFO stats | grep -E '^(expired_keys|expired_stale_perc|expire_cycle_cpu_milliseconds):'
docker exec advance-be-redis redis-cli INFO keyspace | grep ^db0
docker exec advance-be-redis redis-cli MEMORY STATS
# #endregion
