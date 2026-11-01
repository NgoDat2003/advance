# Bài 06 · Chặng 7 — Master–replica: sao chép bất đồng bộ, đọc dữ liệu cũ khi mất mạng, failover tay. Dán từng dòng vào Git Bash.
# Bật trước: bash labs/lesson-06-redis/00-containers.sh up replica   (replica nằm cùng network advance-be-l06 với main)
# Lệnh phá hủy (ngắt mạng, restart, REPLICAOF) chỉ nhắm advance-be-redis-replica. Main không bao giờ nhận REPLICAOF.

# #region replica · Ghi trên main, đọc trên replica, offset hai bên bằng nhau (slide 6)
echo "→ advance-be-redis-replica"
set -u
# WAIT chỉ chờ các lệnh ghi CỦA CHÍNH KẾT NỐI gọi nó, nên SET và WAIT phải đi chung một redis-cli:
# printf đẩy 2 lệnh vào cùng một kết nối. WAIT 1 1000 = chờ tối đa 1000 ms tới khi 1 replica xác nhận.
printf 'SET l06:rep:price 100\nWAIT 1 1000\n' | docker exec -i advance-be-redis redis-cli
docker exec advance-be-redis-replica redis-cli GET l06:rep:price
docker exec advance-be-redis redis-cli INFO replication | grep -E '^(role|master_repl_offset):'
docker exec advance-be-redis-replica redis-cli INFO replication | grep -E '^(role|master_link_status|slave_repl_offset):'
# #endregion

# #region partition · Ngắt mạng replica: main vẫn nhận ghi, replica trả giá trị cũ (slide 7)
echo "→ advance-be-redis-replica"
set -u
printf 'SET l06:rep:price 100\nWAIT 1 1000\n' | docker exec -i advance-be-redis redis-cli
docker exec advance-be-redis-replica redis-cli GET l06:rep:price
docker network disconnect advance-be-l06 advance-be-redis-replica
# SET vẫn OK trên main, nhưng không replica nào xác nhận trong 500 ms → WAIT trả 0 (sao chép bất đồng bộ).
printf 'SET l06:rep:price 120\nWAIT 1 500\n' | docker exec -i advance-be-redis redis-cli
# Bẫy: WAIT ở một kết nối MỚI (chưa ghi gì) không chờ gì cả, trả ngay số replica master còn tưởng đang nối → 1.
docker exec advance-be-redis redis-cli WAIT 1 500
# Đọc trên replica lúc này = dữ liệu cũ (stale read).
docker exec advance-be-redis-replica redis-cli GET l06:rep:price
docker network connect advance-be-l06 advance-be-redis-replica
# repl-timeout mặc định 60 s: replica chưa tự biết kết nối cũ đã chết, nên restart để nó nối lại ngay.
docker restart advance-be-redis-replica
for i in $(seq 40); do docker exec advance-be-redis-replica redis-cli INFO replication 2>/dev/null | grep -q '^master_link_status:up' && break; sleep 0.5; done; echo "polls=$i"
docker exec advance-be-redis-replica redis-cli INFO replication | grep ^master_link_status
docker exec advance-be-redis-replica redis-cli GET l06:rep:price
docker exec advance-be-redis redis-cli INFO replication | grep ^master_repl_offset
docker exec advance-be-redis-replica redis-cli INFO replication | grep ^slave_repl_offset
# sync_full = số lần đồng bộ toàn phần, sync_partial_ok = số lần nối lại chỉ gửi phần thiếu (chỉ ghi nhận, tùy tình huống).
docker exec advance-be-redis redis-cli INFO stats | grep -E '^(sync_full|sync_partial_ok):'
# #endregion

# #region failover · Tùy chọn. Nâng replica thành master bằng tay rồi trả về: ghi riêng trên nó bị mất (slide 8)
echo "→ advance-be-redis-replica"
set -u
printf 'SET l06:rep:main-write before\nWAIT 1 1000\n' | docker exec -i advance-be-redis redis-cli
docker exec advance-be-redis-replica redis-cli REPLICAOF NO ONE
docker exec advance-be-redis-replica redis-cli INFO replication | grep ^role
# Hai "master" cùng nhận ghi: đây là lý do Sentinel/Cluster phải bầu chọn và rào node cũ.
docker exec advance-be-redis-replica redis-cli SET l06:rep:replica-only x
docker exec advance-be-redis redis-cli SET l06:rep:main-write after
docker exec advance-be-redis-replica redis-cli REPLICAOF advance-be-redis 6379
for i in $(seq 40); do docker exec advance-be-redis-replica redis-cli INFO replication 2>/dev/null | grep -q '^master_link_status:up' && break; sleep 0.5; done; echo "polls=$i"
docker exec advance-be-redis-replica redis-cli INFO replication | grep -E '^(role|master_link_status):'
# Đồng bộ lại từ main: khóa chỉ ghi trên replica biến mất (dòng trống = nil).
docker exec advance-be-redis-replica redis-cli GET l06:rep:replica-only
docker exec advance-be-redis-replica redis-cli GET l06:rep:main-write
# #endregion

# #region kiem-chung · Kiểm chứng chặng 7 (slide 6, 7, 8, 9, 39)
set -u
docker exec advance-be-redis-replica redis-cli INFO replication | grep -E '^(role|master_link_status):'
docker exec advance-be-redis-replica redis-cli GET l06:rep:price
docker exec advance-be-redis-replica redis-cli EXISTS l06:rep:replica-only
docker exec advance-be-redis-cluster redis-cli CLUSTER INFO | grep -E '^(cluster_state|cluster_slots_assigned):'
docker exec advance-be-redis-cluster redis-cli CLUSTER KEYSLOT 'l06:user_profile:{34}'
docker exec advance-be-redis-cluster redis-cli CLUSTER KEYSLOT 'l06:user_session:{34}'
# #endregion
