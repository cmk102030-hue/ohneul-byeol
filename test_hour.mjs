// 시주 역추정 — 12후보 산출 검증 (정주영: 1915-11-25 시각 미상, 庚 일간)
import { getMyeongsik, hourCandidates, OHAENG_KO } from "./lib/myeongsik.ts";
const m = getMyeongsik("1915-11-25", "", "M", { placeId: "chuncheon", timeUnknown: true });
const cs = hourCandidates(m);
console.log(`일간 ${m.ilgan} · 후보 ${cs.length}개\n`);
console.log("시지  시주   시간대        시간십성  시지십성  오행(木火土金水)   새 관계");
for (const c of cs) {
  const oh = ["木","火","土","金","水"].map((k) => c.ohaeng[k]).join("");
  const rel = c.newRelations.map((r) => `${r.kind}${r.chars}`).join(" ") || "-";
  console.log(`${c.zhiKo}   ${c.ganzhi}  ${c.range}  ${c.ganSipseong.padEnd(4)}  ${c.zhiSipseong.padEnd(4)}  ${oh}          ${rel}`);
}
