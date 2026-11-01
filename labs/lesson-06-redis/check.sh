#!/usr/bin/env bash
export MSYS_NO_PATHCONV=1
# Bài 06 · Kiểm tra trạng thái lab Redis. Chạy bao nhiêu lần cũng được.
# Cách chạy (Git Bash, đứng ở đâu cũng được): bash labs/lesson-06-redis/check.sh
# Mỗi dòng: "✔ Cnn mô tả · chi tiết" = đạt, "✘" = chưa đạt (có gợi ý sửa), "–" = container tùy chọn chưa bật (không tính lỗi).
# Mã thoát = số dòng ✘. Script chỉ đọc, trừ C12 ghi một khóa l06:exp:c12 ở db 15, tự hết hạn sau 50 ms.
set -u
HERE="$(cd "$(dirname "$0")" && pwd -W)"
MAIN=advance-be-redis
NET=advance-be-l06
IMG=redis:7.2.3
bad=0

row() { # $1 = ✔|✘|–, $2 = mã, $3 = mô tả, $4 = chi tiết
  echo "$1 $2 $3 · $4"
  if [ "$1" = "✘" ]; then bad=$((bad + 1)); fi
}
exists() { docker container inspect "$1" >/dev/null 2>&1; }
running() { [ "$(docker inspect -f '{{.State.Running}}' "$1" 2>/dev/null)" = "true" ]; }
cmd_json() { docker inspect -f '{{json .Config.Cmd}}' "$1" 2>/dev/null; }
nets() { docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' "$1" 2>/dev/null; }
rcli() { docker exec "$MAIN" redis-cli "$@" 2>/dev/null | tr -d '\r'; }
# has_args '<json Cmd>' a b c → đúng khi Cmd chứa liền nhau "a","b","c"
has_args() {
  local s=",${1#[}" pat="," a; shift
  s="${s%]},"
  for a in "$@"; do pat="$pat\"$a\","; done
  case "$s" in *"$pat"*) return 0 ;; *) return 1 ;; esac
}
# Chuẩn hóa đường dẫn mount để so sánh: chữ thường, dấu /, bỏ tiền tố Docker Desktop.
norm() { printf '%s' "$1" | tr '\\' '/' | tr 'A-Z' 'a-z' | sed -e 's#^/run/desktop/mnt/host/\([a-z]\)/#\1:/#' -e 's#/$##'; }
cfg() { rcli CONFIG GET "$1" | sed -n 2p; }

# ---------- C01: container main ----------
main_ok=0
if ! exists "$MAIN"; then
  row "✘" C01 "main $MAIN" "chưa có container · chạy: bash labs/lesson-06-redis/00-containers.sh up main"
else
  why=""
  img=$(docker inspect -f '{{.Config.Image}}' "$MAIN")
  [ "$img" = "$IMG" ] || why="$why image=$img (cần $IMG);"
  running "$MAIN" || why="$why container đang dừng;"
  j=$(cmd_json "$MAIN")
  has_args "$j" --appendonly no || why="$why thiếu --appendonly no;"
  has_args "$j" --enable-debug-command local || why="$why thiếu --enable-debug-command local;"
  case " $(nets "$MAIN") " in *" $NET "*) ;; *) why="$why chưa vào network $NET;" ;; esac
  src=$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/lab"}}{{.Source}}|{{.RW}}{{end}}{{end}}' "$MAIN")
  if [ -z "$src" ]; then why="$why chưa mount /lab;"
  else
    [ "$(norm "${src%|*}")" = "$(norm "$HERE")" ] || why="$why /lab mount từ ${src%|*} (cần $HERE);"
    [ "${src#*|}" = "false" ] || why="$why /lab phải read-only (:ro);"
  fi
  if running "$MAIN"; then
    ver=$(rcli INFO server | sed -n 's/^redis_version://p')
    [ "$ver" = "7.2.3" ] || why="$why redis_version=$ver;"
  fi
  if [ -z "$why" ]; then row "✔" C01 "main $MAIN" "$IMG, redis_version:7.2.3, debug local, network $NET, /lab ro"; main_ok=1
  else row "✘" C01 "main $MAIN" "${why# } · sửa: bash labs/lesson-06-redis/00-containers.sh up main"; fi
fi

