#!/usr/bin/env python3
"""조판 오버플로 게이트 — 실제 렌더 높이 검사. 사용: checkoverflow.py <report.html>"""
import io, os, re, subprocess, sys

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
path = os.path.abspath(sys.argv[1])
d = os.path.dirname(path)
html = io.open(path, encoding="utf-8").read()
probe = io.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "checkoverflow.js"), encoding="utf-8").read()

tmp = os.path.join(d, ".overflow_probe.html")
io.open(tmp, "w", encoding="utf-8").write(
    html.replace("</body>", "<script>window.addEventListener('load',()=>{%s})</script></body>" % probe))
try:
    out = subprocess.run([CHROME, "--headless", "--disable-gpu", "--dump-dom",
                          "--virtual-time-budget=4000", "file://" + tmp],
                         capture_output=True, text=True, timeout=120).stdout
finally:
    if os.path.exists(tmp): os.remove(tmp)

m = re.search(r"<title>PAGES=(\d+)\|OVER=([^|]*)\|TOP=([^|]*)\|ORPHAN=([^|]*)\|EMPTY=([^<]*)</title>", out)
if not m:
    print("측정 실패 — 페이지 정보를 회수하지 못했다"); sys.exit(2)

pages, over, top, orphan, empty = m.group(1), m.group(2), m.group(3), m.group(4), m.group(5)
who = os.path.basename(d)
print("═══ %s — %s쪽\n" % (who, pages))

fails = []
def report(name, val, unit=""):
    items = [x for x in val.split(",") if x]
    if items:
        fails.append(name)
        print("  🚨 %-10s %d쪽 — %s" % (name, len(items), " ".join(items[:12]) + unit))
    else:
        print("  ✅ %-10s 없음" % name)

report("하단 침범", over, " (쪽:높이px · 한계 754)")
report("상단 여백", top, " (쪽:margin)")
report("고아 제목", orphan)
report("빈 쪽", empty, " (활자면 50%% 미만)")

print("\n═══ 판정: %s" % ("PASS" if not fails else "FAIL — " + " · ".join(fails)))
sys.exit(1 if fails else 0)
