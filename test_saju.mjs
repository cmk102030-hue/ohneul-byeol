// 사주 만세력 엔진 검증 — 진태양시 보정(시대별 표준시·서머타임) + 윤달 + 절기.
// Node 22.6+/24: .ts 타입 스트리핑으로 실제 lib/saju.ts(getBaZi)를 직접 import해 검증.
import { getBaZi } from "./lib/saju.ts";
import lunar from "lunar-javascript";
const { Solar } = lunar;

let pass = 0, fail = 0;
function eq(label, got, want) {
  const ok = got === want;
  console.log(`  ${ok ? "✅" : "❌"} ${label}: ${got}${ok ? "" : ` (기대 ${want})`}`);
  ok ? pass++ : fail++;
}

// 독립 오라클: 보정분을 직접 적용해 만세력 시주를 계산(엔진과 무관한 경로).
function eightCharWithOffset(y, mo, d, hh, mm, offMin) {
  const t = new Date(y, mo - 1, d, hh, mm + offMin);
  const ec = Solar.fromYmdHms(t.getFullYear(), t.getMonth() + 1, t.getDate(), t.getHours(), t.getMinutes(), 0)
    .getLunar().getEightChar();
  return `${ec.getYear()} ${ec.getMonth()} ${ec.getDay()} ${ec.getTime()}`;
}

console.log("=== 1. 시대별 진태양시 보정값(solarOffsetMin) — IANA tz DB 기준 ===");
eq("1996-05-28 (UTC+9 현행)",        getBaZi("1996-05-28", "12:00").solarOffsetMin, -32);
eq("1987-07-15 (1987 서머타임)",     getBaZi("1987-07-15", "00:30").solarOffsetMin, -92);
eq("1987-12-15 (1987 겨울 평시)",    getBaZi("1987-12-15", "00:30").solarOffsetMin, -32);
eq("1988-05-08 03:00 (DST 시작 직후)", getBaZi("1988-05-08", "03:00").solarOffsetMin, -92);
eq("1988-05-08 01:00 (DST 시작 직전)", getBaZi("1988-05-08", "01:00").solarOffsetMin, -32);
eq("1958-07-01 (UTC+8:30 + 서머타임)", getBaZi("1958-07-01", "12:00").solarOffsetMin, -62);
eq("1958-12-01 (UTC+8:30 평시)",     getBaZi("1958-12-01", "12:00").solarOffsetMin, -2);
eq("1960-07-01 (UTC+8:30 + 서머타임)", getBaZi("1960-07-01", "12:00").solarOffsetMin, -62);
eq("1962-07-01 (UTC+9 환원 후)",     getBaZi("1962-07-01", "12:00").solarOffsetMin, -32);
eq("1950-06-15 (1950 서머타임)",     getBaZi("1950-06-15", "12:00").solarOffsetMin, -92);

console.log("\n=== 2. 보정이 실제 사주(時柱·日柱)에 반영되는가 (독립 오라클 대조) ===");
{
  // 1987 서머타임 자정 인근: −92분 보정 시 전날로 넘어가 日柱·時柱가 −32 가정과 달라야 정상.
  const got = getBaZi("1987-07-15", "00:20").korean.replace(/ · /g, " ");
  eq("1987-07-15 00:20 사주 = (−92 보정 오라클)", got, eightCharWithOffset(1987, 7, 15, 0, 20, -92));
  const naive32 = eightCharWithOffset(1987, 7, 15, 0, 20, -32);
  console.log(`  ℹ️  −32 순진보정이면 "${naive32}" → 서머타임 미반영 시 日/時柱 오류 발생`);
}
{
  const got = getBaZi("1958-07-01", "00:40").korean.replace(/ · /g, " ");
  eq("1958-07-01 00:40 사주 = (−62 보정 오라클)", got, eightCharWithOffset(1958, 7, 1, 0, 40, -62));
}

console.log("\n=== 3. 윤달(閏月) 음수 버그 수정 — 절대값 + isLeapMonth 플래그 ===");
{
  const b = getBaZi("2020-06-01", "12:00"); // 2020 윤4월
  eq("2020-06-01 lunar.month 양수", b.lunar.month, 4);
  eq("2020-06-01 isLeapMonth", b.lunar.isLeapMonth, true);
  const p = getBaZi("1996-05-28", "12:00"); // 평달 대조
  eq("1996-05-28 isLeapMonth(평달)", p.lunar.isLeapMonth, false);
  eq("1996-05-28 lunar.month", p.lunar.month, 4);
}

console.log("\n=== 4. 절기(節氣) 경계 — 입춘 기준 년주 분기 ===");
eq("2024-02-10 년주(설날 이후·입춘 지남)", getBaZi("2024-02-10", "12:00").year, "甲辰");
eq("2024-02-03 년주(입춘 전)",            getBaZi("2024-02-03", "12:00").year, "癸卯");

console.log(`\n=== 결과: ${pass} pass / ${fail} fail ===`);
if (fail > 0) process.exit(1);
