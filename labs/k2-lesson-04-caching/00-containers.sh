#!/usr/bin/env bash
export MSYS_NO_PATHCONV=1
# K2 Bài 04 · Quản lý container lab Redis riêng biệt cho bài Caching & Rate Limiting (cổng 127.0.0.1:6381).
# Cách chạy (Git Bash, từ thư mục bất kỳ):
#   bash labs/k2-lesson-04-caching/00-containers.sh up main
#   bash labs/k2-lesson-04-caching/00-containers.sh up main --recreate
#   bash labs/k2-lesson-04-caching/00-containers.sh up cluster
#   bash labs/k2-lesson-04-caching/00-containers.sh up crash
#   bash labs/k2-lesson-04-caching/00-containers.sh down <cluster|crash>
#   bash labs/k2-lesson-04-caching/00-containers.sh status
#   bash labs/k2-lesson-04-caching/00-containers.sh reset main
set -u
RECREATE=0; [ "${3:-}" = --recreate ] && RECREATE=1
HERE="$(cd "$(dirname "$0")" && pwd -W)"
IMG=redis:7.2.3
NET=advance-be-k2l04
MAIN=advance-be-k2l04-redis
CLUSTER=advance-be-k2l04-cluster
CRASH=advance-be-k2l04-crash

say() { echo "$*"; }
die() { echo "✘ $*"; exit 2; }
exists() { docker container inspect "$1" >/dev/null 2>&1; }
running() { [ "$(docker inspect -f '{{.State.Running}}' "$1" 2>/dev/null)" = "true" ]; }
norm() { printf '%s' "$1" | tr '\\' '/' | tr 'A-Z' 'a-z' | sed -e 's#^/run/desktop/mnt/host/\([a-z]\)/#\1:/#' -e 's#/$##'; }

assert_ct() {
  case "$1" in
    advance-be-k2l04-redis|advance-be-k2l04-cluster|advance-be-k2l04-crash) ;;
    *) die "từ chối tên container ngoài K2L04: $1" ;;
  esac
}

assert_vol() {
  case "$1" in
    advance-be-k2l04-redis-data|advance-be-k2l04-cluster-data|advance-be-k2l04-crash-data) ;;
    *) die "từ chối tên volume ngoài K2L04: $1" ;;
  esac
}

spec() {
  assert_ct "$1"
  PUB=(); VOLS=(); DATA_VOL="${1}-data"
  assert_vol "$DATA_VOL"
  case "$1" in
    "$MAIN")
      NETW="$NET"
      PUB=(-p 127.0.0.1:6381:6379)
      VOLS=(-v "$HERE:/lab:ro" -v "$DATA_VOL:/data")
      ARGS=(redis-server --appendonly no)
      ;;
    "$CLUSTER")
      NETW="$NET"
      VOLS=(-v "$DATA_VOL:/data")
      ARGS=(redis-server --cluster-enabled yes --cluster-config-file nodes.conf --appendonly no --save "")
      ;;
    "$CRASH")
      NETW="$NET"
      VOLS=(-v "$HERE:/lab:ro" -v "$DATA_VOL:/data")
      ARGS=(redis-server --appendonly no --save "")
      ;;
    *) die "không biết container $1" ;;
  esac
  case "${PUB[*]:-}" in *6380*|*127.0.0.1:6379:*) die "từ chối cổng bảo vệ 6380 / 6379" ;; esac # guard-port
}

want_cmd() { local a out="["; for a in "${ARGS[@]}"; do out="$out\"$a\","; done; printf '%s' "${out%,}]"; }

drift() {
  local n="$1" why="" pb src
  assert_ct "$n"
  [ "$(docker inspect -f '{{.Config.Image}}' "$n")" = "$IMG" ] || why="$why image=$(docker inspect -f '{{.Config.Image}}' "$n") (cần $IMG);"
  [ "$(docker inspect -f '{{json .Config.Cmd}}' "$n")" = "$(want_cmd)" ] || why="$why lệnh khởi động khác;"
  case " $(docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' "$n") " in *" $NETW "*) ;; *) why="$why chưa vào network $NETW;" ;; esac
  pb=$(docker inspect -f '{{json .HostConfig.PortBindings}}' "$n")
  if [ "$n" = "$MAIN" ]; then
    [ "$pb" = '{"6379/tcp":[{"HostIp":"127.0.0.1","HostPort":"6381"}]}' ] || why="$why publish $pb (cần 127.0.0.1:6381);"
  else
    case "$pb" in '{}'|'null'|'') ;; *) why="$why container phụ không được publish cổng;" ;; esac
  fi
  if [ "$n" = "$MAIN" ] || [ "$n" = "$CRASH" ]; then
    src=$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/lab"}}{{.Source}}|{{.RW}}{{end}}{{end}}' "$n")
    [ "$(norm "${src%|*}")" = "$(norm "$HERE")" ] && [ "${src#*|}" = "false" ] || why="$why /lab chưa mount read-only từ $HERE;"
  fi
  [ "$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/data"}}{{.Name}}{{end}}{{end}}' "$n")" = "$DATA_VOL" ] || why="$why /data chưa dùng volume $DATA_VOL;"
  printf '%s' "${why# }"
}

