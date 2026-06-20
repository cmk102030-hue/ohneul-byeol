// Phase 0 만세력 검증 — 진태양시 보정 전/후 비교
import lunar from "lunar-javascript";
const { Solar } = lunar;

const OFFSET = -32; // 서울 진태양시 보정(분)

function bazi(y, mo, d, h, mi, correct = false) {
  let cy = y, cmo = mo, cd = d, ch = h, cmi = mi;
  if (correct) {
    const t = new Date(y, mo - 1, d, h, mi + OFFSET);
    cy = t.getFullYear(); cmo = t.getMonth() + 1; cd = t.getDate(); ch = t.getHours(); cmi = t.getMinutes();
  }
  const ec = Solar.fromYmdHms(cy, cmo, cd, ch, cmi, 0).getLunar().getEightChar();
  return `${ec.getYear()} ${ec.getMonth()} ${ec.getDay()} ${ec.getTime()}`;
}

console.log("=== 진태양시 보정 전/후 (年 月 日 時) ===");
console.log("\n[A] 일반 1990-05-15 14:30  (시진 내부 → 불변 기대)");
console.log("  보정前:", bazi(1990,5,15,14,30), "\n  보정後:", bazi(1990,5,15,14,30,true));
console.log("\n[B] 시진경계 1990-05-15 13:10  (時柱 교정 기대)");
console.log("  보정前:", bazi(1990,5,15,13,10), "\n  보정後:", bazi(1990,5,15,13,10,true));
console.log("\n[C] 자정직후 2000-06-15 00:20  (日柱 교정 기대)");
console.log("  보정前:", bazi(2000,6,15,0,20), "\n  보정後:", bazi(2000,6,15,0,20,true));
console.log("\n[E] 절기검증 정오(보정 무관 확인)");
console.log("  2024설날 02-10:", bazi(2024,2,10,12,0,true), "(年 甲辰·月 寅 기대)");
console.log("  입춘前 02-03:", bazi(2024,2,3,12,0,true), "(年 癸卯 기대)");
