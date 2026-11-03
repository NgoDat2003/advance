#!/usr/bin/env bash
export MSYS_NO_PATHCONV=1
# K2 Bài 04 · Tự chấm bài tập Lua Token Bucket (H0–H8).
# Mặc định chấm lời giải mẫu; chấm bài của bạn bằng:
#   HW_LUA=labs/k2-lesson-04-caching/hw/token-bucket.lua bash labs/k2-lesson-04-caching/hw-check.sh
# Chỉ xóa tiền tố k2l04:hw:*, tuyệt đối không đụng k2l04:my:* hay bất kỳ khóa nào khác.
set -u
HERE="$(cd "$(dirname "$0")" && pwd -W)"
MAIN=advance-be-k2l04-redis
HW_LUA="${HW_LUA:-$HERE/hw/solution.lua}"
bad=0

row() {
  echo "$1 $2 $3 · $4"
  if [ "$1" = "✘" ]; then bad=$((bad + 1)); fi
}

case "$MAIN" in
  advance-be-k2l04-redis) ;;
  *) echo "✘ từ chối container ngoài K2L04: $MAIN"; exit 2 ;;
esac

if [ "$(docker inspect -f '{{.State.Running}}' "$MAIN" 2>/dev/null)" != "true" ]; then
  echo "✘ $MAIN chưa chạy · chạy: bash labs/k2-lesson-04-caching/00-containers.sh up main"
  exit 2
fi

if [ ! -f "$HW_LUA" ]; then
  echo "✘ không tìm thấy file Lua: $HW_LUA"
  exit 2
fi

lua_sha_file=$(sha256sum "$HW_LUA" | awk '{print $1}')
echo "# hw-lua-sha256=$lua_sha_file"

docker exec "$MAIN" sh -c "redis-cli --scan --pattern 'k2l04:hw:*' | xargs -r -n 100 redis-cli UNLINK" >/dev/null

# H0: SCRIPT LOAD
SHA=$(docker exec -i "$MAIN" redis-cli -x SCRIPT LOAD < "$HW_LUA" 2>&1 | tr -d '\r')
if [[ "$SHA" =~ ^[0-9a-f]{40}$ ]]; then
  row "✔" H0 "nạp script Lua" "SHA1=${SHA:0:12}…"
else
  row "✘" H0 "nạp script Lua" "lỗi cú pháp Lua: $SHA"
  exit "$bad"
fi