check_port_6381_free() {
  local line pid
  line=$(netstat -ano 2>/dev/null | tr -d '\r' | grep '127.0.0.1:6381 ' | grep LISTENING | head -1 || true)
  if [ -n "$line" ]; then
    pid=$(printf '%s' "$line" | awk '{print $NF}')
    die "cổng 127.0.0.1:6381 đang bận bởi tiến trình PID=$pid (dừng tiến trình đó trước khi bật main)"
  fi
}

wait_ping() {
  local i
  for i in $(seq 50); do
    docker exec "$1" redis-cli PING 2>/dev/null | grep -q PONG && return 0
    sleep 0.2
  done
  die "$1 không trả PONG sau 10 s"
}

ensure_net() {
  [ "$NET" = "advance-be-k2l04" ] || die "sai tên network: $NET"
  docker network inspect "$NET" >/dev/null 2>&1 || { docker network create "$NET" >/dev/null && say "+ network $NET"; }
}

up_one() {
  local n="$1" why
  assert_ct "$n"
  spec "$n"
  ensure_net
  if exists "$n"; then
    why=$(drift "$n")
    if [ -z "$why" ]; then
      if ! running "$n"; then
        [ "$n" = "$MAIN" ] && check_port_6381_free
        docker start "$n" >/dev/null
      fi
      wait_ping "$n"
      say "✔ $n đã đúng bảng, đang chạy"
      return 0
    fi
    say "! $n lệch bảng: $why"
    if [ "$RECREATE" = 0 ]; then
      local u="${n#advance-be-k2l04-}"
      [ "$n" = "$MAIN" ] && u=main
      die "container $n lệch bảng; truyền rõ --recreate nếu đồng ý tạo lại: bash labs/k2-lesson-04-caching/00-containers.sh up $u --recreate"
    fi
    if running "$n"; then
      [ "$n" = "$MAIN" ] && docker exec "$n" redis-cli SAVE >/dev/null 2>&1
      docker stop -t 15 "$n" >/dev/null # guard-main
    fi
    docker rm -v "$n" >/dev/null # guard-main
    say "  → tạo lại $n"
  fi
  [ "$n" = "$MAIN" ] && check_port_6381_free
  docker run -d --name "$n" --network "$NETW" "${PUB[@]}" "${VOLS[@]}" "$IMG" "${ARGS[@]}" >/dev/null || die "docker run $n thất bại"
  wait_ping "$n"
  say "+ $n tạo mới, đang chạy"
}

up_cluster() {
  up_one "$CLUSTER"
  local i
  if ! docker exec "$CLUSTER" redis-cli CLUSTER INFO | grep -q '^cluster_slots_assigned:16384'; then
    docker exec "$CLUSTER" redis-cli CLUSTER ADDSLOTSRANGE 0 16383 >/dev/null
  fi
  for i in $(seq 50); do
    docker exec "$CLUSTER" redis-cli CLUSTER INFO | grep -q '^cluster_state:ok' && break
    sleep 0.2
  done
  say "  cluster: $(docker exec "$CLUSTER" redis-cli CLUSTER INFO | tr -d '\r' | grep -E '^(cluster_state|cluster_slots_assigned):' | paste -sd' ' -)"
}

down_one() {
  local n="$1" v="${1}-data"
  assert_ct "$n"
  assert_vol "$v"
  [ "$n" = "$MAIN" ] && die "down không xóa main (dùng 99-cleanup.sh --all nếu thật sự muốn)"
  if exists "$n"; then
    docker rm -f "$n" >/dev/null && say "- đã xóa container $n"
  else
    say "– $n không có"
  fi
  if docker volume inspect "$v" >/dev/null 2>&1; then
    docker volume rm "$v" >/dev/null && say "- đã xóa volume $v"
  fi
}

reset_main() {
  running "$MAIN" || die "main chưa chạy · bash labs/k2-lesson-04-caching/00-containers.sh up main"
  local kv
  for kv in "maxmemory 0" "maxmemory-policy noeviction" "hash-max-listpack-entries 512" "zset-max-listpack-entries 128" "hll-sparse-max-bytes 3000" "appendonly no"; do
    docker exec "$MAIN" redis-cli CONFIG SET ${kv} >/dev/null # guard-main
  done
  say "✔ main: maxmemory 0, noeviction, hash-listpack 512, zset-listpack 128, hll-sparse 3000"
}

status() {
  local n
  for n in "$MAIN" "$CLUSTER" "$CRASH"; do
    if exists "$n"; then
      spec "$n"
      local why; why=$(drift "$n")
      say "$n · $(docker inspect -f '{{.State.Status}}' "$n") · ${why:-đúng bảng}"
    else
      say "$n · chưa có"
    fi
  done
}

case "${1:-} ${2:-}" in
  "up main") up_one "$MAIN" ;;
  "up cluster") up_cluster ;;
  "up crash") up_one "$CRASH" ;;
  "down cluster") down_one "$CLUSTER" ;;
  "down crash") down_one "$CRASH" ;;
  "reset main") reset_main ;;
  "status ") status ;;
  *) die "cú pháp: up <main|cluster|crash> [--recreate] | down <cluster|crash> | reset main | status" ;;
esac
