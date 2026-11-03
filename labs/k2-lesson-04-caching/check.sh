#!/usr/bin/env bash
export MSYS_NO_PATHCONV=1
# K2 Bài 04 · Kiểm tra trạng thái lab Caching & Rate Limiting (chỉ quét đối tượng của K2L04, tuyệt đối không đụng bài khác).
# Chạy (Git Bash): bash labs/k2-lesson-04-caching/check.sh
# Mỗi dòng in ✔|✘|–, mã thoát = số dòng ✘.
set -u
HERE="$(cd "$(dirname "$0")" && pwd -W)"
MAIN=advance-be-k2l04-redis
CLUSTER=advance-be-k2l04-cluster
CRASH=advance-be-k2l04-crash
NET=advance-be-k2l04
VOL=advance-be-k2l04-redis-data
IMG=redis:7.2.3
bad=0

row() {
  echo "$1 $2 $3 · $4"
  if [ "$1" = "✘" ]; then bad=$((bad + 1)); fi
}
exists() { docker container inspect "$1" >/dev/null 2>&1; }
running() { [ "$(docker inspect -f '{{.State.Running}}' "$1" 2>/dev/null)" = "true" ]; }
cmd_json() { docker inspect -f '{{json .Config.Cmd}}' "$1" 2>/dev/null; }
nets() { docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' "$1" 2>/dev/null; }
rcli() { docker exec "$MAIN" redis-cli "$@" 2>/dev/null | tr -d '\r'; }
has_args() {
  local s=",${1#[}" pat="," a; shift
  s="${s%]},"
  for a in "$@"; do pat="$pat\"$a\","; done
  case "$s" in *"$pat"*) return 0 ;; *) return 1 ;; esac
}
norm() { printf '%s' "$1" | tr '\\' '/' | tr 'A-Z' 'a-z' | sed -e 's#^/run/desktop/mnt/host/\([a-z]\)/#\1:/#' -e 's#/$##'; }
cfg() { rcli CONFIG GET "$1" | sed -n 2p; }

# C01: main container
if ! exists "$MAIN"; then
  row "✘" C01 "main $MAIN" "chưa có container · chạy: bash labs/k2-lesson-04-caching/00-containers.sh up main"
else
  why=""
  img=$(docker inspect -f '{{.Config.Image}}' "$MAIN")
  [ "$img" = "$IMG" ] || why="$why image=$img (cần $IMG);"
  running "$MAIN" || why="$why container đang dừng;"
  j=$(cmd_json "$MAIN")
  has_args "$j" --appendonly no || why="$why thiếu --appendonly no;"
  case " $(nets "$MAIN") " in *" $NET "*) ;; *) why="$why chưa vào network $NET;" ;; esac
  src=$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/lab"}}{{.Source}}|{{.RW}}{{end}}{{end}}' "$MAIN")
  if [ -z "$src" ]; then why="$why chưa mount /lab;"
  else
    [ "$(norm "${src%|*}")" = "$(norm "$HERE")" ] || why="$why /lab mount từ ${src%|*} (cần $HERE);"
    [ "${src#*|}" = "false" ] || why="$why /lab phải read-only (:ro);"
  fi
  dvol=$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/data"}}{{.Name}}{{end}}{{end}}' "$MAIN")
  [ "$dvol" = "$VOL" ] || why="$why /data volume=${dvol:-none} (cần $VOL);"
  if running "$MAIN"; then
    ver=$(rcli INFO server | sed -n 's/^redis_version://p')
    [ "$ver" = "7.2.3" ] || why="$why redis_version=$ver;"
  fi
  if [ -z "$why" ]; then row "✔" C01 "main $MAIN" "$IMG, redis_version:7.2.3, network $NET, /lab ro, volume $VOL"
  else row "✘" C01 "main $MAIN" "${why# } · sửa: bash labs/k2-lesson-04-caching/00-containers.sh up main"; fi
fi

