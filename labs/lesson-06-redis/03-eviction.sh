# Bài 06 · Chặng 3 — Đầy bộ nhớ thì sao: 5 chính sách eviction trên container RIÊNG advance-be-redis-evict.
# Bật container trước: bash labs/lesson-06-redis/00-containers.sh up evict   (không đụng main).
# Mỗi region ~35 s. Các bước giống nhau, chỉ khác chính sách:
#   1) xóa sạch container evict + đặt lại bộ đếm (CONFIG RESETSTAT), 2) MAX = bộ nhớ đang dùng + 2 MB, 3) 300 khóa "hot" 1 KB, đợi 2 s,
#   4) 600 khóa "cold" 1 KB (vẫn dưới MAX, chưa evict), 5) đọc hot 10 vòng, mỗi vòng cách 2 s,
#   6) ghi tràn 1500 khóa 1 KB, 7) đếm khóa còn sống, 8) trả cấu hình về mặc định.
# awk 'BEGIN{v=sprintf("%01024d",0)} …' tạo sẵn chuỗi 1024 chữ số 0 làm giá trị 1 KB.

# #region noeviction · Mặc định noeviction: hết chỗ thì từ chối ghi, đọc vẫn được (slide 23)
echo "→ advance-be-redis-evict"
set -u
docker exec advance-be-redis-evict redis-cli FLUSHALL
# RESETSTAT đưa evicted_keys về 0 (FLUSHALL không xóa bộ đếm thống kê).
docker exec advance-be-redis-evict redis-cli CONFIG RESETSTAT
docker exec advance-be-redis-evict redis-cli CONFIG SET maxmemory 0
# Đọc chính sách mặc định trước khi đổi gì.
docker exec advance-be-redis-evict redis-cli CONFIG GET maxmemory-policy
docker exec advance-be-redis-evict redis-cli CONFIG SET maxmemory-policy noeviction
BASE=$(docker exec advance-be-redis-evict redis-cli INFO memory | tr -d '\r' | sed -n 's/^used_memory://p'); MAX=$((BASE + 2097152)); echo "BASE=$BASE MAX=$MAX"
docker exec advance-be-redis-evict redis-cli CONFIG SET maxmemory "$MAX"
seq 1 300 | awk 'BEGIN{v=sprintf("%01024d",0)} {print "SET l06:ev:hot:"$1" "v}' | docker exec -i advance-be-redis-evict redis-cli > /dev/null
sleep 2
seq 1 600 | awk 'BEGIN{v=sprintf("%01024d",0)} {print "SET l06:ev:cold:"$1" "v}' | docker exec -i advance-be-redis-evict redis-cli > /dev/null
EV=$(docker exec advance-be-redis-evict redis-cli INFO stats | tr -d '\r' | sed -n 's/^evicted_keys://p'); echo "evicted_keys:$EV"; [ "$EV" = 0 ] || echo "LỖI: đợt ghi cold đã bị evict, giảm số khóa cold"
sleep 2
for r in $(seq 10); do seq 1 300 | awk '{print "GET l06:ev:hot:"$1}' | docker exec -i advance-be-redis-evict redis-cli > /dev/null; sleep 2; done
# Ghi tràn: sort -u gom 1500 câu trả lời thành vài dòng khác nhau (OK và lỗi OOM).
seq 1 1500 | awk 'BEGIN{v=sprintf("%01024d",0)} {print "SET l06:ev:over:"$1" "v}' | docker exec -i advance-be-redis-evict redis-cli | sort -u
echo "hot=$(docker exec advance-be-redis-evict redis-cli --scan --pattern 'l06:ev:hot:*' | wc -l)/300 cold=$(docker exec advance-be-redis-evict redis-cli --scan --pattern 'l06:ev:cold:*' | wc -l)/600"; docker exec advance-be-redis-evict redis-cli INFO stats | grep ^evicted_keys
# Đọc vẫn chạy bình thường khi đầy (in ra 1024 chữ số 0).
docker exec advance-be-redis-evict redis-cli GET l06:ev:hot:1
docker exec advance-be-redis-evict redis-cli CONFIG SET maxmemory 0
docker exec advance-be-redis-evict redis-cli CONFIG SET maxmemory-policy noeviction
# #endregion

