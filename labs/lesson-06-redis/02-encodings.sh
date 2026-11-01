# Bài 06 · Chặng 2 — Ngưỡng đổi encoding, dựng bằng lệnh thường (seq | awk | redis-cli). Dán từng dòng vào Git Bash.
# Mỗi dòng "seq … | awk …" in ra N lệnh Redis bình thường, rồi đẩy hết vào MỘT redis-cli (> /dev/null để khỏi in N chữ OK).
# Ngưỡng mặc định Redis 7.2: hash-max-listpack-entries 512, hash-max-listpack-value 64,
# set-max-intset-entries 512, set-max-listpack-entries 128, zset-max-listpack-entries 128, list-max-listpack-size -2 (8 KB).

# #region hash · Hash: 512 trường → listpack, 513 → hashtable; giá trị 64 byte → listpack, 65 → hashtable (slide 16, 33)
set -u
docker exec advance-be-redis redis-cli UNLINK l06:enc:h l06:enc:hv > /dev/null
seq 1 512 | awk '{print "HSET l06:enc:h f"$1" v"$1}' | docker exec -i advance-be-redis redis-cli > /dev/null
docker exec advance-be-redis redis-cli HLEN l06:enc:h
docker exec advance-be-redis redis-cli OBJECT ENCODING l06:enc:h
docker exec advance-be-redis redis-cli MEMORY USAGE l06:enc:h
docker exec advance-be-redis redis-cli HSET l06:enc:h f513 v513
docker exec advance-be-redis redis-cli HLEN l06:enc:h
docker exec advance-be-redis redis-cli OBJECT ENCODING l06:enc:h
docker exec advance-be-redis redis-cli MEMORY USAGE l06:enc:h
# V64 = chuỗi 64 chữ số 0. Một trường có giá trị dài 64 byte vẫn là listpack, 65 byte thì đổi.
V64=$(printf '%064d' 0)
docker exec advance-be-redis redis-cli HSET l06:enc:hv f "$V64"
docker exec advance-be-redis redis-cli HSTRLEN l06:enc:hv f
docker exec advance-be-redis redis-cli OBJECT ENCODING l06:enc:hv
docker exec advance-be-redis redis-cli MEMORY USAGE l06:enc:hv
docker exec advance-be-redis redis-cli HSET l06:enc:hv f "${V64}x"
docker exec advance-be-redis redis-cli HSTRLEN l06:enc:hv f
docker exec advance-be-redis redis-cli OBJECT ENCODING l06:enc:hv
docker exec advance-be-redis redis-cli MEMORY USAGE l06:enc:hv
# #endregion

# #region set-zset-list · Set số (intset), Set chuỗi, Sorted Set, List (slide 34, 35)
set -u
docker exec advance-be-redis redis-cli UNLINK l06:enc:si l06:enc:ss l06:enc:z l06:enc:l > /dev/null
# Set toàn số nguyên: 512 phần tử → intset, 513 → hashtable.
seq 1 512 | awk '{print "SADD l06:enc:si "$1}' | docker exec -i advance-be-redis redis-cli > /dev/null
docker exec advance-be-redis redis-cli SCARD l06:enc:si
docker exec advance-be-redis redis-cli OBJECT ENCODING l06:enc:si
docker exec advance-be-redis redis-cli SADD l06:enc:si 513
docker exec advance-be-redis redis-cli SCARD l06:enc:si
docker exec advance-be-redis redis-cli OBJECT ENCODING l06:enc:si
# Set chuỗi: 128 phần tử → listpack (mới từ Redis 7.2), 129 → hashtable.
seq 1 128 | awk '{print "SADD l06:enc:ss u"$1}' | docker exec -i advance-be-redis redis-cli > /dev/null
docker exec advance-be-redis redis-cli SCARD l06:enc:ss
docker exec advance-be-redis redis-cli OBJECT ENCODING l06:enc:ss
docker exec advance-be-redis redis-cli SADD l06:enc:ss u129
docker exec advance-be-redis redis-cli SCARD l06:enc:ss
docker exec advance-be-redis redis-cli OBJECT ENCODING l06:enc:ss
# Sorted Set: 128 phần tử → listpack, 129 → skiplist (+ dict).
seq 1 128 | awk '{print "ZADD l06:enc:z "$1" m"$1}' | docker exec -i advance-be-redis redis-cli > /dev/null
docker exec advance-be-redis redis-cli ZCARD l06:enc:z
docker exec advance-be-redis redis-cli OBJECT ENCODING l06:enc:z
docker exec advance-be-redis redis-cli ZADD l06:enc:z 129 m129
docker exec advance-be-redis redis-cli ZCARD l06:enc:z
docker exec advance-be-redis redis-cli OBJECT ENCODING l06:enc:z
# List: ngưỡng tính theo BYTE (8 KB), không theo số phần tử. 10 phần tử → listpack, 3000 → quicklist.
seq 1 10 | awk '{print "RPUSH l06:enc:l item-"$1}' | docker exec -i advance-be-redis redis-cli > /dev/null
docker exec advance-be-redis redis-cli LLEN l06:enc:l
docker exec advance-be-redis redis-cli OBJECT ENCODING l06:enc:l
seq 11 3000 | awk '{print "RPUSH l06:enc:l item-"$1}' | docker exec -i advance-be-redis redis-cli > /dev/null
docker exec advance-be-redis redis-cli LLEN l06:enc:l
docker exec advance-be-redis redis-cli OBJECT ENCODING l06:enc:l
# #endregion
