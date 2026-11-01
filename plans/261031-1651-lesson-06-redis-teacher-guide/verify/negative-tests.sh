#!/usr/bin/env bash
export MSYS_NO_PATHCONV=1
# Mỗi ca làm hỏng MỘT bản sao (guide, fragment, labs, runs, dữ liệu widget) và kiểm verifier PHẢI báo đỏ đúng mã.
# Dùng: bash verify/negative-tests.sh [--guide-only | --labs-only | --data-only | --hw-only]   (không cờ = cả bốn nhóm, 26 ca)
# Nhóm hw chạy hw-check.sh thật trên main (xóa l06:hw:* như mọi lần chấm bài).
# Ca nào chưa có mục tiêu (chưa có guide, run, fragment…) in SKIP và không tính đạt/trượt; bản build đầy đủ ở phase 07 phải 0 SKIP.
set -u
HERE="$(cd "$(dirname "$0")" && pwd -W)"
PLAN="$(cd "$HERE/.." && pwd -W)"
ROOT="$(cd "$PLAN/../.." && pwd -W)"
G="$ROOT/reports/advanced_backend/lesson_06_redis_teacher_guide.html"
NG="$ROOT/reports/advanced_backend/.neg-copy.html" # bản sao nằm cạnh guide để đường dẫn ảnh tương đối vẫn đúng
LABS="$ROOT/labs/lesson-06-redis"
RUNS="$PLAN/runs"
FRAG="$PLAN/assembly/fragments"
T="$HERE/tmp/neg"
V="node $HERE/verify-guide.mjs"
trap 'rm -f "$NG"' EXIT
rm -rf "$T"; mkdir -p "$T"

GROUP=all
case "${1:-}" in --guide-only) GROUP=guide ;; --labs-only) GROUP=labs ;; --data-only) GROUP=data ;; --hw-only) GROUP=hw ;; "") ;; *) echo "cờ lạ: $1"; exit 2 ;; esac
pass=0; total=0; skipped=0

expect() { # $1 tên ca, $2 mẫu (grep -E) phải thấy trong output, rồi lệnh verifier
  local name="$1" pat="$2" out rc; shift 2; total=$((total + 1))
  out=$("$@" 2>&1); rc=$?
  if [ $rc -ne 0 ] && grep -qE "$pat" <<<"$out"; then echo "✔ $name → đỏ đúng mã"; pass=$((pass + 1))
  else echo "✘ $name: rc=$rc, không thấy /$pat/"; printf '%s\n' "$out" | head -5 | sed 's/^/    /'; fi
}
skip() { total=$((total + 1)); skipped=$((skipped + 1)); echo "– SKIP $1 · $2"; }
# mutate <nguồn> <đích> '<biểu thức JS nhận s, trả chuỗi mới>'; thoát 3 nếu không có gì để đổi (mục tiêu chưa tồn tại)
mutate() {
  node -e "const fs=require('fs');const [src,dst,expr]=process.argv.slice(1);const s=fs.readFileSync(src,'utf8');const t=new Function('s','return '+expr)(s);if(t===s)process.exit(3);fs.writeFileSync(dst,t)" "$1" "$2" "$3"
}
guide_case() { # $1 tên, $2 mã, $3 biểu thức mutate, $4 --only
  if [ ! -f "$G" ]; then skip "$1" "chưa có guide"; return; fi
  if ! mutate "$G" "$NG" "$3"; then skip "$1" "guide chưa có mục tiêu để làm hỏng"; return; fi
  expect "$1" "^$2 " $V --guide "$NG" --only "$4"
}
labs_copy() { rm -rf "$T/labs"; mkdir -p "$T/labs"; [ -d "$LABS" ] && cp -r "$LABS/." "$T/labs/"; }
runs_copy() { rm -rf "$T/runs"; mkdir -p "$T/runs"; [ -d "$RUNS" ] && cp -r "$RUNS/." "$T/runs/"; }
plant() { # $1 tên ca, $2 tên file cài vào bản sao labs, $3 nội dung dòng cài
  labs_copy
  printf '# #region neg · ca âm (slide 1)\n%s\n# #endregion\n' "$3" > "$T/labs/$2"
  expect "$1" "^V17 $2:" $V --lint --labs "$T/labs"
}

