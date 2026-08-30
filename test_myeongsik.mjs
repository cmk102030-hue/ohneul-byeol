// 명식 산출 골든셋 — 실물 만세력 캡처 2건 전항목 대조 (판독 확정 2026-08-29).
import { getMyeongsik } from "./lib/myeongsik.ts";

let pass = 0, fail = 0;
const eq = (l, got, want) => {
  const ok = String(got) === String(want);
  console.log(`  ${ok ? "✅" : "❌"} ${l}: ${got}${ok ? "" : `  (기대 ${want})`}`);
  ok ? pass++ : fail++;
};

function check(title, m, want) {
  console.log(`\n=== ${title} ===`);
  console.log(`  보정 경도${m.correction.solarOffsetMin} + 균시차${m.correction.eotMin} = ${m.correction.totalOffsetMin}분 → ${m.correction.correctedTime} (경계까지 ${m.correction.hourBoundaryMin}분)`);
  eq("8글자", m.pillars.map((p) => p.ganzhi).join(" "), want.bazi);
  eq("천간 십성", m.pillars.map((p) => p.ganSipseong).join(" "), want.ganSip);
  eq("지지 십성", m.pillars.map((p) => p.zhiSipseong).join(" "), want.zhiSip);
  eq("지장간", m.pillars.map((p) => p.hideGan.join("")).join(" "), want.hide);
  eq("12운성", m.pillars.map((p) => p.diShi).join(" "), want.dishi);
  eq("납음", m.pillars.map((p) => p.naYin).join(" "), want.nayin);
  eq("오행", Object.entries(m.ohaeng).map(([k, v]) => `${k}${v}`).join(" "), want.ohaeng);
  eq("공망(년/일)", `${m.pillars[0].xunKong}/${m.pillars[2].xunKong}`, want.gongmang);
  eq("대운 순행", m.daeun.forward, want.forward);
  eq("대운 첫 나이", m.daeun.list[0].startAge, want.startAge);
  eq("대운 간지", m.daeun.list.slice(0, 5).map((d) => `${d.startAge}${d.ganzhi}`).join(" "), want.daeun);
  const cur = m.daeun.list.find((d) => d.isCurrent);
  console.log(`  ℹ️  현재 대운: ${cur ? `${cur.startAge}세 ${cur.ganzhiKo}(${cur.sipseong}) ${cur.startYear}~${cur.endYear}` : "-"}`);
  console.log(`  ℹ️  절입: ${m.jeolip.prev.name} +${m.jeolip.daysFromPrev}일 / ${m.jeolip.next.name} −${m.jeolip.daysToNext}일${m.jeolip.boundary ? "  ⚠️경계" : ""}`);
  console.log(`  ℹ️  관계: ${m.relations.map((r) => `${r.kind}(${r.chars})`).join(" ")}`);
}

// A. 케이스 A 1988-10-20 16:30 남
check("A. 케이스 A 1988-10-20 16:30 남", getMyeongsik("1988-10-20", "16:30", "M"), {
  bazi: "戊辰 壬戌 戊申 庚申", ganSip: "비견 편재 일간 식신", zhiSip: "비견 비견 식신 식신",
  hide: "乙癸戊 辛丁戊 戊壬庚 戊壬庚", dishi: "관대 묘 병 병",
  nayin: "대림목 대해수 대역토 석류목", ohaeng: "木0 火0 土4 金3 水1",
  gongmang: "戌亥/寅卯", forward: true, startAge: 6, daeun: "6癸亥 16甲子 26乙丑 36丙寅 46丁卯",
});

// B. 케이스 B 1996-08-04 11:45 여
check("B. 케이스 B 1996-08-04 11:45 여", getMyeongsik("1996-08-04", "11:45", "F"), {
  bazi: "丙子 乙未 癸酉 戊午", ganSip: "정재 식신 일간 정관", zhiSip: "비견 편관 편인 편재",
  hide: "壬癸 丁乙己 庚辛 丙己丁", dishi: "건록 묘 병 절",
  nayin: "간하수 사중금 검봉금 천상화", ohaeng: "木1 火2 土2 金1 水2",
  gongmang: "申酉/戌亥", forward: false, startAge: 9, daeun: "9甲午 19癸巳 29壬辰 39辛卯 49庚寅",
});

console.log(`\n${fail === 0 ? "PASS" : "FAIL"}  ${pass}/${pass + fail}`);
process.exit(fail ? 1 : 0);
