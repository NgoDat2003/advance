#!/usr/bin/env bash
export MSYS_NO_PATHCONV=1
# Bài 06 · Bật / tắt / xem các container lab Redis. Chạy lại bao nhiêu lần cũng được: container đã đúng thì giữ nguyên.
# Cách chạy (Git Bash, đứng ở thư mục nào cũng được):
#   bash labs/lesson-06-redis/00-containers.sh up main       # container chính, cổng 127.0.0.1:6379 (DBX, bài tập dùng cổng này)
#   bash labs/lesson-06-redis/00-containers.sh up main --recreate   # chỉ khi script từ chối: cho phép xóa container cùng tên không do script này tạo
#   bash labs/lesson-06-redis/00-containers.sh up evict      # chặng 3: thử eviction (không publish cổng)
#   bash labs/lesson-06-redis/00-containers.sh up persist    # chặng 4: hai container rdb + aof
#   bash labs/lesson-06-redis/00-containers.sh up replica    # chặng 7: bản sao của main
#   bash labs/lesson-06-redis/00-containers.sh up cluster    # chặng 7: cluster 1 node giữ đủ 16384 slot
#   bash labs/lesson-06-redis/00-containers.sh down <evict|persist|replica|cluster>
#   bash labs/lesson-06-redis/00-containers.sh status
#   bash labs/lesson-06-redis/00-containers.sh reset main    # trả 6 cấu hình của main về mặc định + bật lại active expiry
# Container phụ không publish cổng nào: vào chúng bằng `docker exec`. Main chỉ publish trên 127.0.0.1 (không lộ ra mạng LAN).
# Tạo lại main không làm mất khóa của bạn: script SAVE rồi dừng êm (docker stop) trước khi xóa; dump.rdb nằm trên volume
# advance-be-redis-data nên container mới nạp lại. Container cùng tên nhưng khác image (ví dụ redis:7.4-alpine của Bài 02)
# hoặc /data không nằm trên volume đó thì script DỪNG, in số khóa đang có, và chỉ xóa khi bạn chạy lại với --recreate.
set -u
RECREATE=0; [ "${3:-}" = --recreate ] && RECREATE=1
HERE="$(cd "$(dirname "$0")" && pwd -W)"
IMG=redis:7.2.3
NET=advance-be-l06
MAIN=advance-be-redis
DATA=advance-be-redis-data

say() { echo "$*"; }
die() { echo "✘ $*"; exit 2; }
exists() { docker container inspect "$1" >/dev/null 2>&1; }
running() { [ "$(docker inspect -f '{{.State.Running}}' "$1" 2>/dev/null)" = "true" ]; }
# Chuẩn hóa đường dẫn mount để so sánh (giống check.sh): chữ thường, dấu /, bỏ tiền tố Docker Desktop.
norm() { printf '%s' "$1" | tr '\\' '/' | tr 'A-Z' 'a-z' | sed -e 's#^/run/desktop/mnt/host/\([a-z]\)/#\1:/#' -e 's#/$##'; }

# Bảng container (giống bảng "Container lifecycle" của guide). Mỗi hàm điền: NETW, PUB, VOLS, ARGS.
spec() {
  PUB=(); VOLS=()
  case "$1" in
    "$MAIN") NETW=$NET; PUB=(-p 127.0.0.1:6379:6379); VOLS=(-v "$HERE:/lab:ro" -v "$DATA:/data")
             ARGS=(redis-server --appendonly no --enable-debug-command local) ;;
    advance-be-redis-replica) NETW=$NET; ARGS=(redis-server --replicaof "$MAIN" 6379 --appendonly no --save "") ;;
    advance-be-redis-cluster) NETW=$NET; ARGS=(redis-server --cluster-enabled yes --cluster-config-file nodes.conf --appendonly no --save "") ;;
    advance-be-redis-evict|advance-be-redis-rdb) NETW=bridge; ARGS=(redis-server --appendonly no --save "") ;;
    advance-be-redis-aof) NETW=bridge; ARGS=(redis-server --appendonly yes --appendfsync everysec --save "") ;;
    *) die "không biết container $1" ;;
  esac
  case "$1" in advance-be-redis|advance-be-redis-[a-z]*) ;; *) die "từ chối tên $1 (chỉ advance-be-redis*)" ;; esac
  case "${PUB[*]:-}" in *6380*) die "từ chối: cổng 6380 dành cho OmniPOS hub" ;; esac # guard-port
}
want_cmd() { local a out="["; for a in "${ARGS[@]}"; do out="$out\"$a\","; done; printf '%s' "${out%,}]"; }

