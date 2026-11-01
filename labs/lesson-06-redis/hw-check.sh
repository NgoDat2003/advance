#!/usr/bin/env bash
export MSYS_NO_PATHCONV=1
# Bài 06 · Tự chấm bài tập (slide 43): 2 request cùng lúc đặt ghế A34_S012C chuyến FA634, chỉ dùng Redis.
#
# Hợp đồng chương trình của bạn (viết bằng ngôn ngữ nào cũng được):
#   - Mỗi lần chạy, chương trình bắn ĐÚNG 2 request đồng thời cho cùng ghế rồi thoát.
#   - Khóa:           l06:hw:lock:FA634:A34_S012C   (giá trị = token riêng của request)
#   - Sổ đặt chỗ:     RPUSH l06:hw:bookings:FA634 "A34_S012C <token>"   khi đặt thành công
#   - Nhật ký:        RPUSH l06:hw:log "BOOKED <token>"  hoặc  "REJECTED <token>"
#   - Biến môi trường phải tôn trọng: HW_TTL_MS (TTL khóa, ms, mặc định 2000), HOLD_MS (giữ khóa bao lâu, mặc định 100),
#     REDIS_URL (mặc định redis://127.0.0.1:6379 — dùng 127.0.0.1, không dùng localhost).
#
# Cách chạy (Git Bash, đứng ở đâu cũng được):
#   bash labs/lesson-06-redis/hw-check.sh                       # chấm lời giải mẫu: node hw-solution.mjs
#   HW_CMD="node my-solution.mjs" bash labs/lesson-06-redis/hw-check.sh
#   bash labs/lesson-06-redis/hw-check.sh --rounds 20           # số vòng thường (mặc định 10), cộng 1 vòng kiểm H5
#   bash labs/lesson-06-redis/hw-check.sh --cleanup             # chỉ xóa các khóa l06:hw:*
# Kết quả: ✔/✘ H1..H5. Mã thoát = số dòng ✘.
#   H1 mỗi vòng sổ đặt chỗ tăng đúng 1      H2 mỗi vòng nhật ký có 1 BOOKED và 1 REJECTED
#   H3 hết vòng không còn khóa              H4 giá trị khóa = token riêng mỗi lần giữ: mọi token trong nhật ký khác nhau
#                                              (2 × số vòng), và ở vòng H5 giá trị khóa đọc được = token của dòng BOOKED
#   H5 trả khóa kiểu compare-and-delete: vòng 11 (HW_TTL_MS=50 HOLD_MS=200) khóa của request 1 hết hạn giữa chừng,
#      script này đóng vai "người giữ khóa thứ hai". ✔ chỉ khi: script thấy khóa của chương trình với PTTL ≤ 50 ms
#      (tôn trọng HW_TTL_MS), lấy được khóa sau khi nó hết hạn, chương trình thoát mã 0, và sau khi chương trình trả khóa,
#      token hw-check-holder2 vẫn còn.
set -u
HERE="$(cd "$(dirname "$0")" && pwd -W)"
MAIN=advance-be-redis
LOCK=l06:hw:lock:FA634:A34_S012C
BOOKINGS=l06:hw:bookings:FA634
LOG=l06:hw:log
HW_CMD="${HW_CMD:-node $HERE/hw-solution.mjs}"
ROUNDS=10
CLEANUP=0
while [ $# -gt 0 ]; do
  case "$1" in
    --rounds) ROUNDS="${2:?cần số vòng}"; shift 2 ;;
    --cleanup) CLEANUP=1; shift ;;
    *) echo "cờ lạ: $1"; exit 2 ;;
  esac
done
rcli() { docker exec "$MAIN" redis-cli "$@" | tr -d '\r'; }
hw_clear() { docker exec "$MAIN" sh -c "redis-cli --scan --pattern 'l06:hw:*' | xargs -r redis-cli UNLINK" | tr -d '\r'; }

