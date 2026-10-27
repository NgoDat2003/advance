#!/usr/bin/env bash
# Ghi lại đáp án "Tự làm" chặng 3 ở cả hai thứ tự (bảng my_*, xóa sau khi đo). Dùng: bash verify/record-c3-answer.sh
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"; OUT="$HERE/../runs/03-challenge-answer.txt"; T="$HERE/tmp"
P="docker exec -i quan-ly-hop-dong-postgres-1 psql -X -U postgres -d advance_be_lab"
SETUP="SET search_path = lab07_modeling; DROP TABLE IF EXISTS my_contracts, my_stores; CREATE TABLE my_stores (id int PRIMARY KEY, name text NOT NULL); CREATE TABLE my_contracts (id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY, store_id int NOT NULL); INSERT INTO my_stores VALUES (7, 'MayCha Quận 7');"
ORPH="SELECT count(*) AS orphans, (SELECT count(*) FROM lab07_modeling.my_contracts) AS hop_dong, (SELECT count(*) FROM lab07_modeling.my_stores) AS cua_hang FROM lab07_modeling.my_contracts c WHERE NOT EXISTS (SELECT 1 FROM lab07_modeling.my_stores s WHERE s.id = c.store_id);"
echo "-- chạy lúc $(date '+%d/%m/%Y %H:%M %z') · đáp án Tự làm chặng 3 (bảng my_*, xóa sau khi đo)" > "$OUT"
for order in AB BA; do
  $P -q -c "$SETUP" >/dev/null 2>&1
  ( $P -a -f - < "$HERE/c3-answer.${order:0:1}.sql" > "$T/first.out" 2>&1 & ); sleep 1
  $P -a -f - < "$HERE/c3-answer.${order:1:1}.sql" > "$T/second.out" 2>&1; sleep 6
  if [ $order = AB ]; then echo "== Thứ tự 1: A trước, B sau 1 giây =="; a=first; b=second; else echo "== Thứ tự 2: B trước, A sau 1 giây =="; a=second; b=first; fi >> "$OUT"
  node "$(cygpath -m "$HERE")/merge-timeline.mjs" "$(cygpath -m "$T/$a.out")" "$(cygpath -m "$T/$b.out")" >> "$OUT"
  $P -c "$ORPH" >> "$OUT" 2>&1
done
$P -q -c "DROP TABLE IF EXISTS lab07_modeling.my_contracts, lab07_modeling.my_stores" >/dev/null 2>&1
grep -E "==|^(INSERT|DELETE) [0-9]|^ +[0-9]+ \|" "$OUT"
