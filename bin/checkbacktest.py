#!/usr/bin/env python3
"""백테스트 문항 구조 게이트 — 지침 §8-3.

신형(사건 A/대조 B/성향 C 섹션)이면 구조를 검사한다:
  · 사건형 시간창 = 연도 명시(1~3년) — 대운 10년 창 금지
  · 대조형 ≥ 3건 (없으면 적중률 해석 불능)
  · 집계 문항 중 사건형 ≥ 50%
구형(섹션 미분리)이면 키워드 휴리스틱으로 바넘·내면 비율을 보여주고 FAIL 처리한다.
"""
import io, re, sys

s = io.open(sys.argv[1], encoding="utf-8").read()
who = sys.argv[1].split("/")[-2]

try:
    seg = s[s.index("## ★ 검증 구간"):]
    seg = seg[:re.search(r"\n## \d", seg).start()]
except ValueError:
    print("검증 구간 없음"); sys.exit(1)

new_form = ("### A. 사건 예측" in seg) and ("### B. 대조 문항" in seg)

if new_form:
    A = re.findall(r"^\| (A\d+) \| ([^|]+) \|", seg, re.M)
    B = re.findall(r"^\| (B\d+) \|", seg, re.M)
    C = re.findall(r"^\| (C\d+) \|", seg, re.M)
    bad_window = []
    for i, w in A:
        yrs = re.findall(r"(19|20)\d{2}", w)
        span_ok = False
        if len(yrs) == 1:
            span_ok = True
        elif len(yrs) >= 2:
            m = re.search(r"((?:19|20)\d{2})\s*~\s*((?:19|20)\d{2})", w)
            span_ok = bool(m) and int(m.group(2)) - int(m.group(1)) <= 2
        if not span_ok: bad_window.append((i, w.strip()))
    tally = len(A) + len(B)
    ratio = len(A) / tally if tally else 0
    print("═══ %s — 신형 구조" % who)
    print("  사건형 A: %d건 · 대조형 B: %d건 · 성향 C(집계 제외): %d건" % (len(A), len(B), len(C)))
    print("  사건형 비중: %d%% (기준 ≥50%%)" % round(ratio * 100))
    for i, w in bad_window: print("  🚨 %s 시간창 위반(연도 미명시 또는 3년 초과): %s" % (i, w))
    fails = []
    if ratio < 0.5: fails.append("사건형 <50%")
    if len(B) < 3: fails.append("대조형 <3")
    if bad_window: fails.append("시간창 위반 %d건" % len(bad_window))
    print("═══ 판정: %s" % ("PASS" if not fails else "FAIL — " + " · ".join(fails)))
    sys.exit(0 if not fails else 1)

# ── 구형: 키워드 휴리스틱 (진단용)
BARNUM = ["적이 있다", "시점이 있다", "일이 있다", "한 번 이상", "한 번 있", "경험이 있", "생각했다"]
INNER  = ["느낌", "느꼈", "마음", "불안", "불편", "의식", "감각", "편하지", "어색", "피로", "감정", "화두"]
rows = re.findall(r"^\| ([A-Z]\d+) \| ([^|]+) \|", seg, re.M)
bar = sum(1 for _, t in rows if any(k in t for k in BARNUM))
inn = sum(1 for _, t in rows if any(k in t for k in INNER))
print("═══ %s — 구형(섹션 미분리) %d문항 · 바넘후보 %d · 내면후보 %d" % (who, len(rows), bar, inn))
print("═══ 판정: FAIL — §8-3 신형 구조(사건 A/대조 B/성향 C)로 재작성 필요")
sys.exit(1)
