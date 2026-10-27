#!/usr/bin/env bash
# Ghi lại toàn bộ run của Bài 07 theo đúng thứ tự học (chạy tuần tự, một DB). Dùng: bash verify/record-all.sh [--no-races]
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
L="$HERE/../../../labs/lesson-07-data-modeling"
R() { bash "$HERE/run-lab.sh" "$@" >/dev/null || echo "✘ $*"; }
regions() { grep -oE '^-- #region [a-z0-9-]+' "$L/$1.sql" | awk '{print $3}'; }

R "$L/00-setup.sql"
R "$L/check.sql" --out check.after-setup
for f in 01-design-erd 02-normal-forms 03-foreign-keys; do for r in $(regions $f); do R "$L/$f.sql" --region "$r"; done; done
if [ "${1:-}" != "--no-races" ]; then
  R --ab "$L/03-fk-race.A.sql" "$L/03-fk-race.B.sql" nofk 1
  R --ab "$L/03-fk-race.A.sql" "$L/03-fk-race.B.sql" fk 1
fi
R "$L/03-foreign-keys.sql" --region kiem-chung
for r in $(regions 04-table-format); do [ "$r" = kiem-chung ] || R "$L/04-table-format.sql" --region "$r"; done
if [ "${1:-}" != "--no-races" ]; then
  R --ab "$L/04-index-online.A.sql" "$L/04-index-online.B.sql" plain 1.5
  R --ab "$L/04-index-online.A.sql" "$L/04-index-online.B.sql" cic 1
fi
R "$L/04-table-format.sql" --region kiem-chung
for f in 05-data-types 06-case-studies 07-views 08-polymorphic; do for r in $(regions $f); do R "$L/$f.sql" --region "$r"; done; done
for r in $(regions 09-ledger); do [ "$r" = kiem-chung ] || R "$L/09-ledger.sql" --region "$r"; done
if [ "${1:-}" != "--no-races" ]; then
  for i in 1 2 3; do
    R --ab "$L/09-ledger-race.A.sql" "$L/09-ledger-race.B.sql" unordered 1 --out "09-ledger-race.unordered.try$i"
    R --ab "$L/09-ledger-race.A.sql" "$L/09-ledger-race.B.sql" ordered 1 --out "09-ledger-race.ordered.try$i"
  done
  for k in unordered ordered; do for s in A B timeline; do cp "$HERE/../runs/09-ledger-race.$k.try1.$s.txt" "$HERE/../runs/09-ledger-race.$k.$s.txt"; done; done
fi
R "$L/09-ledger.sql" --region kiem-chung
R "$L/hw-solution.sql" --region solution
R "$L/hw-check.sql" --out hw-check.solution
R "$HERE/hw-bad-fixture.sql" --out hw-bad-fixture
R "$L/hw-check.sql" --out hw-check.bad-fixture
docker exec -i quan-ly-hop-dong-postgres-1 psql -X -q -U postgres -d advance_be_lab \
  -c "DROP TABLE IF EXISTS lab07_modeling.hw_bookings, lab07_modeling.hw_seats, lab07_modeling.hw_flights, lab07_modeling.hw_airports" 2>&1 | grep -v NOTICE
R "$L/check.sql"
echo "xong: $(ls "$HERE/../runs"/*.txt | wc -l) file run"
