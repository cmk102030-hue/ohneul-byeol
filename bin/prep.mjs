#!/usr/bin/env node
// ① prep — 명식을 산출해 리포트 생성용 입력 파일을 만든다.
// 사용: node --import ./ts-resolve.mjs bin/prep.mjs 1988-10-20 16:30 M seoul [이름]
//       시각 미상이면 시각 자리에 "?" 를 넣는다.
import fs from "node:fs";
import path from "node:path";
import { getMyeongsik } from "../lib/myeongsik.ts";
import { BIRTH_PLACES } from "../lib/solar-time.ts";

const argv = process.argv.slice(2);
const usage = `사용:
  prep.mjs <YYYY-MM-DD> <HH:MM|?> <M|F> [출생지id] [이름]
  prep.mjs --person <id>            # data/people.json에서 조회
  prep.mjs --list                   # 등록된 인물 목록
출생지: ${BIRTH_PLACES.map((p) => p.id).join(" ")}`;

// ── 인물 DB 조회 ──────────────────────────────────────────────────────────
const DB = "data/people.json";
const db = fs.existsSync(DB) ? JSON.parse(fs.readFileSync(DB, "utf8")) : { people: {} };
if (argv[0] === "--list") {
  for (const [id, p] of Object.entries(db.people)) {
    const t = p.confidence?.time === "verified" ? p.birthTime : "시각미상";
    console.log(`  ${id.padEnd(18)} ${p.name}  ${p.birthDate} ${t}  ${p.gender}  ${p.publicUse ? "공개가능" : "⛔비공개"}`);
  }
  process.exit(0);
}
let date, time, gender, place, name, estHour;
if (argv[0] === "--person") {
  const p = db.people[argv[1]];
  if (!p) { console.error(`인물 없음: ${argv[1]}\n등록: node --import ./ts-resolve.mjs bin/prep.mjs --list`); process.exit(1); }
  // ⚠️ 시각은 confidence.time === "verified" 일 때만 쓴다. 추정치로 명식을 세우지 않는다.
  const useTime = p.confidence?.time === "verified" && p.birthTime;
  [date, time, gender, place, name] = [p.birthDate, useTime ? p.birthTime : "?", p.gender, p.placeId ?? "seoul", p.name];
  if (!useTime && p.estimatedHour?.zhi) {
    estHour = p.estimatedHour.zhi;
    console.log(`   🕐 시주 추정 ${p.estimatedHour.ganzhi} (${p.estimatedHour.range}) · 확신도 ${p.estimatedHour.confidence}`);
  }
  console.log(`📖 ${p.name} — 날짜 ${p.confidence?.date} / 시각 ${p.confidence?.time} / 장소 ${p.confidence?.place}`);
  if (!useTime && p.birthTime) console.log(`   ⚠️ 시각 "${p.birthTime}"이 있으나 confidence=${p.confidence?.time} → 사용하지 않음`);
  if (p.publicUse === false) console.log(`   ⛔ publicUse=false — 공개 콘텐츠로 쓰지 말 것`);
} else {
  [date, time, gender, place = "seoul", name = ""] = argv;
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "") || !["M", "F"].includes(gender)) {
  console.error(usage); process.exit(1);
}
const timeUnknown = time === "?" || !/^\d{1,2}:\d{2}$/.test(time || "");

const m = getMyeongsik(date, timeUnknown ? "" : time, gender, { placeId: place, timeUnknown, estimatedHourZhi: estHour });
const cols = [...m.pillars].reverse(); // 시 일 월 년
const row = (label, pick) => `| ${label} | ${cols.map(pick).map((v) => v || "—").join(" | ")} |`;
const c = m.correction;
const cur = m.daeun.list.find((d) => d.isCurrent);
const birthYear = +date.slice(0, 4);