# C15: 127.0.0.1:6379 phía máy host phải đúng là container main (chương trình của bạn nối vào địa chỉ này).
cid=$(rcli INFO server | sed -n 's/^run_id://p')
hid=$(node -e "const s=require('net').connect(6379,'127.0.0.1');let b='';s.setTimeout(3000,()=>{s.destroy();process.exit(1)});s.on('data',d=>{b+=d;const m=b.match(/run_id:(\w+)/);if(m){console.log(m[1]);s.destroy();}});s.on('error',()=>process.exit(1));s.write('INFO server\r\n');" 2>/dev/null)
if [ -z "$cid" ] || [ "$cid" != "$hid" ]; then
  echo "dừng: 127.0.0.1:6379 không phải $MAIN (run_id container=${cid:0:8} host=${hid:0:8}) · chạy: bash labs/lesson-06-redis/00-containers.sh up main"
  exit 9
fi

if [ "$CLEANUP" = 1 ]; then n=$(rcli --scan --pattern 'l06:hw:*' | grep -c .); hw_clear >/dev/null; echo "đã xóa $n khóa l06:hw:* · còn $(rcli --scan --pattern 'l06:hw:*' | grep -c .)"; exit 0; fi

hw_clear >/dev/null
echo "chấm: HW_CMD=$HW_CMD · $ROUNDS vòng + vòng H5"
h1=0; h2=0; h3=0; alltoks=""
for r in $(seq "$ROUNDS"); do
  b0=$(rcli LLEN "$BOOKINGS"); l0=$(rcli LLEN "$LOG")
  if ! out=$(HW_TTL_MS=2000 HOLD_MS=100 bash -c "$HW_CMD" 2>&1); then echo "vòng $r: HW_CMD lỗi: $(printf '%s' "$out" | tail -2 | paste -sd' ' -)"; fi
  b1=$(rcli LLEN "$BOOKINGS")
  entries=$(rcli LRANGE "$LOG" "$l0" -1)
  nb=$(printf '%s\n' "$entries" | grep -c '^BOOKED ')
  nr=$(printf '%s\n' "$entries" | grep -c '^REJECTED ')
  toks=$(printf '%s\n' "$entries" | awk 'NF==2{print $2}' | sort -u | grep -c .)
  alltoks="$alltoks$(printf '%s\n' "$entries" | awk 'NF==2{print $2}')
"
  lk=$(rcli EXISTS "$LOCK")
  [ $((b1 - b0)) -eq 1 ] && h1=$((h1 + 1))
  [ "$nb" = 1 ] && [ "$nr" = 1 ] && h2=$((h2 + 1))
  [ "$lk" = 0 ] && h3=$((h3 + 1))
  echo "vòng $r: sổ +$((b1 - b0)), BOOKED=$nb REJECTED=$nr, khóa còn=$lk, token khác nhau=$toks"
  rcli DEL "$LOCK" >/dev/null # khóa sót (nếu có) không được làm hỏng vòng sau
done

# Vòng H5: khóa 50 ms hết hạn khi request 1 còn giữ 200 ms. Vòng lặp chạy TRONG container (mỗi lần redis-cli vài ms):
#   1) đọc PTTL + GET khóa cho tới khi khóa xuất hiện (ghi lại số vòng chờ, PTTL và token lúc thấy lần đầu),
#   2) đợi khóa hết hạn, 3) lập tức SET NX khóa với token hw-check-holder2, 4) in một dòng kết quả.
# Dòng "ready" báo vòng lặp đã chạy; chỉ khi đó mới khởi động chương trình (chương trình chạy nhanh cũng không lọt).
exec 3< <(docker exec "$MAIN" sh -c 'i=0; p=-2; v=; r=; echo ready; while [ $i -lt 3000 ]; do set -- $(printf "PTTL l06:hw:lock:FA634:A34_S012C\nGET l06:hw:lock:FA634:A34_S012C\n" | redis-cli); p=${1:--2}; v=${2:-}; [ "$p" != -2 ] && break; i=$((i+1)); done; if [ $i -lt 3000 ]; then j=0; while [ "$(redis-cli EXISTS l06:hw:lock:FA634:A34_S012C)" = 1 ] && [ $j -lt 6000 ]; do j=$((j+1)); done; r=$(redis-cli SET l06:hw:lock:FA634:A34_S012C hw-check-holder2 NX PX 5000); fi; echo "seen=$i pttl=$p tok=${v:-none} set=${r:-nil}"')
read -r -t 15 ready <&3 || ready=""
h5run=1; h5=""
l0=$(rcli LLEN "$LOG")
if [ "$ready" != ready ]; then h5run=0; echo "vòng H5: không khởi động được vòng quan sát trong container"
elif ! out=$(HW_TTL_MS=50 HOLD_MS=200 bash -c "$HW_CMD" 2>&1); then h5run=0; echo "vòng H5: HW_CMD lỗi: $(printf '%s' "$out" | tail -2 | paste -sd' ' -)"; fi
read -r -t 40 h5 <&3 || h5=""
exec 3<&-
after=$(rcli GET "$LOCK")
booked=$(rcli LRANGE "$LOG" "$l0" -1 | sed -n 's/^BOOKED //p')
seen=$(printf '%s' "$h5" | sed -n 's/.*seen=\([0-9]*\).*/\1/p'); pttl=$(printf '%s' "$h5" | sed -n 's/.*pttl=\(-\{0,1\}[0-9]*\).*/\1/p')
htok=$(printf '%s' "$h5" | sed -n 's/.*tok=\([^ ]*\).*/\1/p'); hset=$(printf '%s' "$h5" | sed -n 's/.*set=\([^ ]*\).*/\1/p')
echo "vòng H5: người giữ thứ hai ${h5:-(không có kết quả)} · khóa sau khi chương trình trả = ${after:-(trống)}"
rcli DEL "$LOCK" >/dev/null

