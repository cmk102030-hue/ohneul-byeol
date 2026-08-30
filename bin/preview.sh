#!/usr/bin/env bash
# 조판 결과를 눈으로 확인한다. PDF는 로컬에서 렌더할 수 없으므로,
# paginate.js가 만든 .page(794px) 단위로 HTML을 잘라 본다 — PDF 페이지와 1:1 대응.
# 사용: bash bin/preview.sh <slug> [페이지번호...]   (번호 생략 시 1 2 3)
set -euo pipefail
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
slug="$1"; shift
dir="out/$slug"; cd "$dir"
pages=("${@:-1 2 3}")

# 전체 렌더 + .page 오프셋 회수
python3 - <<'PY'
import io
h = io.open("report.html", encoding="utf-8").read()
io.open(".probe.html","w",encoding="utf-8").write(h.replace("</body>",
  "<script>document.body.setAttribute('data-offsets',[...document.querySelectorAll('.page')].map(p=>p.offsetTop).join(','));</script></body>",1))
PY
offs=$("$CH" --headless --disable-gpu --dump-dom "file://$PWD/.probe.html" 2>/dev/null \
  | grep -o 'data-offsets="[^"]*"' | sed 's/data-offsets="//;s/"//')
rm -f .probe.html
[ -z "$offs" ] && { echo "페이지 오프셋을 읽지 못했다 (paginate 미적용?)"; exit 1; }

total=$(( $(echo "$offs" | tr ',' '\n' | tail -1) + 900 ))
"$CH" --headless --disable-gpu --screenshot=.full.png --window-size=559,$total --hide-scrollbars \
  "file://$PWD/report.html" 2>/dev/null

for n in ${pages[@]}; do
  off=$(echo "$offs" | cut -d, -f"$n")
  [ -z "$off" ] && continue
  sips -c 794 559 --cropOffset "$off" 0 .full.png --out "page$(printf %02d "$n").png" >/dev/null
  echo "  page$(printf %02d "$n").png   (본문 ${n}쪽 · offset ${off})"
done
rm -f .full.png
