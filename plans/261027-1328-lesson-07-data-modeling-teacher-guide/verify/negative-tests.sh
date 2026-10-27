#!/usr/bin/env bash
# Mỗi ca làm hỏng một bản sao của guide (hoặc dữ liệu) và kiểm tra verifier PHẢI báo lỗi đúng mã.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$HERE/../../.."
G="$ROOT/reports/advanced_backend/lesson_07_data_modeling_teacher_guide.html"
T="$HERE/tmp/neg"; mkdir -p "$T"
pass=0; total=0
expect() { # $1 tên ca, $2 mã phải xuất hiện, $3... lệnh
  local name="$1" code="$2"; shift 2; total=$((total+1))
  local out; out=$("$@" 2>&1); local rc=$?
  if [ $rc -ne 0 ] && grep -q "$code" <<<"$out"; then echo "✔ $name → $code"; pass=$((pass+1)); else echo "✘ $name: rc=$rc, không thấy $code"; fi
}
mut() { cp "$G" "$T/g.html"; sed -i "$1" "$T/g.html"; } # áp một biểu thức sed lên bản sao, giữ nguyên thư mục ảnh qua --guide trong cùng chỗ
V="node $HERE/verify-guide.mjs"
# Bản sao phải nằm cạnh guide thật để đường dẫn ảnh tương đối vẫn đúng
NG="$ROOT/reports/advanced_backend/.neg-copy.html"
run_mut() { mut "$1"; cp "$T/g.html" "$NG"; }
run_mut '0,/data-sql="[^"]*"><code>-- #region/s//&X/';            expect "a: sửa 1 ký tự trong data-sql" V05 $V --guide "$NG" --only V05
run_mut '0,/<b class="m" data-run="\([^"]*\)">[^<]*</s//<b class="m" data-run="\1">987654321</'; expect "b: số không có trong run" V07 $V --guide "$NG" --only V07
run_mut 's#<b class="m" data-run="03-fk-race.nofk.timeline">1</b>#<b class="m" data-run="03-fk-race.nofk.timeline">7</b>#'; expect "b2: số nhỏ 1 → 7 (orphans)" V07 $V --guide "$NG" --only V07
run_mut 's/data-store="l07-warmup"/data-store="l14-x"/';            expect "c: khóa l14-" V09 $V --guide "$NG" --only V09
run_mut '/{ n: 17,/d';                                             expect "d: xóa slide 17 khỏi SLIDES" V04 $V --guide "$NG" --only V04
run_mut 's#</head>#<script src="https://cdn.example.com/x.js"></script></head>#'; expect "e: chèn script ngoài" V10 $V --guide "$NG" --only V10
mkdir -p "$T/runs"; cp "$HERE/../runs/"*.txt "$T/runs/" 2>/dev/null; printf -- '-- chạy lúc 27/10/2026\nkhông có gì\n' > "$T/runs/04-table-format.add-column.txt"
expect "f: run sai không khớp X12" X12 $V --runs --runs-dir "$T/runs"
mkdir -p "$T/runs/data"; cp "$HERE/../runs/data/"*.json "$T/runs/data/" 2>/dev/null
node -e "const f='$T/runs/data/w6.json'.replace(/^\/(\w)\//,'\$1:/');const fs=require('fs');const j=JSON.parse(fs.readFileSync(f));j.fake=999999;fs.writeFileSync(f,JSON.stringify(j))" 2>/dev/null
expect "g: số bịa trong w6" 999999 $V --data --runs-dir "$T/runs"
rm -f "$NG"
echo "$pass/$total ca RED đúng thiết kế"; [ $pass -eq $total ]
