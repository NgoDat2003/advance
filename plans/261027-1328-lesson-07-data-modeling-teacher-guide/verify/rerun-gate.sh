#!/usr/bin/env bash
# Gate "chạy lại": học viên thường chạy một region hai lần trong cùng tab DBX (DBX giữ phiên, dừng ở lỗi đầu tiên).
# Mỗi region một phiên giả lập: chạy region, rồi chạy lại y nguyên. Lần hai không được có thêm lỗi so với lần một.
# Dùng: bash verify/rerun-gate.sh   (chạy ở thư mục plan; ghi chi tiết vào runs/rerun-gate.txt)
set -u
export MSYS_NO_PATHCONV=1
HERE="$(cd "$(dirname "$0")" && pwd)"
LABS="$HERE/../../../labs/lesson-07-data-modeling"
OUT="$HERE/../runs/rerun-gate.txt"
CT=quan-ly-hop-dong-postgres-1
bad=0; total=0
echo "-- chạy lúc $(date '+%d/%m/%Y %H:%M %z') · mỗi region chạy 2 lần trong một phiên" > "$OUT"
for f in 00-setup check 01-design-erd 02-normal-forms 03-foreign-keys 04-table-format 05-data-types 06-case-studies 07-views 08-polymorphic 09-ledger hw-check; do
  regions=$(grep -oE '^-- #region [a-z0-9-]+' "$LABS/$f.sql" | awk '{print $3}')
  [ -z "$regions" ] && regions="__whole__"
  for r in $regions; do
    if [ "$r" = "__whole__" ]; then body=$(cat "$LABS/$f.sql"); else
      body=$(awk -v id="$r" 'index($0, "-- #region " id " ") == 1 {on=1} on {print} on && /^-- #endregion/ {exit}' "$LABS/$f.sql"); fi
    res=$(printf '%s\nROLLBACK;\nSELECT '"'"'__LAN_HAI__'"'"';\n%s\nROLLBACK;\n' "$body" "$body" \
      | docker exec -i -e PGAPPNAME=l07-rerun "$CT" sh -c 'psql -X -q -U postgres -d advance_be_lab -v ON_ERROR_STOP=0 -v VERBOSITY=verbose -f - 2>&1')
    e1=$(printf '%s' "$res" | sed '/__LAN_HAI__/,$d' | grep -c 'ERROR:')
    e2=$(printf '%s' "$res" | sed -n '/__LAN_HAI__/,$p' | grep -c 'ERROR:')
    total=$((total+1))
    if [ "$e2" -gt "$e1" ]; then
      bad=$((bad+1)); echo "✘ $f#$r: lần 1 có $e1 lỗi, lần 2 có $e2" | tee -a "$OUT"
      printf '%s' "$res" | sed -n '/__LAN_HAI__/,$p' | grep 'ERROR:' | sed 's/^/    /' | tee -a "$OUT"
    else echo "✔ $f#$r ($e1 lỗi cố ý)" >> "$OUT"; fi
  done
done
echo "$((total-bad))/$total region chạy lại an toàn" | tee -a "$OUT"
[ "$bad" -eq 0 ]
