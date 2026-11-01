#!/usr/bin/env bash
# Công cụ controller (học viên không cần): chạy tuần tự mọi region lab qua verify/run-redis.mjs và ghi runs/.
# Thứ tự theo phase 03 bước 4. Cố ý KHÔNG export MSYS_NO_PATHCONV: run phải giống môi trường học viên dán vào Git Bash.
# Dùng: bash verify/record-all.sh [setup s1 s2 s3 s4 s5 s6 s7 s8 s9 gates ...]   (không tham số = tất cả, theo thứ tự)
set -u
V="$(cd "$(dirname "$0")" && pwd -W)"
PLAN="$(cd "$V/.." && pwd -W)"
L="$(cd "$PLAN/../../labs/lesson-06-redis" && pwd -W)"
run() { echo "· run $*"; node "$V/run-redis.mjs" "$@" || { echo "✘ runner lỗi: $*"; exit 1; }; }
ab() { run --ab "$L/$1.A.$3" "$L/$1.B.$3" "$2" --rep 3; } # $1 stem, $2 region, $3 redis|sh
check() { echo "· check.sh ($1)"; bash "$L/check.sh" | grep -E "^(✘|✔ C1[12]|✔ C1[45])"; }

setup() {
  bash "$L/00-containers.sh" up main
  run "$L/00-seed.redis"
  run "$L/check.sh" --out check.after-seed
  run "$L/00-seed.redis"
  run "$L/check.sh" --out check.rerun
}
s1() {
  run "$L/01-why-fast.redis" --region threads
  run "$L/01-why-fast.redis" --region slowlog
  for r in threads pipeline size mget; do run "$L/01-bench.sh" --region "$r"; done
  ab 01-block sleep redis
  # B của kịch bản busy là .sh: trong lúc script bận, Redis trả BUSY cho cả ECHO đánh dấu của phiên .redis.
  run --ab "$L/01-block.A.redis" "$L/01-block.B.sh" busy --rep 3
  run "$L/01-why-fast.redis" --region kiem-chung
  check "sau chặng 1"
}
s2() {
  for r in string slide30-memory slide30-ops; do run "$L/02-encodings.redis" --region "$r"; done
  for r in hash set-zset-list; do run "$L/02-encodings.sh" --region "$r"; done
  ab 02-json-race lost redis
  run "$L/02-encodings.redis" --region kiem-chung
}
s3() {
  bash "$L/00-containers.sh" up evict
  run "$L/03-expiry.redis" --region expire-dict
  sleep 11 # khóa l06:exp:ttl (EX 10) phải hết hạn trước khi đếm expires=1000
  run "$L/03-expiry.sh" --region passive
  sleep 3 # để chu kỳ nền dọn 999 khóa passive còn lại trước khi đếm expired_keys
  run "$L/03-expiry.sh" --region active
  for r in noeviction allkeys-lru allkeys-lfu volatile-ttl allkeys-random; do run "$L/03-eviction.sh" --region "$r"; done
  run "$L/03-expiry.redis" --region kiem-chung
  check "sau chặng 3"
}
s4() {
  bash "$L/00-containers.sh" up persist
  for r in rdb-loss aof-loss hybrid kiem-chung; do run "$L/04-persistence.sh" --region "$r"; done
}
s5() {
  for r in list-reliable hash-cart set-likes zset-board streams; do run "$L/05-structures.redis" --region "$r"; done
  ab 05-queue brpop redis
  ab 05-counter getset redis
  ab 05-counter incr redis
  run "$L/05-structures.redis" --region kiem-chung
}
s6() {
  ab 06-delay naive redis
  ab 06-delay-lua claim sh
  for r in bigkey lazyfree bigkeys; do run "$L/06-practices.sh" --region "$r"; done
  run "$L/06-practices.redis" --region kiem-chung
  check "sau chặng 6"
}
s7() {
  bash "$L/00-containers.sh" up replica
  bash "$L/00-containers.sh" up cluster
  for r in replica partition failover; do run "$L/07-architecture.sh" --region "$r"; done
  for r in keyslot crossslot; do run "$L/07-cluster.redis" --region "$r"; done
  run "$L/07-architecture.sh" --region kiem-chung
}
s8() {
  for r in nolock nx ttldel; do ab 08-lock "$r" redis; done
  for r in cad fencing; do ab 08-lock-lua "$r" sh; done
  sleep 2.5 # khóa tokC (PX 2000) của kịch bản ttldel tự hết hạn
  run "$L/08-lock.A.redis" --region kiem-chung
}
s9() {
  for r in bucket30 idempotency; do run "$L/09-bridge.sh" --region "$r"; done
  ab 09-bucket naive redis
  ab 09-bucket-lua claim sh
  run "$L/09-bridge.redis" --region kiem-chung
}
gates() {
  node "$V/verify-guide.mjs" --lint
  node "$V/rerun-gate.mjs"
  run "$L/00-seed.redis"
  check "cuối"
  bash "$V/fingerprint.sh" --compare "$PLAN/runs/00-fingerprint-before.txt"
}

steps=("$@"); [ ${#steps[@]} -eq 0 ] && steps=(setup s1 s2 s3 s4 s5 s6 s7 s8 s9 gates)
for s in "${steps[@]}"; do echo "== $s"; "$s"; done
