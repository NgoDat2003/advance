#!/usr/bin/env bash
export MSYS_NO_PATHCONV=1
# Bài 06 · Dọn lab (rollback). KHÔNG chạy khi đang học; chỉ khi muốn trả máy về như trước bài 06.
#   bash labs/lesson-06-redis/99-cleanup.sh         # xóa khóa l06:* trên main (trừ l06:my:* và l06:hw:*), trả cấu hình main,
#                                                   # xóa các container phụ advance-be-redis-<x> theo đúng tên
#   bash labs/lesson-06-redis/99-cleanup.sh --all   # thêm: xóa main, volume dữ liệu của main, và network advance-be-l06
#                                                   # (network chỉ bị xóa khi không còn container nào gắn vào)
# Khóa của bạn (l06:my:*) và bài tập (l06:hw:*) không bao giờ bị xóa. Không dùng bất kỳ lệnh dọn rác hàng loạt nào của docker.
set -u
HERE="$(cd "$(dirname "$0")" && pwd -W)"
MAIN=advance-be-redis
NET=advance-be-l06
DATA=advance-be-redis-data
ALL=0
case "${1:-}" in --all) ALL=1 ;; "") ;; *) echo "cờ lạ: $1 (chỉ có --all)"; exit 2 ;; esac

if [ "$(docker inspect -f '{{.State.Running}}' "$MAIN" 2>/dev/null)" = "true" ]; then
  # SCAN (không phải KEYS) rồi UNLINK theo lô 100 khóa; bỏ qua l06:my:* và l06:hw:*.
  n=$(docker exec "$MAIN" sh -c "redis-cli --scan --pattern 'l06:*' | grep -v -e '^l06:my:' -e '^l06:hw:' | wc -l")
  docker exec "$MAIN" sh -c "redis-cli --scan --pattern 'l06:*' | grep -v -e '^l06:my:' -e '^l06:hw:' | xargs -r -n 100 redis-cli UNLINK" >/dev/null
  echo "- main: đã UNLINK $n khóa l06:* (giữ l06:my:*, l06:hw:*)"
  bash "$HERE/00-containers.sh" reset main
fi

for x in evict rdb aof replica cluster; do
  n="advance-be-redis-$x"
  if docker container inspect "$n" >/dev/null 2>&1; then docker rm -f -v "$n" >/dev/null && echo "- đã xóa $n"; fi
done

if [ "$ALL" = 1 ]; then
  if docker container inspect "$MAIN" >/dev/null 2>&1; then docker rm -f -v "$MAIN" >/dev/null && echo "- đã xóa $MAIN"; fi # guard-main
  if docker volume inspect "$DATA" >/dev/null 2>&1; then docker volume rm "$DATA" >/dev/null && echo "- đã xóa volume $DATA"; fi
  if docker network inspect "$NET" >/dev/null 2>&1; then
    if [ "$(docker network inspect -f '{{len .Containers}}' "$NET")" = "0" ]; then docker network rm "$NET" >/dev/null && echo "- đã xóa network $NET"
    else echo "– giữ network $NET (còn container khác gắn vào)"; fi
  fi
fi
echo "✔ dọn xong"