# C02: cluster extra (– if absent)
if ! exists "$CLUSTER"; then
  row "–" C02 "$CLUSTER" "chưa bật (tùy chọn) · khi tới chặng 1 cluster: bash labs/k2-lesson-04-caching/00-containers.sh up cluster"
else
  why=""
  running "$CLUSTER" || why="$why đang dừng;"
  [ -z "$(docker port "$CLUSTER" 2>/dev/null)" ] || why="$why không được publish cổng;"
  if running "$CLUSTER"; then
    ci=$(docker exec "$CLUSTER" redis-cli CLUSTER INFO 2>/dev/null | tr -d '\r')
    printf '%s\n' "$ci" | grep -qx 'cluster_state:ok' || why="$why cluster_state khác ok;"
    printf '%s\n' "$ci" | grep -qx 'cluster_slots_assigned:16384' || why="$why chưa gán đủ 16384 slot;"
  fi
  if [ -z "$why" ]; then row "✔" C02 "$CLUSTER" "cluster_state:ok, 16384 slots, không publish cổng"
  else row "✘" C02 "$CLUSTER" "${why# }"; fi
fi

# C03: crash extra (– if absent)
if ! exists "$CRASH"; then
  row "–" C03 "$CRASH" "chưa bật (tùy chọn) · chặng 5 mới bật tạm thời"
else
  why=""
  running "$CRASH" || why="$why đang dừng;"
  j=$(cmd_json "$CRASH")
  has_args "$j" --save "" || why="$why thiếu --save \"\";"
  [ -z "$(docker port "$CRASH" 2>/dev/null)" ] || why="$why không được publish cổng;"
  if [ -z "$why" ]; then row "✔" C03 "$CRASH" "--save \"\", không publish cổng"
  else row "✘" C03 "$CRASH" "${why# }"; fi
fi

# C04: main publishes only 127.0.0.1:6381; no other k2l04 port
why=""
if exists "$MAIN"; then
  pb=$(docker port "$MAIN" 2>/dev/null | tr -d '\r' | paste -sd, -)
  [ "$pb" = "6379/tcp -> 127.0.0.1:6381" ] || why="$why main publish: ${pb:-không có} (cần 127.0.0.1:6381);"
else
  why="chưa có main;"
fi
for n in $(docker ps -a --filter name=advance-be-k2l04- --format '{{.Names}}' 2>/dev/null | tr -d '\r'); do
  [ "$n" = "$MAIN" ] && continue
  [ -z "$(docker port "$n" 2>/dev/null)" ] || why="$why $n publish cổng;"
done
if [ -z "$why" ]; then row "✔" C04 "cổng publish" "main 127.0.0.1:6381, container phụ không publish"
else row "✘" C04 "cổng publish" "${why# }"; fi

# C05: host 127.0.0.1:6381 run_id = exec run_id
host_run_id() {
  node -e "const s=require('net').connect(6381,'127.0.0.1');let b='';s.setTimeout(2500,()=>{s.destroy();process.exit(1)});s.on('data',d=>{b+=d;const m=b.match(/run_id:(\w+)/);if(m){console.log(m[1]);s.destroy();}});s.on('error',()=>process.exit(1));s.write('INFO server\r\n');" 2>/dev/null | tr -d '\r'
}
cid=""; running "$MAIN" && cid=$(rcli INFO server | sed -n 's/^run_id://p')
hid=$(host_run_id || true)
if [ -n "$cid" ] && [ "$cid" = "$hid" ]; then row "✔" C05 "127.0.0.1:6381 là main" "run_id khớp (${cid:0:8}…)"
else row "✘" C05 "127.0.0.1:6381 là main" "run_id container=${cid:0:8} host=${hid:0:8} · main chưa chạy hoặc cổng 6381 bận"; fi