# ---------- C02–C06: container tùy chọn (chưa bật = –) ----------
extra() { # $1 mã, $2 tên, $3 network, $4 lệnh bật, rồi các nhóm cờ dạng "a b c" phải có trong Cmd
  local code="$1" name="$2" net="$3" up="$4" why="" g; shift 4
  if ! exists "$name"; then row "–" "$code" "$name" "chưa bật (tùy chọn) · khi tới chặng: bash labs/lesson-06-redis/00-containers.sh up $up"; return; fi
  [ "$(docker inspect -f '{{.Config.Image}}' "$name")" = "$IMG" ] || why="$why image khác $IMG;"
  running "$name" || why="$why đang dừng;"
  local j; j=$(cmd_json "$name")
  for g in "$@"; do
    # "--save ''" là cờ có tham số rỗng nên phải truyền riêng; các nhóm khác tách theo khoảng trắng.
    if [ "$g" = "--save ''" ]; then has_args "$j" --save "" || why="$why thiếu --save \"\";"
    else has_args "$j" $g || why="$why thiếu $g;"; fi
  done
  case " $(nets "$name") " in *" $net "*) ;; *) why="$why chưa vào network $net;" ;; esac
  if [ -z "$why" ]; then row "✔" "$code" "$name" "$IMG, đúng cờ, network $net"
  else row "✘" "$code" "$name" "${why# } · sửa: bash labs/lesson-06-redis/00-containers.sh up $up"; fi
}
extra C02 advance-be-redis-replica "$NET" replica "--replicaof advance-be-redis 6379" "--appendonly no" "--save ''"
extra C03 advance-be-redis-cluster "$NET" cluster "--cluster-enabled yes" "--cluster-config-file nodes.conf" "--appendonly no" "--save ''"
extra C04 advance-be-redis-evict bridge evict "--appendonly no" "--save ''"
extra C05 advance-be-redis-rdb bridge persist "--appendonly no" "--save ''"
extra C06 advance-be-redis-aof bridge persist "--appendonly yes" "--appendfsync everysec" "--save ''"

# ---------- C07–C13: dữ liệu và cấu hình trên main ----------
if ! running "$MAIN"; then
  for c in "C07 khóa ngoài l06:" "C08 seed user" "C09 seed cart" "C10 seed board" "C11 cấu hình mặc định" "C12 active expiry" "C13 không còn lock/barrier"; do
    row "✘" "${c%% *}" "${c#* }" "cần main đang chạy · bash labs/lesson-06-redis/00-containers.sh up main"
  done