if [ "$GROUP" = all ] || [ "$GROUP" = guide ]; then
  echo "== nhóm guide"
  guide_case "a: đổi 1 ký tự trong pre[data-cmd]" V05 's.replace(/(<pre[^>]*data-cmd="[^"]+"[^>]*><code>)([^<])/, (m, a, b) => a + (b === "X" ? "Y" : "X"))' V05
  guide_case "b: số b.m không có trong run" V07 's.replace(/(<b class="m" data-run="[^"]+">)[^<]*</, "$1" + "987654321<")' V07
  guide_case "c: khóa lưu trữ l07-" V09 's.replace(/data-store="l06-/, "data-store=\"l07-")' V09
  guide_case "d: xóa slide 21 khỏi SLIDES" V04 's.replace(/\{\s*n:\s*21\b[^}]*\},?\s*/, "")' V04
  guide_case "e: đổi chip slide 40" V04 's.replace(/(\{\s*n:\s*40\b[^}]*chip:\s*)(["\x27])Cần sửa\2/, "$1\"Đúng trên Redis 7.2\"")' V04
  guide_case "f: chèn script ngoài" V10 's.replace("</head>", "<script src=\"https://cdn.example.com/x.js\"></script></head>")' V10
  guide_case "q: innerHTML không esc trong widget" V19 's.replace(/<\/script>(?![\s\S]*<script)/, ";x.innerHTML = `${row.cmd}`;</script>")' V19
  # u: số 3 chữ số trong lời giải thích quiz không có trong run được trích (V16 cũ bỏ qua số dưới 4 chữ số)
  guide_case "u: số 3 chữ số trong quiz why không có trong run" V16 's.replace("lúc +743 ms, B", "lúc +987 ms, B")' V16
  # v: dòng sed trỏ tới region không có trong file lab
  guide_case "v: sed in region không có thật" V20 's.replace("/#region allkeys-lfu /", "/#region allkeys-lfx /")' V20
  # x: ô nhập chỉ có placeholder, không có nhãn
  guide_case "x: ô nhập không có nhãn" V21 's.replace("</body>", "<input class=\"field\" data-store=\"l06-neg\" placeholder=\"neg\"></body>")' V21
  # t: số của chip chỉ còn nằm trong dòng lệnh đã gõ (seq 1 1500), output thật đã khác
  if [ ! -f "$G" ] || [ ! -f "$RUNS/04-persistence.aof-loss.txt" ]; then skip "t: chip chỉ khớp dòng lệnh" "chưa có guide hoặc run aof-loss"
  else runs_copy
    if mutate "$RUNS/04-persistence.aof-loss.txt" "$T/runs/04-persistence.aof-loss.txt" 's.replace(/(DBSIZE\n)1500$/m, "$11499")'; then
      expect "t: chip 1500 chỉ khớp dòng \$ seq 1 1500" "^V07 04-persistence\.aof-loss: giá trị \"1500\"" $V --guide "$G" --runs-dir "$T/runs" --only V07
    else skip "t: chip chỉ khớp dòng lệnh" "run aof-loss không có dòng DBSIZE 1500"; fi
  fi
  # w: region allkeys-lfu không còn "chỉ khác tên chính sách" so với allkeys-lru, guide vẫn nói vậy
  if [ ! -f "$G" ]; then skip "w: region sed khác region gốc" "chưa có guide"
  else labs_copy
    if mutate "$LABS/03-eviction.sh" "$T/labs/03-eviction.sh" 's.replace(/(# #region allkeys-lfu [^\n]*\n)/, "$1echo khac\n")'; then
      expect "w: allkeys-lfu khác allkeys-lru ngoài tên chính sách" "^V20 region allkeys-lfu không trùng allkeys-lru" $V --guide "$G" --labs "$T/labs" --only V20
    else skip "w: region sed khác region gốc" "không có region allkeys-lfu"; fi
  fi
  # s: fragment + quiz bản sao, why không trích run id
  if [ ! -f "$FRAG/stage-01.html" ] || [ ! -f "$FRAG/stage-01.quiz.json" ]; then skip "s: quiz why không có run id" "chưa có fragment stage-01"
  else
    mkdir -p "$T/frag"; cp "$FRAG/stage-01.html" "$T/frag/"
    mutate "$FRAG/stage-01.quiz.json" "$T/frag/stage-01.quiz.json" 'JSON.stringify(JSON.parse(s).map((x, i) => i ? x : { ...x, why: "Vì Redis chạy trong RAM." }))'
    expect "s: quiz why không có run id" "^V11 " $V --fragment "$T/frag/stage-01.html"
  fi
fi

