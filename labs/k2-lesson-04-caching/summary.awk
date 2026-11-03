# Tổng hợp kết quả replay: in từng dòng, sau đó thống kê theo màn (s7) và tổng theo cửa hàng (s7, s8).
# Đầu vào mỗi dòng: ts c act allowed metric field6 [extra...]
# Với các bộ giới hạn tức thời (fixed/log/counter/token/interval), khi allowed=1 thì field6 = retry/wait = 0.
# Với leaky bucket, khi allowed=1 thì field6 = wait_ms (thời gian xếp hàng trước khi bắt đầu xử lý).
{
  gsub(/\r/, "")
  print $0
  ts = $1 + 0
  c = $2
  act = $3 + 0
  ok = $4 + 0
  f6 = $6 + 0
  total_c[c]++
  if (c == "s7") {
    act_tot[act]++
    if (ok == 1) act_ok[act]++
  }
  if (ok == 1) {
    ok_c[c]++
    w = f6
    if (w > max_wait[c]) max_wait[c] = w
    n_starts[c]++
    starts[c, n_starts[c]] = ts + w
  } else {
    deny_c[c]++
  }
}
END {
  for (a = 1; a <= 4; a++) {
    printf "man %d s7 cho_qua=%d/%d\n", a, act_ok[a] + 0, act_tot[a] + 0
  }
  split("s7 s8", stores, " ")
  for (idx = 1; idx <= 2; idx++) {
    c = stores[idx]
    if (total_c[c] + 0 == 0) continue
    m10 = 0
    cnt = n_starts[c] + 0
    for (i = 1; i <= cnt; i++) {
      t = starts[c, i]
      in_win = 0
      for (j = 1; j <= cnt; j++) {
        s = starts[c, j]
        if (s > t - 10000 && s <= t) in_win++
      }
      if (in_win > m10) m10 = in_win
    }
    printf "tong %s cho_qua=%d tu_choi=%d toi_da_10s=%d cho_lau_nhat_ms=%d\n", c, ok_c[c] + 0, deny_c[c] + 0, m10, max_wait[c] + 0
  }
}