const md = `# 명식 데이터 — ${name || "무명"}
생년월일시: ${date} ${timeUnknown ? "(시각 미상)" : time} · ${gender === "M" ? "남명" : "여명"} · 출생지 ${c.placeName}
음력: ${m.bazi.lunar.year}-${m.bazi.lunar.month}-${m.bazi.lunar.day}${m.bazi.lunar.isLeapMonth ? " (윤달)" : ""} · ${m.bazi.zodiacAnimal}띠

## 1. 원국

| | 시주 | 일주 | 월주 | 년주 |
|---|---|---|---|---|
${row("천간 십성", (p) => p.ganSipseong)}
${row("천간", (p) => `${p.gan}(${p.ganKo})`)}
${row("지지", (p) => `${p.zhi}(${p.zhiKo})`)}
${row("지지 십성", (p) => p.zhiSipseong)}
${row("지장간", (p) => p.hideGan.join(""))}
${row("12운성", (p) => p.diShi)}
${row("납음", (p) => p.naYin)}

일간: **${m.ilgan}(${m.ilganKo})** · 오행 ${m.ilganElement ?? "?"}
오행 개수: ${Object.entries(m.ohaeng).map(([k, v]) => `${k}${v}`).join(" ")}
공망: [年]${m.pillars[0].xunKong} [日]${m.pillars[2].xunKong}

## 2. 합·충·형·파·해
${m.relations.length ? m.relations.map((r) => `- **${r.kind}** ${r.chars} — ${r.note ?? r.between}`).join("\n") : "- 없음"}

## 3. 대운 (${m.daeun.forward ? "순행" : "역행"} · 대운수 ${m.daeun.startAge})
${m.daeun.list.slice(0, 9).map((d) => `- ${d.startAge}세 **${d.ganzhi}(${d.ganzhiKo})** ${d.sipseong} · ${d.startYear}~${d.endYear}${d.isCurrent ? "  ← 현재" : ""}`).join("\n")}

## 4. 명식 확정 근거
- 진태양시 보정: ${c.placeName} 경도 ${c.solarOffsetMin}분 ${c.eotMin >= 0 ? "+" : "−"} 균시차 ${Math.abs(c.eotMin)}분 = **${c.totalOffsetMin}분**${c.correctedTime ? ` → 보정 후 ${c.correctedTime}` : ""}
- 시진 경계까지: ${c.hourBoundaryMin === null ? "해당 없음(시각 미상)" : `${c.hourBoundaryMin}분`}${c.hourBoundaryMin !== null && c.hourBoundaryMin <= 20 ? "  ⚠️ **경계 케이스**" : ""}
- 절입: ${m.jeolip.prev.name} +${m.jeolip.daysFromPrev}일 / ${m.jeolip.next.name} −${m.jeolip.daysToNext}일${m.jeolip.boundary ? "  ⚠️ **경계 케이스**" : ""}
- 시진 경계 관습: 정시법(11:00~13:00 = 午時) · 진태양시 보정 ON
${timeUnknown ? "- ⚠️ 출생 시각 미상 — 시주를 산출하지 않았다. 시주에 의존하는 해석은 생략한다." : ""}

## 5. 참고
- 현재 대운: ${cur ? `${cur.startAge}세 ${cur.ganzhiKo}(${cur.sipseong}) ${cur.startYear}~${cur.endYear}` : "산출 범위 밖"}
- 나이 환산: 만나이 = 연도 − ${birthYear} (생일 지난 기준) · 전통나이 = 만나이 + 1

---

# 리포트 생성 지시

\`prompts/saju_report_v2.md\`를 read하고 그 지침대로 위 명식에 대한 리포트를 쓴다.
**§2 명식 확정 규칙은 이미 위에서 수행됐다 — 다시 계산하지 말고 위 값을 그대로 쓴다.**
§3 확신도 라벨 · §4 근거 의무 · §5 서술 규칙 · §6-B 고정 슬롯 · §7 분량 예산 · §9 자기검증 · §10 금지 단정을 지킨다.
${gender === "F" ? "**여명이다. §5-2 치환표 적용 — 관성=남편, 재성=돈만, 식상=자식.**" : "**남명이다. §5-2 치환표 적용 — 재성=아내·돈, 관성=직장·자식.**"}

출력은 \`out/${(name || date).replace(/[^\w가-힣-]/g, "")}/report.md\` 에 쓴다.
`;

const slug = (name || date).replace(/[^\w가-힣-]/g, "");
const dir = path.join("out", slug);
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, "input.md"), md);
fs.writeFileSync(path.join(dir, "myeongsik.json"), JSON.stringify(m, null, 2));
console.log(`✅ ${dir}/input.md`);
console.log(`   ${dir}/myeongsik.json`);
console.log(`   8글자: ${m.pillars.map((p) => p.ganzhi || "—").join(" ")}`);
if (c.hourBoundaryMin !== null && c.hourBoundaryMin <= 20) console.log(`   ⚠️ 시주 경계 ${c.hourBoundaryMin}분`);
if (m.jeolip.boundary) console.log(`   ⚠️ 절입 경계`);
