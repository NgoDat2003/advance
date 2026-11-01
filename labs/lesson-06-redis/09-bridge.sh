# Bài 06 · Chặng 9 — Cầu sang OmniPOS M2: token bucket bằng Lua và Idempotency-Key. Dán từng dòng vào Git Bash.
# Script Lua chạy từ file lua/*.lua trong container (mount /lab chỉ đọc).

# #region bucket30 · 30 request liên tiếp vào bucket sức chứa 10, nạp 0,01 token/giây (slide 41)
set -u
docker exec advance-be-redis redis-cli UNLINK l06:tb:store:7 > /dev/null
# Vòng lặp chạy TRONG container (sh -c '…'), mỗi dòng in "allowed tokens retry_after_ms"; awk đếm và in dòng tổng.
docker exec advance-be-redis sh -c 'for i in $(seq 30); do redis-cli --eval /lab/lua/token-bucket.lua l06:tb:store:7 , 10 0.01 | paste -sd" " -; done' | awk '{print} $1==1{a++} $1==0{d++; if (r=="" || $3<r) r=$3} END{print "allowed="a+0" denied="d+0" min_retry_after_ms="r+0}'
# #endregion

# #region idempotency · Cùng Idempotency-Key gửi 4 lần: NEW, IN_PROGRESS, DONE + response cũ, MISMATCH (slide 41)
set -u
docker exec advance-be-redis redis-cli UNLINK l06:idem:pay-001 > /dev/null
# 3f2a9c1e = 8 ký tự đầu sha256 của body request; 86400 = giữ key 1 ngày.
MSYS_NO_PATHCONV=1 docker exec advance-be-redis redis-cli --eval /lab/lua/idempotency-begin.lua l06:idem:pay-001 , 3f2a9c1e 86400
MSYS_NO_PATHCONV=1 docker exec advance-be-redis redis-cli --eval /lab/lua/idempotency-begin.lua l06:idem:pay-001 , 3f2a9c1e 86400
# App xử lý xong: lưu response và đánh dấu DONE.
docker exec advance-be-redis redis-cli HSET l06:idem:pay-001 status DONE resp '{"orderId":"o1","total":120000}'
MSYS_NO_PATHCONV=1 docker exec advance-be-redis redis-cli --eval /lab/lua/idempotency-begin.lua l06:idem:pay-001 , 3f2a9c1e 86400
# Cùng key, body khác (hash khác).
MSYS_NO_PATHCONV=1 docker exec advance-be-redis redis-cli --eval /lab/lua/idempotency-begin.lua l06:idem:pay-001 , 9b7d00aa 86400
docker exec advance-be-redis redis-cli TTL l06:idem:pay-001
# #endregion