else
  # C07: mọi khóa trên main phải có tiền tố l06: (Bài 02 lab 06 từng ghi imdb:* / lock:* vào container cùng tên).
  # Nhóm theo phần trước dấu ':' (khóa không có ':' đứng riêng, không thêm ':*'); gợi ý lệnh xóa cho nhóm đầu tiên.
  foreign=$(rcli --scan --count 1000 | grep -v '^l06:' | grep . | awk '{p=$0; if (index(p, ":")) {sub(/:.*/, "", p); p=p ":*"} print p}' | sort | uniq -c | sed 's/^ *\([0-9]*\) \(.*\)$/\2 \1/' | paste -sd, -)
  if [ -z "$foreign" ]; then row "✔" C07 "khóa ngoài l06:" "không có"
  else
    p=$(printf '%s' "$foreign" | cut -d, -f1 | sed 's/ [0-9]*$//')
    case "$p" in
      *':*') del="sh -c \"redis-cli --scan --pattern '$p' | xargs -r -d '\\n' -n 100 redis-cli UNLINK\"" ;;
      *) del="redis-cli UNLINK '$p'" ;;
    esac
    row "✘" C07 "khóa ngoài l06:" "$foreign · xóa đúng nhóm đó, ví dụ: docker exec $MAIN $del"
  fi
  # C08: user hash 4 trường listpack + bản JSON 51 ký tự (slide 30).
  enc=$(rcli OBJECT ENCODING l06:user:1); hl=$(rcli HLEN l06:user:1); jl=$(rcli STRLEN l06:user:1:json)
  if [ "$enc" = "listpack" ] && [ "$hl" = "4" ] && [ "$jl" = "51" ]; then row "✔" C08 "seed user" "l06:user:1 listpack 4 trường, l06:user:1:json 51 ký tự"
  else row "✘" C08 "seed user" "encoding=${enc:-không có} HLEN=$hl STRLEN json=$jl · chạy lại 00-seed.redis"; fi
  # C09: giỏ hàng 3 món.
  cl=$(rcli HLEN l06:cart:u1)
  if [ "$cl" = "3" ]; then row "✔" C09 "seed cart" "l06:cart:u1 có 3 món"; else row "✘" C09 "seed cart" "HLEN l06:cart:u1=$cl (cần 3) · chạy lại 00-seed.redis"; fi
  # C10: bảng best-seller 5 món.
  bl=$(rcli ZCARD l06:board:bestseller)
  if [ "$bl" = "5" ]; then row "✔" C10 "seed board" "l06:board:bestseller có 5 món"; else row "✘" C10 "seed board" "ZCARD=$bl (cần 5) · chạy lại 00-seed.redis"; fi
  # C11: cấu hình main đã trả về mặc định sau mỗi thí nghiệm.
  why=""
  for kv in "maxmemory 0" "maxmemory-policy noeviction" "lazyfree-lazy-user-del no" "slowlog-log-slower-than 10000" "latency-monitor-threshold 0" "appendonly no"; do
    v=$(cfg "${kv%% *}"); [ "$v" = "${kv#* }" ] || why="$why ${kv%% *}=$v;"
  done
  if [ -z "$why" ]; then row "✔" C11 "cấu hình mặc định" "maxmemory 0, noeviction, lazyfree-lazy-user-del no, slowlog 10000, latency 0, appendonly no"
  else row "✘" C11 "cấu hình mặc định" "${why# } · sửa: bash labs/lesson-06-redis/00-containers.sh reset main"; fi
  # C12: active expiry đang bật: khóa PX 50 tự biến mất khỏi INFO keyspace trong 1 s mà không cần ai đọc.
  # Thử trên db 15 (không lab nào dùng) để khóa TTL khác ở db 0 hết hạn đúng lúc này không làm sai số đếm.
  expires() { rcli INFO keyspace | sed -n 's/^db15:.*expires=\([0-9]*\).*/\1/p'; }
  e0=$(expires); rcli -n 15 SET l06:exp:c12 1 PX 50 >/dev/null; sleep 1; e1=$(expires)
  if [ "${e1:-0}" = "${e0:-0}" ]; then row "✔" C12 "active expiry" "khóa PX 50 tự hết hạn trong 1 s"
  else row "✘" C12 "active expiry" "expires ${e0:-0} → ${e1:-0} sau 1 s · sửa: docker exec advance-be-redis redis-cli DEBUG SET-ACTIVE-EXPIRE 1"; fi
  # C13: không còn khóa lock/barrier sót lại từ thí nghiệm hai terminal.
  lk=$(rcli --scan --pattern 'l06:lock:*' | grep -c .); br=$(rcli --scan --pattern 'l06:barrier:*' | grep -c .)
  if [ "$lk" = "0" ] && [ "$br" = "0" ]; then row "✔" C13 "không còn lock/barrier" "0 khóa l06:lock:*, 0 khóa l06:barrier:*"
  else row "✘" C13 "không còn lock/barrier" "l06:lock:*=$lk l06:barrier:*=$br · chạy lại region reset của chặng đó"; fi
fi

# ---------- C14: chỉ main publish cổng, và chỉ trên 127.0.0.1 ----------
why=""
if exists "$MAIN"; then
  pb=$(docker port "$MAIN" 2>/dev/null | tr -d '\r' | paste -sd, -)
  [ "$pb" = "6379/tcp -> 127.0.0.1:6379" ] || why="$why main publish: ${pb:-không có} (cần 127.0.0.1:6379);"
else why="$why chưa có main;"; fi
for n in $(docker ps -a --filter name=advance-be-redis- --format '{{.Names}}'); do
  [ -z "$(docker port "$n" 2>/dev/null)" ] || why="$why $n publish cổng;"
done
if [ -z "$why" ]; then row "✔" C14 "publish chỉ 127.0.0.1" "main 127.0.0.1:6379, container phụ không publish"
else row "✘" C14 "publish chỉ 127.0.0.1" "${why# } · sửa: bash labs/lesson-06-redis/00-containers.sh up main"; fi

# ---------- C15: 127.0.0.1:6379 từ máy host đúng là container main (DBX, bài tập, driver drill dùng địa chỉ này) ----------
host_run_id() {
  node -e "const s=require('net').connect(6379,'127.0.0.1');let b='';s.setTimeout(3000,()=>{s.destroy();process.exit(1)});s.on('data',d=>{b+=d;const m=b.match(/run_id:(\w+)/);if(m){console.log(m[1]);s.destroy();}});s.on('error',()=>process.exit(1));s.write('INFO server\r\n');" 2>/dev/null
}
cid=""; running "$MAIN" && cid=$(rcli INFO server | sed -n 's/^run_id://p')
hid=$(host_run_id)
if [ -n "$cid" ] && [ "$cid" = "$hid" ]; then row "✔" C15 "127.0.0.1:6379 là main" "run_id khớp (${cid:0:8}…)"
else row "✘" C15 "127.0.0.1:6379 là main" "run_id container=${cid:0:8} host=${hid:0:8} · tiến trình khác giữ cổng 6379 hoặc main chưa chạy"; fi

exit "$bad"
