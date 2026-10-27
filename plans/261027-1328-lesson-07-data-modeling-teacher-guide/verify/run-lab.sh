#!/usr/bin/env bash
# Chạy một file .sql của Bài 07 qua psql trong container và ghi nguyên văn kết quả vào runs/.
# Dùng: bash verify/run-lab.sh <file.sql> [--region <id>] [--out <tên>]
#       bash verify/run-lab.sh --ab <A.sql> <B.sql> <region> <delayB-giây> [--out <tên>]
set -u
export MSYS_NO_PATHCONV=1
HERE="$(cd "$(dirname "$0")" && pwd)"
RUNS="$HERE/../runs"
CT=quan-ly-hop-dong-postgres-1
mkdir -p "$RUNS"

# In một region (kèm dòng #region/#endregion) hoặc cả file nếu không chỉ region.
region_text() {
  if [ -z "$2" ]; then cat "$1"; else
    awk -v id="$2" 'index($0, "-- #region " id " ") == 1 {on=1} on {print} on && /^-- #endregion/ {exit}' "$1"
  fi
}
# Gộp stderr vào stdout ngay trong container để lỗi nằm đúng chỗ câu lệnh gây ra nó.
psql_run() {
  docker exec -i -e PGAPPNAME="$1" "$CT" sh -c 'psql -X -U postgres -d advance_be_lab -v ON_ERROR_STOP=0 -v VERBOSITY=verbose -P pager=off -a -c "\timing on" -f - 2>&1'
}
header() {
  local v; v=$(docker exec -i "$CT" psql -X -U postgres -d advance_be_lab -Atc "select split_part(version(),' ',2)")
  echo "-- chạy lúc $(date '+%d/%m/%Y %H:%M %z') · PostgreSQL $v · psql trong container"
}

if [ "${1:-}" = "--ab" ]; then
  A="$2"; B="$3"; REG="$4"; DELAY="$5"; OUT="$(basename "$A" .A.sql).$REG"
  [ "${6:-}" = "--out" ] && OUT="$7"
  { header; region_text "$A" "$REG" | psql_run l07-A; } > "$RUNS/$OUT.A.txt" &
  PA=$!
  sleep "$DELAY"
  { header; region_text "$B" "$REG" | psql_run l07-B; } > "$RUNS/$OUT.B.txt"
  wait $PA
  node "$(cygpath -m "$HERE")/merge-timeline.mjs" "$(cygpath -m "$RUNS/$OUT.A.txt")" "$(cygpath -m "$RUNS/$OUT.B.txt")" > "$RUNS/$OUT.timeline.txt"
  echo "ghi: runs/$OUT.A.txt, .B.txt, .timeline.txt"
  exit 0
fi

F="$1"; shift; REG=""; OUT="$(basename "$F" .sql)"
while [ $# -gt 0 ]; do case "$1" in
  --region) REG="$2"; OUT="$OUT.$2"; shift 2;;
  --out) OUT="$2"; shift 2;;
  *) shift;;
esac; done
{ header; region_text "$F" "$REG" | psql_run l07-runner; } > "$RUNS/$OUT.txt"
echo "ghi: runs/$OUT.txt"