# #region allkeys-lru · allkeys-lru: bỏ khóa lâu không ai dùng nhất (xấp xỉ, lấy mẫu) (slide 23)
echo "→ advance-be-redis-evict"
set -u
docker exec advance-be-redis-evict redis-cli FLUSHALL
# RESETSTAT đưa evicted_keys về 0 (FLUSHALL không xóa bộ đếm thống kê).
docker exec advance-be-redis-evict redis-cli CONFIG RESETSTAT
docker exec advance-be-redis-evict redis-cli CONFIG SET maxmemory 0
docker exec advance-be-redis-evict redis-cli CONFIG SET maxmemory-policy allkeys-lru
BASE=$(docker exec advance-be-redis-evict redis-cli INFO memory | tr -d '\r' | sed -n 's/^used_memory://p'); MAX=$((BASE + 2097152)); echo "BASE=$BASE MAX=$MAX"
docker exec advance-be-redis-evict redis-cli CONFIG SET maxmemory "$MAX"
seq 1 300 | awk 'BEGIN{v=sprintf("%01024d",0)} {print "SET l06:ev:hot:"$1" "v}' | docker exec -i advance-be-redis-evict redis-cli > /dev/null
sleep 2
seq 1 600 | awk 'BEGIN{v=sprintf("%01024d",0)} {print "SET l06:ev:cold:"$1" "v}' | docker exec -i advance-be-redis-evict redis-cli > /dev/null
EV=$(docker exec advance-be-redis-evict redis-cli INFO stats | tr -d '\r' | sed -n 's/^evicted_keys://p'); echo "evicted_keys:$EV"; [ "$EV" = 0 ] || echo "LỖI: đợt ghi cold đã bị evict, giảm số khóa cold"
sleep 2
for r in $(seq 10); do seq 1 300 | awk '{print "GET l06:ev:hot:"$1}' | docker exec -i advance-be-redis-evict redis-cli > /dev/null; sleep 2; done
seq 1 1500 | awk 'BEGIN{v=sprintf("%01024d",0)} {print "SET l06:ev:over:"$1" "v}' | docker exec -i advance-be-redis-evict redis-cli | sort -u
echo "hot=$(docker exec advance-be-redis-evict redis-cli --scan --pattern 'l06:ev:hot:*' | wc -l)/300 cold=$(docker exec advance-be-redis-evict redis-cli --scan --pattern 'l06:ev:cold:*' | wc -l)/600"; docker exec advance-be-redis-evict redis-cli INFO stats | grep ^evicted_keys
docker exec advance-be-redis-evict redis-cli CONFIG SET maxmemory 0
docker exec advance-be-redis-evict redis-cli CONFIG SET maxmemory-policy noeviction
# #endregion

