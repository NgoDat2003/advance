# So sánh 3 thuật toán cửa sổ của Chặng 3 trên cùng lưu lượng: ts c act fw_ok log_ok sc_ok
{
  gsub(/\r/, "")
  print $0
  log_ok = $5 + 0
  sc_ok = $6 + 0
  if (sc_ok == 1 && log_ok == 0) c_pass_l_deny++
  if (sc_ok == 0 && log_ok == 1) c_deny_l_pass++
}
END {
  printf "tong counter_qua_log_chan=%d counter_chan_log_qua=%d\n", c_pass_l_deny + 0, c_deny_l_pass + 0
}
