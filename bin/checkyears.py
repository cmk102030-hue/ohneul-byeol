# -*- coding: utf-8 -*-
"""간지 게이트 — 리포트에 적힌 '연도+간지'가 실제와 맞는지 전수 검사.

세운 서술이 한 칸 밀리면 그 뒤 해석이 전부 무효가 된다. 기계로만 잡을 수 있다."""
import io,re,sys
G="갑을병정무기경신임계"; Z="자축인묘진사오미신유술해"
GH="甲乙丙丁戊己庚辛壬癸"; ZH="子丑寅卯辰巳午未申酉戌亥"
def gz(y): return G[(y-1984)%10]+Z[(y-1984)%12], GH[(y-1984)%10]+ZH[(y-1984)%12]
s=io.open(sys.argv[1],encoding="utf-8").read()
bad=0
for m in re.finditer(r"(20\d\d)\s*년?\s*([가-힣]{2})\b", s):
    y=int(m.group(1)); w=m.group(2); k,_=gz(y)
    if w[0] in G and w[1] in Z:      # 간지처럼 보이는 것만
        if w!=k:
            bad+=1; print("  🚨 %d년 → 리포트 '%s' · 실제 '%s'" % (y,w,k))
print("검사 완료 — 불일치 %d건" % bad)

import sys as _s; _s.exit(1 if bad else 0)