if [ "$GROUP" = all ] || [ "$GROUP" = labs ]; then
  echo "== nhóm labs/runs"
  if [ ! -f "$RUNS/03-expiry.active.txt" ]; then skip "g: run R16a bị hỏng" "chưa có runs/03-expiry.active.txt"
  else runs_copy; printf '# chạy lúc 01/01/2026 00:00 +0700 · Redis 7.2.3 · advance-be-redis\nhỏng\n' > "$T/runs/03-expiry.active.txt"
    expect "g: run R16a bị hỏng" "^R16a " $V --runs --runs-dir "$T/runs"; fi
  first=$( [ -f "$RUNS/manifest.tsv" ] && head -1 "$RUNS/manifest.tsv" | cut -f2 )
  if [ -z "$first" ] || [ ! -f "$RUNS/$first" ]; then skip "h: run sửa tay" "chưa có manifest"
  else runs_copy; printf 'sửa tay\n' >> "$T/runs/$first"
    expect "h: run sửa tay ($first)" "^M01 $first" $V --runs --runs-dir "$T/runs"; fi
  plant "j: khóa ngoài l06:" zz-neg.redis 'SET foo 1'
  plant "k: nhắc cổng 6380" zz-neg.sh 'echo 6380'
  plant "l: CONFIG SET maxmemory không khôi phục" zz-neg.redis 'CONFIG SET maxmemory 1mb'
  awk -F'\t' 'BEGIN{OFS="\t"} $1=="R16a"{$7="deviation"} {print}' "$HERE/expected.tsv" > "$T/expected.tsv"; : > "$T/deviations.md"
  expect "m: deviation không có mục trong deviations.md" "^D01 R16a" $V --runs --expected "$T/expected.tsv" --deviations "$T/deviations.md"
  plant "n: DEBUG SET-ACTIVE-EXPIRE 0 không khôi phục" zz-neg.redis 'DEBUG SET-ACTIVE-EXPIRE 0'
  plant "o: docker kill main" zz-neg.sh 'docker kill advance-be-redis'
  plant "p: lệnh dọn rác volume" zz-neg.sh "docker volume $(printf '%s%s' 'pr' 'une') -f"
  lua=$( [ -d "$RUNS" ] && grep -ho '^# lua [^ ]*' "$RUNS"/*.txt 2>/dev/null | head -1 | cut -d' ' -f3 )
  if [ -z "$lua" ] || [ ! -f "$LABS/lua/$lua" ]; then skip "r: đổi 1 byte trong lua/*.lua" "chưa có run Lua nào"
  else labs_copy; printf ' ' >> "$T/labs/lua/$lua"
    expect "r: đổi 1 byte trong lua/$lua" "^V18 " $V --runs --labs "$T/labs"; fi
fi

if [ "$GROUP" = all ] || [ "$GROUP" = data ]; then
  echo "== nhóm dữ liệu"
  if [ ! -f "$RUNS/data/w4.json" ]; then skip "i: số bịa trong w4.json" "chưa có runs/data/w4.json"
  else runs_copy; mutate "$RUNS/data/w4.json" "$T/runs/data/w4.json" 'JSON.stringify({ ...JSON.parse(s), fake: 987654321 })'
    expect "i: số bịa trong w4.json" "^DATA .*987654321" $V --data --runs-dir "$T/runs"; fi
fi

if [ "$GROUP" = all ] || [ "$GROUP" = hw ]; then
  echo "== nhóm bài tập (hw-check.sh chạy thật trên main, 1 vòng thường + vòng H5)"
  # Bộ chấm phải cho ✘ H5 với bài nhả khóa sai, kể cả khi lỗi được che bởi TTL dài hoặc chương trình không chạy gì.
  hw_expect() { # $1 tên ca, $2 HW_CMD
    local name="$1" out rc; total=$((total + 1))
    out=$(HW_CMD="$2" bash "$LABS/hw-check.sh" --rounds 1 2>&1); rc=$?
    if [ $rc -ne 0 ] && grep -q '^✘ H5 ' <<<"$out"; then echo "✔ $name → ✘ H5 đúng thiết kế"; pass=$((pass + 1))
    else echo "✘ $name: rc=$rc, không thấy ✘ H5"; printf '%s\n' "$out" | tail -3 | sed 's/^/    /'; fi
  }
  if ! docker exec advance-be-redis redis-cli PING >/dev/null 2>&1; then
    skip "y: H5 với SET NX PX 2000 + DEL" "main chưa chạy"; skip "z: H5 khi chương trình không chạy" "main chưa chạy"
  else
    hw_expect "y: H5 với SET NX PX 2000 ghi cứng + DEL trơn" "node $HERE/hw-bad-del-fixture.mjs"
    hw_expect "z: H5 khi chương trình không làm gì (HW_CMD=true)" "true"
  fi
fi

ran=$((total - skipped))
echo "$pass/$ran ca đỏ đúng thiết kế · $skipped SKIP · tổng $total ca"
[ "$pass" -eq "$ran" ]