# #region allkeys-lfu · allkeys-lfu: bỏ khóa ít được dùng nhất (đếm tần suất) (slide 23)
echo "→ advance-be-redis-evict"
set -u
docker exec advance-be-redis-evict redis-cli FLUSHALL
# RESETSTAT đưa evicted_keys về 0 (FLUSHALL không xóa bộ đếm thống kê).
docker exec advance-be-redis-evict redis-cli CONFIG RESETSTAT
docker exec advance-be-redis-evict redis-cli CONFIG SET maxmemory 0
docker exec advance-be-redis-evict redis-cli CONFIG SET maxmemory-policy allkeys-lfu
BASE=$(docker exec advance-be-redis-evict redis-cli INFO memory | tr -d '\r' | sed -n 's/^used_memory://p'); MAX=$((BASE + 2097152)); echo "BASE=$BASE MAX=$MAX"
docker exec advance-be-redis-evict redis-cli CONFIG SET maxmemory "$MAX"
seq 1 300 | awk 'BEGIN{v=sprintf("%01024d",0)} {print "SET l06:ev:hot:"$1" "v}' | docker exec -i advance-be-redis-evict redis-cli > /dev/null
sleep 2
seq 1 600 | awk 'BEGIN{v=sprintf("%01024d",0)} {print "SET l06:ev:cold:"$1" "v}' | docker exec -i advance-be-redis-evict redis-cli > /dev/null
EV=$(docker exec advance-be-redis-evict redis-cli INFO stats | tr -d '\r' | sed -n 's/^evicted_keys://p'); echo "evicted_keys:$EV"; [ "$EV" = 0 ] || echo "LỖI: đợt ghi cold đã bị evict, giảm số khóa cold"
sleep 2
for r in $(seq 10); do seq 1 300 | awk '{print "GET l06:ev:hot:"$1}' | docker exec -i advance-be-redis-evict redis-cli > /dev/null; sleep 2; done
seq 1 1500 | awk 'BEGIN{v=sprintf("%01024d",0)} {print "SET l06:ev:over:"$1" "v}' | docker exec -i advance-be-redis-evict redis-cli | sort -u
echo "hot=$(docker exec advance-be-redis-evict redis-cli --scan --pattern 'l06:ev:hot:*' | wc -l)/300 cold=$(docker exec advance-be-redis-evict redis-cli --scan --pattern 'l06:ev:cold:*' | wc -l)/600"; docker exec advance-be-redis-evict redis-cli INFO stats | grep ^evicted_keys
docker exec advance-be-redis-evict redis-cli CONFIG SET maxmemory 0
docker exec advance-be-redis-evict redis-cli CONFIG SET maxmemory-policy noeviction
# #endregion

# #region volatile-ttl · Tùy chọn. volatile-ttl: chỉ bỏ khóa CÓ TTL, TTL ngắn trước; hết khóa TTL thì OOM (slide 23)
echo "→ advance-be-redis-evict"
set -u
docker exec advance-be-redis-evict redis-cli FLUSHALL
# RESETSTAT đưa evicted_keys về 0 (FLUSHALL không xóa bộ đếm thống kê).
docker exec advance-be-redis-evict redis-cli CONFIG RESETSTAT
docker exec advance-be-redis-evict redis-cli CONFIG SET maxmemory 0
docker exec advance-be-redis-evict redis-cli CONFIG SET maxmemory-policy volatile-ttl
BASE=$(docker exec advance-be-redis-evict redis-cli INFO memory | tr -d '\r' | sed -n 's/^used_memory://p'); MAX=$((BASE + 2097152)); echo "BASE=$BASE MAX=$MAX"
docker exec advance-be-redis-evict redis-cli CONFIG SET maxmemory "$MAX"
seq 1 300 | awk 'BEGIN{v=sprintf("%01024d",0)} {print "SET l06:ev:hot:"$1" "v}' | docker exec -i advance-be-redis-evict redis-cli > /dev/null
sleep 2
seq 1 600 | awk 'BEGIN{v=sprintf("%01024d",0)} {print "SET l06:ev:cold:"$1" "v}' | docker exec -i advance-be-redis-evict redis-cli > /dev/null
# 200 khóa có TTL từ 62 s đến 460 s (khóa số nhỏ hết hạn sớm hơn).
seq 1 200 | awk 'BEGIN{v=sprintf("%01024d",0)} {print "SET l06:ev:ttl:"$1" "v" EX "(60+$1*2)}' | docker exec -i advance-be-redis-evict redis-cli > /dev/null
EV=$(docker exec advance-be-redis-evict redis-cli INFO stats | tr -d '\r' | sed -n 's/^evicted_keys://p'); echo "evicted_keys:$EV"; [ "$EV" = 0 ] || echo "LỖI: đợt ghi cold đã bị evict, giảm số khóa cold"
sleep 2
for r in $(seq 10); do seq 1 300 | awk '{print "GET l06:ev:hot:"$1}' | docker exec -i advance-be-redis-evict redis-cli > /dev/null; sleep 2; done
seq 1 1500 | awk 'BEGIN{v=sprintf("%01024d",0)} {print "SET l06:ev:over:"$1" "v}' | docker exec -i advance-be-redis-evict redis-cli | sort -u
echo "hot=$(docker exec advance-be-redis-evict redis-cli --scan --pattern 'l06:ev:hot:*' | wc -l)/300 cold=$(docker exec advance-be-redis-evict redis-cli --scan --pattern 'l06:ev:cold:*' | wc -l)/600 ttl=$(docker exec advance-be-redis-evict redis-cli --scan --pattern 'l06:ev:ttl:*' | wc -l)/200"; docker exec advance-be-redis-evict redis-cli INFO stats | grep ^evicted_keys
docker exec advance-be-redis-evict redis-cli CONFIG SET maxmemory 0
docker exec advance-be-redis-evict redis-cli CONFIG SET maxmemory-policy noeviction
# #endregion