# Lý do phải tạo lại (rỗng = container đang đúng bảng).
drift() {
  local n="$1" why="" pb src
  [ "$(docker inspect -f '{{.Config.Image}}' "$n")" = "$IMG" ] || why="$why image=$(docker inspect -f '{{.Config.Image}}' "$n") (cần $IMG);"
  [ "$(docker inspect -f '{{json .Config.Cmd}}' "$n")" = "$(want_cmd)" ] || why="$why lệnh khởi động khác;"
  case " $(docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' "$n") " in *" $NETW "*) ;; *) why="$why chưa vào network $NETW;" ;; esac
  pb=$(docker inspect -f '{{json .HostConfig.PortBindings}}' "$n")
  if [ "$n" = "$MAIN" ]; then
    [ "$pb" = '{"6379/tcp":[{"HostIp":"127.0.0.1","HostPort":"6379"}]}' ] || why="$why publish $pb (cần 127.0.0.1:6379);"
    src=$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/lab"}}{{.Source}}|{{.RW}}{{end}}{{end}}' "$n")
    [ "$(norm "${src%|*}")" = "$(norm "$HERE")" ] && [ "${src#*|}" = "false" ] || why="$why /lab chưa mount read-only từ $HERE;"
    [ "$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/data"}}{{.Name}}{{end}}{{end}}' "$n")" = "$DATA" ] || why="$why /data chưa dùng volume $DATA;"
  else
    case "$pb" in '{}'|'null'|'') ;; *) why="$why container phụ không được publish cổng;" ;; esac
  fi
  printf '%s' "${why# }"
}
wait_ping() { local i; for i in $(seq 50); do docker exec "$1" redis-cli PING 2>/dev/null | grep -q PONG && return 0; sleep 0.2; done; die "$1 không trả PONG sau 10 s"; }
ensure_net() { docker network inspect "$NET" >/dev/null 2>&1 || { docker network create "$NET" >/dev/null && say "+ network $NET"; }; }

# Tạo container theo bảng nếu chưa có hoặc lệch bảng; container đúng bảng mà đang dừng thì chỉ start.
up_one() {
  local n="$1" why
  spec "$n"
  ensure_net
  if exists "$n"; then
    why=$(drift "$n")
    if [ -z "$why" ]; then
      running "$n" || docker start "$n" >/dev/null
      wait_ping "$n"; say "✔ $n đã đúng bảng, đang chạy"; return 0
    fi
    say "! $n lệch bảng: $why"
    # Container lạ (image khác) hoặc main mà /data không nằm trên volume có tên: tạo lại sẽ mất dữ liệu, phải hỏi.
    local foreign=0 keys="?"
    [ "$(docker inspect -f '{{.Config.Image}}' "$n")" = "$IMG" ] || foreign=1
    [ "$n" = "$MAIN" ] && [ "$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/data"}}{{.Name}}{{end}}{{end}}' "$n")" != "$DATA" ] && foreign=1
    running "$n" && keys=$(docker exec "$n" redis-cli DBSIZE 2>/dev/null | tr -d '\r')
    if [ "$foreign" = 1 ] && [ "$RECREATE" = 0 ]; then
      say "✘ dừng: $n không do script này tạo (image hoặc /data khác bảng), đang có ${keys} khóa. Tạo lại sẽ xóa container này và dữ liệu không nằm trên volume $DATA."
      say "  Container cùng tên có thể do guide Bài 02 tạo (redis:7.4-alpine). Muốn giữ: đổi tên nó (docker rename $n <tên khác>)."
      local u; case "$n" in "$MAIN") u=main ;; *-rdb|*-aof) u=persist ;; *) u=${n#advance-be-redis-} ;; esac
      say "  Đồng ý xóa: bash labs/lesson-06-redis/00-containers.sh up $u --recreate"
      exit 2
    fi
    # Lưu snapshot rồi dừng êm (SIGTERM, Redis tự lưu khi có save point) trước khi xóa; volume có tên không bị -v xóa.
    if running "$n"; then
      docker exec "$n" redis-cli SAVE >/dev/null 2>&1 && say "  SAVE $n ($keys khóa) trước khi tạo lại"
      docker stop -t 15 "$n" >/dev/null # guard-main: dừng êm đúng tên này
    fi
    docker rm -v "$n" >/dev/null # guard-main: chỉ xóa đúng tên này để tạo lại theo bảng
    say "  → tạo lại $n"
  fi
  docker run -d --name "$n" --network "$NETW" "${PUB[@]}" "${VOLS[@]}" "$IMG" "${ARGS[@]}" >/dev/null || die "docker run $n thất bại"
  wait_ping "$n"; say "+ $n tạo mới, đang chạy"
  [ "$n" = "$MAIN" ] && print_c14_c15
  return 0
}

