#!/usr/bin/env bash
export MSYS_NO_PATHCONV=1
# Dấu vân tay Docker của controller (KHÔNG phải công cụ học viên, không file nào trong labs/ gọi tới).
# Mục đích: chứng minh bài 06 không đụng container nào ngoài advance-be-redis*.
# Chỉ dùng các trường của `docker ps -a` (ID, Image, Names, Status). Không gọi `docker inspect`,
# không đọc Config/Env, nên không có bí mật nào lọt ra file. Tên container chỉ dùng trong bộ nhớ
# để lọc bỏ container lab, không bao giờ được ghi ra.
#
# Dùng:
#   bash verify/fingerprint.sh > runs/00-fingerprint-before.txt
#   bash verify/fingerprint.sh --compare runs/00-fingerprint-before.txt; echo rc=$?
set -u
MAIN=advance-be-redis

# Mỗi container KHÔNG phải lab: sha256(id|image)|Up hoặc |Exited (chỉ lấy chữ đầu của Status,
# nên Docker Desktop khởi động lại không làm đổi dòng).
hash_lines() {
  docker ps -a --no-trunc --format '{{.ID}}|{{.Image}}|{{.Names}}|{{.Status}}' |
  while IFS='|' read -r id image names status; do
    case "$names" in advance-be-redis*) continue ;; esac
    h=$(printf '%s' "$id|$image" | sha256sum | cut -d' ' -f1)
    printf '%s|%s\n' "$h" "${status%% *}"
  done | sort
}

# run_id qua TCP từ máy host tới 127.0.0.1:6379 (node, vì host không có redis-cli).
host_run_id() {
  node -e "const s=require('net').connect(6379,'127.0.0.1');let b='';s.setTimeout(3000,()=>{s.destroy();process.exit(1)});s.on('data',d=>{b+=d;const m=b.match(/run_id:(\w+)/);if(m){console.log(m[1]);s.destroy();}});s.on('error',()=>process.exit(1));s.write('INFO server\r\n');" 2>/dev/null
}

fingerprint() {
  local lines count bound lab bind cid hid
  lines=$(hash_lines)
  echo "# fingerprint v1 · sha256(id|image)|status cho mọi container không phải advance-be-redis*"
  [ -n "$lines" ] && printf '%s\n' "$lines"
  count=$(printf '%s' "$lines" | grep -c . || true)
  echo "count=$count"
  if netstat -ano 2>/dev/null | grep ':6380 ' | grep -q LISTENING; then bound=bound; else bound=free; fi
  echo "port6380=$bound"
  lab=$(docker ps --filter publish=6380 --filter name=advance-be-redis --format '{{.Names}}' | paste -sd, -)
  echo "port6380_lab=${lab:-none}"
  bind=$(docker port "$MAIN" 6379 2>/dev/null | tr -d '\r' | paste -sd, -)
  echo "main_bind=${bind:-none}"
  cid=$(docker exec "$MAIN" redis-cli INFO server 2>/dev/null | tr -d '\r' | sed -n 's/^run_id://p')
  hid=$(host_run_id)
  if [ -n "$cid" ] && [ "$cid" = "$hid" ]; then echo "run_id_match=yes"; else echo "run_id_match=no"; fi
}

if [ "${1:-}" = "--compare" ]; then
  before="${2:?cần đường dẫn file before}"
  [ -f "$before" ] || { echo "✘ không có file $before"; exit 1; }
  now=$(fingerprint)
  rc=0
  # Mỗi dòng hash của baseline phải còn nguyên (cùng trạng thái). Container mới được phép.
  while IFS= read -r l; do
    case "$l" in *'|'*) ;; *) continue ;; esac
    if ! printf '%s\n' "$now" | grep -qxF "$l"; then
      echo "✘ container baseline thay đổi hoặc biến mất: ${l%%|*}"; rc=1
    fi
  done < <(tr -d '\r' < "$before")
  new=$(printf '%s\n' "$now" | grep '|' | grep -vxFf <(tr -d '\r' < "$before" | grep '|') | grep -c . || true)
  [ "$new" -gt 0 ] && echo "info: +$new new container(s)"
  lab=$(printf '%s\n' "$now" | sed -n 's/^port6380_lab=//p')
  [ "$lab" = "none" ] || { echo "✘ container lab đang publish 6380: $lab"; rc=1; }
  b6=$(tr -d '\r' < "$before" | sed -n 's/^port6380=//p'); n6=$(printf '%s\n' "$now" | sed -n 's/^port6380=//p')
  [ "$b6" != "$n6" ] && echo "info: port6380 $b6 → $n6 (không phải container lab; OmniPOS hub có thể dùng hợp lệ)"
  bind=$(printf '%s\n' "$now" | sed -n 's/^main_bind=//p')
  [ "$bind" = "127.0.0.1:6379" ] || { echo "✘ main_bind=$bind (cần 127.0.0.1:6379)"; rc=1; }
  printf '%s\n' "$now" | grep -qx 'run_id_match=yes' || { echo "✘ run_id_match=no (127.0.0.1:6379 không phải advance-be-redis)"; rc=1; }
  [ $rc -eq 0 ] && echo "✔ fingerprint khớp baseline"
  exit $rc
fi

fingerprint
