#!/usr/bin/env bash
export MSYS_NO_PATHCONV=1
# K2 Bài 04 · Dọn dẹp môi trường lab (không dùng bất kỳ lệnh dọn rác diện rộng nào của docker).
#   bash labs/k2-lesson-04-caching/99-cleanup.sh        # xóa khóa chạy thử trên main (giữ seed, my, hw) và xóa container phụ cluster/crash
#   bash labs/k2-lesson-04-caching/99-cleanup.sh --all  # thêm: xóa main, volume advance-be-k2l04-redis-data và network advance-be-k2l04 (nếu trống)
set -u
HERE="$(cd "$(dirname "$0")" && pwd -W)"
MAIN=advance-be-k2l04-redis
NET=advance-be-k2l04
MAIN_VOL=advance-be-k2l04-redis-data
ALL=0
case "${1:-}" in --all) ALL=1 ;; "") ;; *) echo "✘ cờ lạ: $1 (chỉ hỗ trợ --all)"; exit 2 ;; esac

assert_ct() {
  case "$1" in
    advance-be-k2l04-redis|advance-be-k2l04-cluster|advance-be-k2l04-crash) ;;
    *) echo "✘ từ chối container ngoài K2L04: $1"; exit 2 ;;
  esac
}

assert_vol() {
  case "$1" in
    advance-be-k2l04-redis-data|advance-be-k2l04-cluster-data|advance-be-k2l04-crash-data) ;;
    *) echo "✘ từ chối volume ngoài K2L04: $1"; exit 2 ;;
  esac
}

if [ "$(docker inspect -f '{{.State.Running}}' "$MAIN" 2>/dev/null)" = "true" ]; then
  n=$(docker exec "$MAIN" sh -c "redis-cli --scan --pattern 'k2l04:*' | grep -v -e '^k2l04:my:' -e '^k2l04:hw:' -e '^k2l04:seed:' | wc -l" | tr -d ' \r')
  docker exec "$MAIN" sh -c "redis-cli --scan --pattern 'k2l04:*' | grep -v -e '^k2l04:my:' -e '^k2l04:hw:' -e '^k2l04:seed:' | xargs -r -n 100 redis-cli UNLINK" >/dev/null
  echo "- main: đã UNLINK ${n:-0} khóa thực nghiệm (giữ nguyên k2l04:my:*, k2l04:hw:*, k2l04:seed:*)"
  bash "$HERE/00-containers.sh" reset main
fi

for x in cluster crash; do
  ct="advance-be-k2l04-$x"
  vol="${ct}-data"
  assert_ct "$ct"
  assert_vol "$vol"
  if docker container inspect "$ct" >/dev/null 2>&1; then
    docker rm -f "$ct" >/dev/null && echo "- đã xóa container $ct"
  fi
  if docker volume inspect "$vol" >/dev/null 2>&1; then
    docker volume rm "$vol" >/dev/null && echo "- đã xóa volume $vol"
  fi
done

if [ "$ALL" = 1 ]; then
  assert_ct "$MAIN"
  assert_vol "$MAIN_VOL"
  if docker container inspect "$MAIN" >/dev/null 2>&1; then
    docker rm -f "$MAIN" >/dev/null && echo "- đã xóa container $MAIN" # guard-main
  fi
  if docker volume inspect "$MAIN_VOL" >/dev/null 2>&1; then
    docker volume rm "$MAIN_VOL" >/dev/null && echo "- đã xóa volume $MAIN_VOL"
  fi
  if docker network inspect "$NET" >/dev/null 2>&1; then
    if [ "$(docker network inspect -f '{{len .Containers}}' "$NET")" = "0" ]; then
      docker network rm "$NET" >/dev/null && echo "- đã xóa network $NET"
    else
      echo "– giữ network $NET (còn container khác đang gắn)"
    fi
  fi
fi
echo "✔ dọn xong K2L04"