# C14/C15: main chỉ publish 127.0.0.1:6379, và 127.0.0.1:6379 từ máy host đúng là container main (so run_id).
print_c14_c15() {
  local pb cid hid
  pb=$(docker port "$MAIN" 2>/dev/null | tr -d '\r' | paste -sd, -)
  if [ "$pb" = "6379/tcp -> 127.0.0.1:6379" ]; then say "✔ C14 main publish $pb"; else say "✘ C14 main publish ${pb:-không có} (cần 127.0.0.1:6379)"; fi
  cid=$(docker exec "$MAIN" redis-cli INFO server | tr -d '\r' | sed -n 's/^run_id://p')
  hid=$(node -e "const s=require('net').connect(6379,'127.0.0.1');let b='';s.setTimeout(3000,()=>{s.destroy();process.exit(1)});s.on('data',d=>{b+=d;const m=b.match(/run_id:(\w+)/);if(m){console.log(m[1]);s.destroy();}});s.on('error',()=>process.exit(1));s.write('INFO server\r\n');" 2>/dev/null)
  if [ -n "$cid" ] && [ "$cid" = "$hid" ]; then say "✔ C15 127.0.0.1:6379 là main (run_id ${cid:0:8}…)"; else say "✘ C15 run_id container=${cid:0:8} host=${hid:0:8}"; fi
}

up_replica() {
  up_one "$MAIN"
  # Main phải nằm trong network của replica (idempotent: đã vào thì bỏ qua).
  case " $(docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' "$MAIN") " in
    *" $NET "*) ;;
    *) docker network connect "$NET" "$MAIN" && say "+ nối $MAIN vào $NET" ;; # guard-main
  esac
  up_one advance-be-redis-replica
  local i; for i in $(seq 40); do docker exec advance-be-redis-replica redis-cli INFO replication | grep -q '^master_link_status:up' && break; sleep 0.5; done
  say "  replica: $(docker exec advance-be-redis-replica redis-cli INFO replication | tr -d '\r' | grep -E '^(role|master_link_status):' | paste -sd' ' -)"
}
up_cluster() {
  up_one advance-be-redis-cluster
  local c=advance-be-redis-cluster i
  if ! docker exec "$c" redis-cli CLUSTER INFO | grep -q '^cluster_slots_assigned:16384'; then
    docker exec "$c" redis-cli CLUSTER ADDSLOTSRANGE 0 16383 >/dev/null
  fi
  for i in $(seq 50); do docker exec "$c" redis-cli CLUSTER INFO | grep -q '^cluster_state:ok' && break; sleep 0.2; done
  say "  cluster: $(docker exec "$c" redis-cli CLUSTER INFO | tr -d '\r' | grep -E '^(cluster_state|cluster_slots_assigned):' | paste -sd' ' -)"
}

down_one() {
  local n="$1"
  [ "$n" = "$MAIN" ] && die "down không bao giờ xóa main (dùng 99-cleanup.sh --all nếu thật sự muốn)"
  spec "$n"
  if exists "$n"; then docker rm -f -v "$n" >/dev/null && say "- đã xóa $n"; else say "– $n không có"; fi
}

reset_main() {
  running "$MAIN" || die "main chưa chạy · bash labs/lesson-06-redis/00-containers.sh up main"
  local kv
  for kv in "maxmemory 0" "maxmemory-policy noeviction" "lazyfree-lazy-user-del no" "slowlog-log-slower-than 10000" "latency-monitor-threshold 0" "appendonly no"; do
    docker exec "$MAIN" redis-cli CONFIG SET ${kv} >/dev/null # guard-main: chỉ trả về giá trị mặc định
  done
  docker exec "$MAIN" redis-cli DEBUG SET-ACTIVE-EXPIRE 1 >/dev/null
  say "✔ main: maxmemory 0, noeviction, lazyfree-lazy-user-del no, slowlog 10000, latency 0, appendonly no, active expiry bật"
}

status() {
  local n
  for n in "$MAIN" advance-be-redis-evict advance-be-redis-rdb advance-be-redis-aof advance-be-redis-replica advance-be-redis-cluster; do
    if exists "$n"; then
      spec "$n"
      local why; why=$(drift "$n")
      say "$n · $(docker inspect -f '{{.State.Status}}' "$n") · ${why:-đúng bảng}$([ "$n" = "$MAIN" ] && printf ' · %s' "$(docker port "$MAIN" 2>/dev/null | tr -d '\r' | paste -sd, -)")"
    else say "$n · chưa có"; fi
  done
}

case "${1:-} ${2:-}" in
  "up main") up_one "$MAIN" ;;
  "up evict") up_one advance-be-redis-evict ;;
  "up persist") up_one advance-be-redis-rdb; up_one advance-be-redis-aof ;;
  "up replica") up_replica ;;
  "up cluster") up_cluster ;;
  "down evict") down_one advance-be-redis-evict ;;
  "down persist") down_one advance-be-redis-rdb; down_one advance-be-redis-aof ;;
  "down replica") down_one advance-be-redis-replica ;;
  "down cluster") down_one advance-be-redis-cluster ;;
  "status "*) status ;;
  "reset main") reset_main ;;
  *) sed -n '3,13p' "$0"; exit 2 ;;
esac