# H1 & H2: 30 lần gọi liên tiếp (T0 = 1000000, cap = 10, rate = 0.01) -> đúng 10 qua / 20 chặn, retry > 0 và lần chặn đầu [99000, 100000]
h12=$(docker exec "$MAIN" sh -c "
  ok=0; deny=0; bad_retry=0; first_retry=-1; err_msg=''
  for i in \$(seq 0 29); do
    ts=\$((1000000 + i))
    out=\$(redis-cli --no-raw EVALSHA '$SHA' 1 'k2l04:hw:tb:{s1}' 10 0.01 \"\$ts\" 2>&1 | tr -d '\r')
    if printf '%s\n' \"\$out\" | grep -q '^(error)'; then
      err_msg=\$(printf '%s\n' \"\$out\" | head -1)
      break
    fi
    vals=\$(printf '%s\n' \"\$out\" | sed -E 's/^[0-9]+\) //; s/^\(integer\) //; s/^\"(.*)\"\$/\1/' | paste -sd' ' -)
    set -- \$vals
    a=\${1:-}; r=\${3:-}
    if [ \"\$a\" = '1' ]; then ok=\$((ok+1))
    elif [ \"\$a\" = '0' ]; then
      deny=\$((deny+1))
      [ \"\$first_retry\" = '-1' ] && first_retry=\"\${r:-0}\"
      [ \"\${r:-0}\" -le 0 ] 2>/dev/null && bad_retry=\$((bad_retry+1))
    fi
  done
  echo \"err=\${err_msg}|ok=\$ok|deny=\$deny|first_retry=\$first_retry|bad_retry=\$bad_retry\"
" | tr -d '\r')

err_msg=$(printf '%s' "$h12" | sed -n 's/^err=\([^|]*\)|.*/\1/p')
ok_cnt=$(printf '%s' "$h12" | sed -n 's/.*|ok=\([0-9]*\)|.*/\1/p')
deny_cnt=$(printf '%s' "$h12" | sed -n 's/.*|deny=\([0-9]*\)|.*/\1/p')
first_r=$(printf '%s' "$h12" | sed -n 's/.*|first_retry=\([-0-9]*\)|.*/\1/p')
bad_r=$(printf '%s' "$h12" | sed -n 's/.*|bad_retry=\([0-9]*\)$/\1/p')

if [ -n "$err_msg" ]; then
  row "✘" H1 "30 request (cap 10, rate 0.01)" "chưa điền xong hoặc lỗi runtime: $err_msg"
  exit "$bad"
fi

if [ "$ok_cnt" = "10" ] && [ "$deny_cnt" = "20" ]; then
  row "✔" H1 "30 request (cap 10, rate 0.01)" "đúng 10 cho qua, 20 từ chối"
else
  row "✘" H1 "30 request (cap 10, rate 0.01)" "ok=$ok_cnt deny=$deny_cnt (cần 10 và 20)"
fi

if [ "$bad_r" = "0" ] && [ "$first_r" -ge 99000 ] && [ "$first_r" -le 100000 ]; then
  row "✔" H2 "retry_after_ms khi từ chối" "mọi lần chặn đều > 0, lần đầu=${first_r}ms"
else
  row "✘" H2 "retry_after_ms khi từ chối" "first_retry=${first_r}ms, số lần retry<=0 là $bad_r (cần [99000, 100000] và > 0)"
fi

# H6: PTTL của khóa s1 nằm trong (0, 1000000]
pttl=$(docker exec "$MAIN" redis-cli PTTL 'k2l04:hw:tb:{s1}' | tr -d '\r')
# Chấm H3, H4, H5 trước rồi in đúng thứ tự H3 -> H4 -> H5 -> H6 -> H7 -> H8

# H3: T0+29+100000 nạp đủ 1 token -> cho qua 1 lần rồi chặn lần kế
h3=$(docker exec "$MAIN" sh -c "
  r1=\$(redis-cli --raw EVALSHA '$SHA' 1 'k2l04:hw:tb:{s1}' 10 0.01 1100029 | head -1)
  r2=\$(redis-cli --raw EVALSHA '$SHA' 1 'k2l04:hw:tb:{s1}' 10 0.01 1100029 | head -1)
  echo \"\${r1}:\${r2}\"
" | tr -d '\r')
if [ "$h3" = "1:0" ]; then
  row "✔" H3 "nạp lại đúng tốc độ (T0+100029)" "lần 1 cho qua (1), lần 2 liền kề từ chối (0)"
else
  row "✘" H3 "nạp lại đúng tốc độ (T0+100029)" "kết quả=$h3 (cần 1:0)"
fi

# H4: đồng hồ lùi 100 000 ms không làm âm token và không kéo lùi last_ms
h4=$(docker exec "$MAIN" sh -c "
  redis-cli EVALSHA '$SHA' 1 'k2l04:hw:tb:{s4}' 10 0.1 1000000 >/dev/null
  redis-cli EVALSHA '$SHA' 1 'k2l04:hw:tb:{s4}' 10 0.1 900000 >/dev/null
  tok=\$(redis-cli HGET 'k2l04:hw:tb:{s4}' tokens)
  lms=\$(redis-cli HGET 'k2l04:hw:tb:{s4}' last_ms)
  awk -v t=\"\$tok\" -v l=\"\$lms\" 'BEGIN{print (t+0 >= 0 && l == \"1000000\") ? \"ok\" : \"bad:\" t \":\" l}'
" | tr -d '\r')
if [ "$h4" = "ok" ]; then
  row "✔" H4 "chống đồng hồ giật lùi" "tokens >= 0 và last_ms giữ nguyên 1000000"
else
  row "✘" H4 "chống đồng hồ giật lùi" "trạng thái=$h4 (cần clamp elapsed>=0 và giữ last_ms đơn điệu)"
fi

# H5: cửa hàng khác không bị ảnh hưởng
h5=$(docker exec "$MAIN" sh -c "
  redis-cli --raw EVALSHA '$SHA' 1 'k2l04:hw:tb:{s2}' 10 0.01 1000029 | paste -sd: -
" | tr -d '\r')
if [ "$h5" = "1:9:0" ]; then
  row "✔" H5 "cô lập theo storeId" "cửa hàng s2 vẫn còn nguyên 9 token"
else
  row "✘" H5 "cô lập theo storeId" "s2 trả $h5 (cần 1:9:0)"
fi

# H6 kết quả
if [ "${pttl:-0}" -gt 0 ] && [ "${pttl:-0}" -le 1000000 ]; then
  row "✔" H6 "tự đặt PEXPIRE dọn khóa" "PTTL=${pttl}ms ∈ (0, 1000000]"
else
  row "✘" H6 "tự đặt PEXPIRE dọn khóa" "PTTL=${pttl} (quên PEXPIRE sẽ rò rỉ khóa trên hub 128 MB)"
fi

# H7: 2 vòng song song x 15 lần ở chế độ TIME -> đúng 10 lần qua
h7=$(docker exec "$MAIN" sh -c "
  (for i in \$(seq 1 15); do redis-cli --raw EVALSHA '$SHA' 1 'k2l04:hw:tb:{race}' 10 0.001 | head -1; done > /tmp/k2h7a) &
  p1=\$!
  (for i in \$(seq 1 15); do redis-cli --raw EVALSHA '$SHA' 1 'k2l04:hw:tb:{race}' 10 0.001 | head -1; done > /tmp/k2h7b) &
  p2=\$!
  wait \$p1 \$p2
  cat /tmp/k2h7a /tmp/k2h7b | awk '\$1==1{c++} END{print c+0}'
  rm -f /tmp/k2h7a /tmp/k2h7b
" | tr -d '\r')
if [ "$h7" = "10" ]; then
  row "✔" H7 "2 luồng song song x 15 (chế độ TIME)" "đúng 10 request qua trên tổng 30"
else
  row "✘" H7 "2 luồng song song x 15 (chế độ TIME)" "cho qua=$h7 (cần đúng 10)"
fi

# H8: chế độ TIME không truyền now_ms trả đủ 3 trường số nguyên
h8=$(docker exec "$MAIN" sh -c "
  redis-cli --raw EVALSHA '$SHA' 1 'k2l04:hw:tb:{timecheck}' 5 1 | wc -l
" | tr -d ' \r')
if [ "$h8" = "3" ]; then
  row "✔" H8 "hợp đồng 3 trường ở chế độ TIME" "trả đủ {allowed, floor(tokens), retry_after_ms}"
else
  row "✘" H8 "hợp đồng 3 trường ở chế độ TIME" "số trường=$h8 (cần 3)"
fi

docker exec "$MAIN" sh -c "redis-cli --scan --pattern 'k2l04:hw:*' | xargs -r -n 100 redis-cli UNLINK" >/dev/null
exit "$bad"
