// 실물 만세력 캡처 2건 = 골든셋 회귀 (판독 확정 2026-08-29).
// 엔진 채택 관습: 진태양시 ON · 시진 경계 정시법(11:00~13:00=午) · 균시차 미적용 · 출생지 서울 고정.
import { getBaZi } from "./lib/saju.ts";

let pass = 0, fail = 0;
const eq = (label, got, want) => {
  const ok = got === want;
  console.log(`  ${ok ? "✅" : "❌"} ${label}\n      got  ${got}${ok ? "" : `\n      want ${want}`}`);
  ok ? pass++ : fail++;
};
const bazi = (d, t) => getBaZi(d, t).korean.replace(/ · /g, " ");

// ── A. 케이스 A 1988-10-20 16:30 남 — 서머타임 해제 11일 후, 시진 경계에서 안전(申時 중앙)
console.log("=== A. 케이스 A 1988-10-20 16:30 ===");
console.log(`  보정 ${getBaZi("1988-10-20", "16:30").solarOffsetMin}분`);
eq("8글자", bazi("1988-10-20", "16:30"), "戊辰 壬戌 戊申 庚申");

// ── B. 케이스 B 1996-08-04 11:45 여 — 보정 후 11:13, 정시법 午時 경계에서 13분
console.log("\n=== B. 케이스 B 1996-08-04 11:45 ===");
console.log(`  보정 ${getBaZi("1996-08-04", "11:45").solarOffsetMin}분`);
eq("8글자", bazi("1996-08-04", "11:45"), "丙子 乙未 癸酉 戊午");

// ── 시진 경계 관습 고정: 입력 분을 1분씩 훑어 시주가 바뀌는 지점을 찾고,
// 그 지점의 '보정 후 시각'이 정시(11:00)인지 확인한다. 보정값이 바뀌어도 자체 검증된다.
console.log("\n=== 시진 경계 = 정시법 (보정 후 11:00 기준) ===");
{
  let flipAt = null;
  for (let mm = 0; mm < 120; mm++) {
    const t = `${String(10 + Math.floor(mm / 60)).padStart(2, "0")}:${String(mm % 60).padStart(2, "0")}`;
    const prev = getBaZi("1996-08-04", `${String(10 + Math.floor((mm - 1) / 60)).padStart(2, "0")}:${String((mm - 1 + 60) % 60).padStart(2, "0")}`);
    const cur = getBaZi("1996-08-04", t);
    if (mm > 0 && prev.hour !== cur.hour) { flipAt = cur; break; }
  }
  eq("시주 전환 지점의 보정 후 시각", flipAt ? flipAt.correctedTime : "없음", "11:00");
  eq("전환 후 시주", flipAt ? flipAt.hour : "", "戊午");
}

// ── 균시차가 실제로 적용되는가 (날짜 함수여야 한다)
console.log("\n=== 균시차 ===");
{
  const aug = getBaZi("1996-08-04", "11:45").eotMin;   // 8월 초 ≈ −6분
  const nov = getBaZi("1996-11-03", "11:45").eotMin;   // 11월 초 ≈ +16분
  eq("8/4 균시차 음수", aug < 0, true);
  eq("11/3 균시차 +15분 이상", nov >= 15, true);
}

console.log(`\n${fail === 0 ? "PASS" : "FAIL"}  ${pass}/${pass + fail}`);
process.exit(fail ? 1 : 0);