# #region allkeys-random · Tùy chọn. allkeys-random: bỏ ngẫu nhiên, không quan tâm hot hay cold (slide 23)
echo "→ advance-be-redis-evict"
set -u
docker exec advance-be-redis-evict redis-cli FLUSHALL
# RESETSTAT đưa evicted_keys về 0 (FLUSHALL không xóa bộ đếm thống kê).
docker exec advance-be-redis-evict redis-cli CONFIG RESETSTAT
docker exec advance-be-redis-evict redis-cli CONFIG SET maxmemory 0
docker exec advance-be-redis-evict redis-cli CONFIG SET maxmemory-policy allkeys-random
BASE=$(docker exec advance-be-redis-evict redis-cli INFO memory | tr -d '\r' | sed -n 's/^used_memory://p'); MAX=$((BASE + 2097152)); echo "BASE=$BASE MAX=$MAX"
docker exec advance-be-redis-evict redis-cli CONFIG SET maxmemory "$MAX"
seq 1 300 | awk 'BEGIN{v=sprintf("%01024d",0)} {print "SET l06:ev:hot:"$1" "v}' | docker exec -i advance-be-redis-evict redis-cli > /dev/null
sleep 2
seq 1 600 | awk 'BEGIN{v=sprintf("%01024d",0)} {print "SET l06:ev:cold:"$1" "v}' | docker exec -i advance-be-redis-evict redis-cli > /dev/null
EV=$(docker exec advance-be-redis-evict redis-cli INFO stats | tr -d '\r' | sed -n 's/^evicted_keys://p'); echo "evicted_keys:$EV"; [ "$EV" = 0 ] || echo "LỖI: đợt ghi cold đã bị evict, giảm số khóa cold"
sleep 2
for r in $(seq 10); do seq 1 300 | awk '{print "GET l06:ev:hot:"$1}' | docker exec -i advance-be-redis-evict redis-cli > /dev/null; sleep 2; done
seq 1 1500 | awk 'BEGIN{v=sprintf("%01024d",0)} {print "SET l06:ev:over:"$1" "v}' | docker exec -i advance-be-redis-evict redis-cli | sort -u
echo "hot=$(docker exec advance-be-redis-evict redis-cli --scan --pattern 'l06:ev:hot:*' | wc -l)/300 cold=$(docker exec advance-be-redis-evict redis-cli --scan --pattern 'l06:ev:cold:*' | wc -l)/600"; docker exec advance-be-redis-evict redis-cli INFO stats | grep ^evicted_keys
docker exec advance-be-redis-evict redis-cli CONFIG SET maxmemory 0
docker exec advance-be-redis-evict redis-cli CONFIG SET maxmemory-policy noeviction
# #endregion