# C06-C09: keys and config on main
if ! running "$MAIN"; then
  for c in "C06 mọi khóa k2l04:" "C07 dữ liệu seed" "C08 cấu hình chuẩn" "C09 không rò TTL -1 / barrier"; do
    row "✘" "${c%% *}" "${c#* }" "cần main đang chạy"
  done
else
  foreign=$(rcli --scan --count 1000 | grep -v '^k2l04:' | grep -c . || true)
  if [ "$foreign" = "0" ]; then row "✔" C06 "mọi khóa k2l04:" "0 khóa lạ"
  else row "✘" C06 "mọi khóa k2l04:" "có $foreign khóa ngoài k2l04:"; fi

  sv=$(rcli GET k2l04:seed:version); vs=$(rcli EXISTS k2l04:voucher:V1:stock)
  if [ "$sv" = "v1" ] && [ "$vs" = "1" ]; then row "✔" C07 "dữ liệu seed" "k2l04:seed:version=v1, voucher V1 sẵn sàng"
  else row "✘" C07 "dữ liệu seed" "seed:version=${sv:-trống} voucher=${vs:-0} · chạy lại 00-seed.redis"; fi

  why=""
  for kv in "maxmemory 0" "maxmemory-policy noeviction" "hash-max-listpack-entries 512" "zset-max-listpack-entries 128" "hll-sparse-max-bytes 3000"; do
    v=$(cfg "${kv%% *}"); [ "$v" = "${kv#* }" ] || why="$why ${kv%% *}=$v;"
  done
  if [ -z "$why" ]; then row "✔" C08 "cấu hình chuẩn" "maxmemory 0, noeviction, hash-listpack 512, zset-listpack 128, hll-sparse 3000"
  else row "✘" C08 "cấu hình chuẩn" "${why# } · chạy: bash labs/k2-lesson-04-caching/00-containers.sh reset main"; fi

  leak=0
  while IFS= read -r k; do
    [ -z "$k" ] && continue
    t=$(rcli TTL "$k")
    [ "$t" = "-1" ] && leak=$((leak + 1))
  done < <(rcli --scan --pattern 'k2l04:rl:*')
  br=$(rcli --scan --pattern 'k2l04:barrier:*' | grep -c . || true)
  if [ "$leak" = "0" ] && [ "$br" = "0" ]; then row "✔" C09 "không rò TTL -1 / barrier" "0 khóa k2l04:rl:* mất TTL, 0 barrier"
  else row "✘" C09 "không rò TTL -1 / barrier" "rl_ttl_minus1=$leak barrier=$br"; fi
fi

# C10: PG post_count = 1000 (– if absent; read-only)
pg_ct=$(docker ps --format '{{.Names}}' 2>/dev/null | tr -d '\r' | grep -E '^quan[-_]ly[-_]hop[-_]dong-postgres-1$' | head -1)
if [ -z "$pg_ct" ]; then
  row "–" C10 "PG k2l04_counter.post_count" "container PG chưa chạy"
else
  tbl=$(docker exec -e PGOPTIONS='-c default_transaction_read_only=on' "$pg_ct" psql -X -U postgres -d advance_be_lab -Atc \
    "SELECT to_regclass('k2l04_counter.post_count') IS NOT NULL;" 2>/dev/null | tr -d '\r')
  if [ "$tbl" != "t" ]; then
    row "–" C10 "PG k2l04_counter.post_count" "chưa tạo bảng (sẽ tạo ở chặng 5)"
  else
    cnt=$(docker exec -e PGOPTIONS='-c default_transaction_read_only=on' "$pg_ct" psql -X -U postgres -d advance_be_lab -Atc \
      "SELECT count(*) FROM k2l04_counter.post_count;" 2>/dev/null | tr -d '\r')
    if [ "$cnt" = "1000" ]; then row "✔" C10 "PG k2l04_counter.post_count" "1000 dòng (chỉ đọc)"
    else row "✘" C10 "PG k2l04_counter.post_count" "count=$cnt (cần 1000)"; fi
  fi
fi

exit "$bad"
