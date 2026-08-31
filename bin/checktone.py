#!/usr/bin/env python3
"""어투 게이트 — 지침 §5-1-2.

확신도 라벨([중간]·[낮음])이 걸린 판정 단위의 어미가 판단형인지 본다.
판정 단위 = 라벨 직전 두 문장(주장 + 근거). 근거는 사실이라 단정이 맞으므로
둘 중 하나만 판단형이면 통과한다. 표 셀과 백틱 라벨(체계 설명)은 대상이 아니다.
"""
import io, re, sys

HEDGE = ["로 보", "봅니다", "본다", "가능성", "대개", "여지", "보인다", "추정",
         "않는다", "일 수 있", "수 있", "쉽습니다", "쉽다", "제한적", "확정이 아",
         "판단합니다", "전형적", "읽힙니다", "편이","편입니다", "아닙니다", "경향", "것입니다", "기 쉽", "되기", "셈입니다", "듯", "무렵", "보입니다", "때문입니다", "경우가 많", "라면", "이라면", "면 ", "쪽입니다", "형태입니다", "뒤입니다", "사안입니다", "이유입니다", "실리는", "그만큼", "때", "면 ", "므로", "때문", "덕분"]

src = io.open(sys.argv[1], encoding="utf-8").read()
text = "\n".join(l for l in src.split("\n") if not l.lstrip().startswith("|"))

bad = 0
print("═══ 확신도 ↔ 어미 불일치")
for m in re.finditer(r"(?<!`)\[(중간|낮음)\](?!`)", text):
    unit = text[max(0, m.start() - 260):m.start()]
    unit = unit.replace("**", "").replace("==", "").strip()   # 강조 기호가 문장 분리를 깨뜨린다
    tail = " ".join(re.split(r"(?<=[.!?다])\s+", unit)[-2:])
    if any(k in tail for k in HEDGE):
        continue
    bad += 1
    print("  [%s] …%s" % (m.group(1), tail[-70:]))
if bad == 0:
    print("  없음")

print("\n═══ 과장 부사 빈도")
for w in ["완벽히", "완벽하게", "절대", "결정적", "치명적", "극도로", "매우", "아주", "반드시"]:
    n = src.count(w)
    if n:
        print("  %-6s %d회" % (w, n))

print("\n═══ 판정: %s" % ("PASS" if bad == 0 else "FAIL — %d건" % bad))
sys.exit(1 if bad else 0)
