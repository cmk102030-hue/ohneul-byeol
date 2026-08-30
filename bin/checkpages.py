#!/usr/bin/env python3
"""조판 게이트 — 페이지별 콘텐츠 양 검사. 규약 정본 = prompts/layout_rules.md §3

paginate.js가 만든 .page 를 직접 읽는다. PDF 스트림을 파싱하던 이전 방식은
스트림 순서가 페이지 순서와 달라 오판했다(body p2가 609자인데 0%로 나옴).

사용: python3 bin/checkpages.py out/<slug>/report.html [--min 0.35]
"""
import io, re, sys

path = sys.argv[1]
if path.endswith(".pdf"):
    path = path[:-4] + ".html"
MIN_RATIO = float(sys.argv[sys.argv.index("--min") + 1]) if "--min" in sys.argv else 0.35

h = io.open(path, encoding="utf-8").read()
if 'data-paginated' not in h:
    print("페이지네이션이 적용되지 않은 파일이다"); sys.exit(2)
body = h[h.index('<div class="body"'):]
pages = body.split('<div class="page">')[1:]

def info(p):
    txt = re.sub(r"<[^>]+>", " ", p)
    txt = re.sub(r"\s+", " ", txt).strip()
    tags = re.findall(r"<(h2|h3|table|div class=\"chart-block\")", p)
    # 표·도판은 글자 수 대비 지면을 많이 쓰므로 가중치를 준다
    weight = len(txt) + 260 * p.count("<table") + 520 * p.count('class="chart-block"')
    return len(txt), weight, tags

rows = [info(p) for p in pages]
full = sorted(w for _, w, _ in rows)[int(len(rows) * 0.8)]   # 상위 20% 경계 = '꽉 참'
is_chap = ['brk chap' in p for p in pages]  # class="brk chap tight" 등 추가 클래스 허용
is_end = [(i + 1 < len(pages) and is_chap[i + 1]) or i == len(pages) - 1 for i in range(len(pages))]

print("파일 %s\n본문 %d 페이지 · 기준(꽉 참) %d · 하한 %d%%\n" % (path, len(pages), full, MIN_RATIO * 100))
bad = []
for i, (n, w, tags) in enumerate(rows, 1):
    r = min(1.0, w / full) if full else 0
    mark = "◆" if is_chap[i - 1] else " "
    tag = ""
    if r < MIN_RATIO:
        if is_end[i - 1]:
            tag = "  장 마지막"
        else:
            tag = "  ⚠️ %d자" % n
            bad.append((i, r, n))
    print("  p%-3d %s %-24s %3d%%%s" % (i, mark, "█" * int(r * 24), r * 100, tag))

print()
if bad:
    print("미달 %d p: %s" % (len(bad), ", ".join("p%d(%d자)" % (i, n) for i, _, n in bad)))
    print("→ 장 중간의 큰 공백은 R2~R7이 서로를 깨고 있다는 신호다 (규약 §3-1)")
    sys.exit(1)
print("PASS — 장 중간 공백 없음")