# H4: mọi token trong nhật ký các vòng thường khác nhau, và giá trị khóa (thấy ở vòng H5) đúng là token của một dòng BOOKED.
ntok=$(printf '%s' "$alltoks" | grep -c .); udist=$(printf '%s' "$alltoks" | grep . | sort -u | grep -c .)
h4why=""
{ [ "$ntok" -eq $((2 * ROUNDS)) ] && [ "$udist" -eq "$ntok" ]; } || h4why="$h4why $udist token khác nhau / $ntok dòng nhật ký (cần $((2 * ROUNDS)));"
{ [ -n "$htok" ] && printf '%s\n' "$booked" | grep -qxF -- "$htok"; } || h4why="$h4why vòng H5 khóa mang ${htok:-?}, không phải token của dòng BOOKED nào;"
# H5: chỉ ✔ khi thật sự quan sát được khóa của chương trình với TTL đúng, lấy được khóa thứ hai, và chương trình không xóa nó.
h5why=""
[ "$h5run" = 1 ] || h5why="$h5why chương trình lỗi hoặc không chạy;"
{ [ -n "$seen" ] && [ "$seen" -lt 3000 ]; } || h5why="$h5why holder không thấy khóa;"
{ [ -n "$pttl" ] && [ "$pttl" -ge 0 ] && [ "$pttl" -le 50 ]; } || h5why="$h5why TTL không tôn trọng HW_TTL_MS=50 (PTTL lúc thấy = ${pttl:-?});"
[ "$hset" = OK ] || h5why="$h5why holder không lấy được khóa sau khi hết hạn (set=${hset:-?});"
[ "$after" = hw-check-holder2 ] || h5why="$h5why khóa sau cùng = ${after:-(trống: bị xóa mất)} (cần hw-check-holder2);"

bad=0
row() { if [ "$1" = ok ]; then echo "✔ $2"; else echo "✘ $2"; bad=$((bad + 1)); fi; }
row "$([ $h1 -eq "$ROUNDS" ] && echo ok)" "H1 sổ đặt chỗ tăng đúng 1 mỗi vòng · $h1/$ROUNDS vòng"
row "$([ $h2 -eq "$ROUNDS" ] && echo ok)" "H2 mỗi vòng 1 BOOKED + 1 REJECTED · $h2/$ROUNDS vòng"
row "$([ $h3 -eq "$ROUNDS" ] && echo ok)" "H3 không còn khóa sau mỗi vòng · $h3/$ROUNDS vòng"
row "$([ -z "$h4why" ] && echo ok)" "H4 giá trị khóa = token riêng mỗi lần giữ ·${h4why:- $udist/$ntok token khác nhau, khóa vòng H5 = token BOOKED}"
if [ -z "$h5why" ]; then row ok "H5 trả khóa compare-and-delete · thấy khóa PTTL $pttl ms, khóa sau cùng = hw-check-holder2"
else row no "H5 không kiểm được hoặc sai (holder không thấy khóa / TTL không tôn trọng / chương trình lỗi / khóa bị xóa) ·$h5why"; fi
exit "$bad"
