#!/usr/bin/env python3
"""문체 게이트 — 지침 §5-1-4. 사람이 쓴 문장인가.

줄표 밀도 · 판단 어미 편중 · '~적' · 복수 '~들'을 본다.
전문용어 비율(§5-1)도 함께 검사한다.
"""
import io, re, sys

JARGON = ["일간","월지","일지","년지","시지","월간","년간","시간","원국","십성",
"식신","상관","편재","정재","편관","정관","편인","정인","비견","겁재",
"관성","인성","재성","식상","비겁","신강","신약","득령","득지","득세","격국",
"용신","희신","기신","구신","지장간","십이운성","공망","원진","귀문","조후","조토","습토",
"삼합","반합","육합","천간","지지","건록","복음"]
ENDINGS = ["로 봅니다","하기 쉽습니다","인 편입니다","가능성이 높습니다","로 읽습니다","편이 맞습니다"]

s = io.open(sys.argv[1], encoding="utf-8").read()
body = "\n".join(l for l in s.split("\n") if not l.lstrip().startswith("|"))
body = re.sub(r"^#.*$", "", body, flags=re.M)
sents = [x.strip() for x in re.split(r"(?<=다\.)\s+", body) if len(x.strip()) > 15]
n = max(1, len(sents))
paras = [p for p in body.split("\n\n") if len(p.strip()) > 40]

fails = []
def line(name, cnt, per, limit, unit="문장당"):
    ok = per <= limit
    if not ok: fails.append(name)
    print("  %-14s %4d회  %s %.3f  (기준 ≤%.3f)  %s" % (name, cnt, unit, per, limit, "" if ok else "🚨"))

print("═══ %s — 문장 %d · 문단 %d\n" % (sys.argv[1].split("/")[-2], len(sents), len(paras)))

dash = body.count("—")
line("줄표(—)", dash, dash / max(1, len(paras)), 1.0, "문단당")
jeok = len(re.findall(r"[가-힣]적(?:으로|인|\s)", body))
line("~적(的)", jeok, jeok / n, 0.02)
deul = len(re.findall(r"(?<!받아)(?<!만)(?<!다)[가-힣]들(?:이|을|은|에|과|의)", body))   # 받아들이다·만들다·다들 오탐 제외
line("복수 ~들", deul, deul / n, 0.02)

jn = sum(1 for x in sents if any(k in x for k in JARGON))
print("  %-14s %4d문장  비율 %d%%  (기준 ≤30%%)  %s" % ("전문용어", jn, jn * 100 // n, "" if jn / n <= 0.30 else "🚨"))
if jn / n > 0.30: fails.append("전문용어")

print("\n═══ 판단 어미 분포 (한 표현이 60%% 넘으면 편중)")
tot = sum(body.count(e) for e in ENDINGS) or 1
for e in ENDINGS:
    c = body.count(e)
    if c: print("  %-16s %3d  %2d%%" % (e, c, c * 100 // tot))
top = max(body.count(e) for e in ENDINGS)
if top / tot > 0.6:
    fails.append("어미 편중"); print("  🚨 한 어미가 %d%% — 분산 필요" % (top * 100 // tot))

print("\n═══ 판정: %s" % ("PASS" if not fails else "FAIL — " + " · ".join(fails)))
sys.exit(1 if fails else 0)
