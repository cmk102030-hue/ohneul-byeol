// ── 명식(命式) 전체 산출 ─────────────────────────────────────────────────
// lunar-javascript가 주는 것(8글자·십성·지장간·12운성·납음·공망·대운)을 한글로 정규화하고,
// 주지 않는 것(오행 개수·지지/천간 관계)을 여기서 계산한다. 신살·귀인은 v1 범위 밖.
// @ts-expect-error - no types for lunar-javascript
import { Solar } from "lunar-javascript";
import { getBaZi, type BaZi, type SajuOptions } from "./saju";
import { placeName } from "./solar-time";

export type Gender = "M" | "F";

/** 시각 미상일 때 채택한 추정 시지. 여덟 글자를 채우되 확정과 구분한다. */
export type MyeongsikOptions = SajuOptions & { estimatedHourZhi?: string };

// ── 한글 변환 ────────────────────────────────────────────────────────────
const GAN_KO: Record<string, string> = { 甲:"갑", 乙:"을", 丙:"병", 丁:"정", 戊:"무", 己:"기", 庚:"경", 辛:"신", 壬:"임", 癸:"계" };
const ZHI_KO: Record<string, string> = { 子:"자", 丑:"축", 寅:"인", 卯:"묘", 辰:"진", 巳:"사", 午:"오", 未:"미", 申:"신", 酉:"유", 戌:"술", 亥:"해" };
const SIPSEONG_KO: Record<string, string> = {
  "比肩":"비견", "劫财":"겁재", "劫財":"겁재", "食神":"식신", "伤官":"상관", "傷官":"상관",
  "偏财":"편재", "偏財":"편재", "正财":"정재", "正財":"정재", "七杀":"편관", "七殺":"편관",
  "正官":"정관", "偏印":"편인", "正印":"정인", "日主":"일간",
};
const DISHI_KO: Record<string, string> = {
  "长生":"장생", "沐浴":"목욕", "冠带":"관대", "临官":"건록", "帝旺":"제왕", "衰":"쇠",
  "病":"병", "死":"사", "墓":"묘", "绝":"절", "胎":"태", "养":"양",
};
const NAYIN_KO: Record<string, string> = {
  "海中金":"해중금","炉中火":"노중화","大林木":"대림목","路旁土":"노방토","剑锋金":"검봉금","山头火":"산두화",
  "涧下水":"간하수","城头土":"성두토","白蜡金":"백랍금","杨柳木":"양류목","泉中水":"천중수","屋上土":"옥상토",
  "霹雳火":"벽력화","松柏木":"송백목","长流水":"장류수","砂中金":"사중금", "沙中金":"사중금","山下火":"산하화","平地木":"평지목",
  "壁上土":"벽상토","金箔金":"금박금","覆灯火":"복등화","天河水":"천하수","大驿土":"대역토","钗钏金":"차천금",
  "桑柘木":"상자목","大溪水":"대계수","沙中土":"사중토","天上火":"천상화","石榴木":"석류목","大海水":"대해수",
};
const ko = (m: Record<string, string>, s: string) => m[s] ?? s;

const GAN12 = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const ZHI12 = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
// 일간별 자시(子時) 천간 — 甲己→甲子 / 乙庚→丙子 / 丙辛→戊子 / 丁壬→庚子 / 戊癸→壬子
const JASI_GAN: Record<string, string> = {
  甲:"甲", 己:"甲", 乙:"丙", 庚:"丙", 丙:"戊", 辛:"戊", 丁:"庚", 壬:"庚", 戊:"壬", 癸:"壬",
};
const ganzhiKo = (gz: string) => gz.length === 2 ? `${ko(GAN_KO, gz[0])}${ko(ZHI_KO, gz[1])}` : gz;

// ── 오행 ─────────────────────────────────────────────────────────────────
export type Ohaeng = "木" | "火" | "土" | "金" | "水";
export const OHAENG_KO: Record<Ohaeng, string> = { 木:"목", 火:"화", 土:"토", 金:"금", 水:"수" };
// 지장간(支藏干) — 여기·중기·본기 순. 마지막이 본기(정기).
// lunar-javascript의 HideGan은 순서가 일정치 않아 표준 테이블을 직접 보유한다.
const HIDE_GAN: Record<string, string[]> = {
  子:["壬","癸"], 丑:["癸","辛","己"], 寅:["戊","丙","甲"], 卯:["甲","乙"],
  辰:["乙","癸","戊"], 巳:["戊","庚","丙"], 午:["丙","己","丁"], 未:["丁","乙","己"],
  申:["戊","壬","庚"], 酉:["庚","辛"], 戌:["辛","丁","戊"], 亥:["戊","甲","壬"],
};

const ELEMENT: Record<string, Ohaeng> = {
  甲:"木", 乙:"木", 寅:"木", 卯:"木",
  丙:"火", 丁:"火", 巳:"火", 午:"火",
  戊:"土", 己:"土", 辰:"土", 戌:"土", 丑:"土", 未:"土",
  庚:"金", 辛:"金", 申:"金", 酉:"金",
  壬:"水", 癸:"水", 亥:"水", 子:"水",
};

// ── 지지·천간 관계 ───────────────────────────────────────────────────────
const pair = (a: string, b: string) => [a, b].sort().join("");
const TABLE = (list: string[], label: string) =>
  Object.fromEntries(list.map((s) => [pair(s[0], s[1]), label]));

const GAN_HAP = TABLE(["甲己","乙庚","丙辛","丁壬","戊癸"], "천간합");
const GAN_CHUNG = TABLE(["甲庚","乙辛","丙壬","丁癸"], "천간충");
const YUKHAP = TABLE(["子丑","寅亥","卯戌","辰酉","巳申","午未"], "육합");
const CHUNG = TABLE(["子午","丑未","寅申","卯酉","辰戌","巳亥"], "충");
const PA = TABLE(["子酉","卯午","辰丑","戌未","寅亥","巳申"], "파");
const HAE = TABLE(["子未","丑午","寅巳","卯辰","申亥","酉戌"], "해");
const WONJIN = TABLE(["子未","丑午","寅酉","卯申","辰亥","巳戌"], "원진");
const GWIMUN = TABLE(["子酉","丑午","寅未","卯申","辰亥","巳戌"], "귀문");
const SAMHAP: ReadonlyArray<{ set: string[]; name: string }> = [
  { set: ["申","子","辰"], name: "수국(申子辰)" },
  { set: ["亥","卯","未"], name: "목국(亥卯未)" },
  { set: ["寅","午","戌"], name: "화국(寅午戌)" },
  { set: ["巳","酉","丑"], name: "금국(巳酉丑)" },
];
const BANGHAP: ReadonlyArray<{ set: string[]; name: string }> = [
  { set: ["寅","卯","辰"], name: "목방(寅卯辰)" },
  { set: ["巳","午","未"], name: "화방(巳午未)" },
  { set: ["申","酉","戌"], name: "금방(申酉戌)" },
  { set: ["亥","子","丑"], name: "수방(亥子丑)" },
];
const SAMHYEONG = [["寅","巳","申"], ["丑","戌","未"]];

export type Relation = { kind: string; chars: string; between: string; note?: string };

const POS = ["년", "월", "일", "시"];

function branchRelations(zhi: string[]): Relation[] {
  const out: Relation[] = [];
  const idx: number[][] = [];
  for (let i = 0; i < zhi.length; i++) for (let j = i + 1; j < zhi.length; j++) idx.push([i, j]);
  for (const [i, j] of idx) {
    if (!zhi[i] || !zhi[j]) continue;
    const k = pair(zhi[i], zhi[j]);
    const between = `${POS[i]}지·${POS[j]}지`;
    const chars = `${zhi[i]}${zhi[j]}`;
    for (const t of [CHUNG, YUKHAP, PA, HAE, WONJIN, GWIMUN]) {
      if (t[k]) out.push({ kind: t[k], chars, between });
    }
    if (zhi[i] === zhi[j] && ["辰","午","酉","亥"].includes(zhi[i])) {
      out.push({ kind: "자형", chars, between });
    }
  }
  const present = zhi.filter(Boolean);
  for (const { set, name } of SAMHAP) {
    const hit = set.filter((s) => present.includes(s));
    if (hit.length === 3) out.push({ kind: "삼합", chars: hit.join(""), between: name });
    else if (hit.length === 2) out.push({ kind: "반합", chars: hit.join(""), between: name, note: `${set.find((s) => !hit.includes(s))} 대기` });
  }
  for (const { set, name } of BANGHAP) {
    const hit = set.filter((s) => present.includes(s));
    if (hit.length === 3) out.push({ kind: "방합", chars: hit.join(""), between: name });
  }
  for (const set of SAMHYEONG) {
    const hit = set.filter((s) => present.includes(s));
    if (hit.length === 3) out.push({ kind: "삼형", chars: hit.join(""), between: set.join("") });
  }
  return out;
}

function stemRelations(gan: string[]): Relation[] {
  const out: Relation[] = [];
  for (let i = 0; i < gan.length; i++) for (let j = i + 1; j < gan.length; j++) {
    if (!gan[i] || !gan[j]) continue;
    const k = pair(gan[i], gan[j]);
    const between = `${POS[i]}간·${POS[j]}간`;
    const chars = `${gan[i]}${gan[j]}`;
    if (GAN_HAP[k]) out.push({ kind: "천간합", chars, between });
    if (GAN_CHUNG[k]) out.push({ kind: "천간충", chars, between });
  }
  return out;
}

// ── 명식 타입 ────────────────────────────────────────────────────────────
export type Pillar = {
  position: "년주" | "월주" | "일주" | "시주";
  ganzhi: string; ganzhiKo: string;
  gan: string; ganKo: string; ganElement: Ohaeng | null; ganSipseong: string;
  zhi: string; zhiKo: string; zhiElement: Ohaeng | null;
  zhiSipseong: string;      // 본기(정기) 기준 대표 십성 — 만세력 표기와 동일
  hideGanSipseong: string[]; // 지장간 각각의 십성
  hideGan: string[]; naYin: string; diShi: string; xunKong: string;
  unknown: boolean;
  estimated: boolean;   // 추정으로 채운 기둥 — 확정과 구분해 표시한다
};

export type DaeUn = { ganzhi: string; ganzhiKo: string; startAge: number; startYear: number; endYear: number; sipseong: string; isCurrent: boolean };

export type Myeongsik = {
  bazi: BaZi;
  gender: Gender;
  pillars: Pillar[];
  ilgan: string; ilganKo: string; ilganElement: Ohaeng | null;
  ohaeng: Record<Ohaeng, number>;            // 확정 기둥만 — 본문 서술의 기준
  ohaengEst: Record<Ohaeng, number> | null;  // 추정 시주 포함
  relations: Relation[];                     // 확정 기둥만
  relationsEst: Relation[];                  // 추정 시주가 새로 만드는 관계
  hourEstimated: boolean;
  daeun: { forward: boolean; startAge: number; list: DaeUn[] };
  jeolip: { prev: { name: string; at: string }; next: { name: string; at: string }; daysFromPrev: number; daysToNext: number; boundary: boolean };
  correction: { placeName: string; solarOffsetMin: number; eotMin: number; totalOffsetMin: number; correctedTime: string; hourBoundaryMin: number | null };
};

export function getMyeongsik(
  birthDate: string, birthTime: string, gender: Gender, opts: MyeongsikOptions = {},
): Myeongsik {
  const estZhi = opts.estimatedHourZhi;
  const bazi = getBaZi(birthDate, birthTime, opts);
  const [by] = birthDate.split("-").map((s) => parseInt(s, 10));

  const [y, mo, d] = birthDate.split("-").map((s) => parseInt(s, 10));
  const [hh, mm] = bazi.timeUnknown ? [12, 0] : birthTime.split(":").map((s) => parseInt(s, 10));
  const corrected = new Date(y, mo - 1, d, hh, mm + bazi.totalOffsetMin);
  const solar = Solar.fromYmdHms(corrected.getFullYear(), corrected.getMonth() + 1, corrected.getDate(), corrected.getHours(), corrected.getMinutes(), 0);
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();

  const ilganChar = bazi.ilgan;
  const keys = ["Year", "Month", "Day", "Time"] as const;
  const labels = ["년주", "월주", "일주", "시주"] as const;
  // 시각 미상 + 추정 시지가 주어지면 여덟 글자를 채운다. 사람은 태어난 순간이 있으므로
  // 시주는 반드시 존재한다 — 모른다고 비우지 않고, 대신 추정임을 표시한다.
  const estGanzhi = (estZhi && bazi.timeUnknown)
    ? GAN12[(GAN12.indexOf(JASI_GAN[bazi.ilgan]) + ZHI12.indexOf(estZhi)) % 10] + estZhi
    : "";
  const pillars: Pillar[] = keys.map((k, i) => {
    const est = k === "Time" && bazi.timeUnknown && !!estGanzhi;
    const unknown = k === "Time" && bazi.timeUnknown && !estGanzhi;
    const gz: string = est ? estGanzhi : (unknown ? "" : ec[`get${k}`]());
    const gan = gz.charAt(0), zhi = gz.charAt(1);
    return {
      position: labels[i],
      ganzhi: gz, ganzhiKo: ganzhiKo(gz),
      gan, ganKo: ko(GAN_KO, gan), ganElement: ELEMENT[gan] ?? null,
      ganSipseong: unknown ? "" : (k === "Day" ? "일간" : sipseongKo(ilganChar, gan)),
      zhi, zhiKo: ko(ZHI_KO, zhi), zhiElement: ELEMENT[zhi] ?? null,
      zhiSipseong: unknown || !zhi ? "" : sipseongKo(ilganChar, (HIDE_GAN[zhi] ?? []).slice(-1)[0] ?? ""),
      hideGanSipseong: unknown || !zhi ? [] : (HIDE_GAN[zhi] ?? []).map((g) => sipseongKo(ilganChar, g)),
      hideGan: unknown || !zhi ? [] : (HIDE_GAN[zhi] ?? []),
      naYin: unknown ? "" : ko(NAYIN_KO, ec[`get${k}NaYin`]()),
      diShi: unknown || est ? "" : ko(DISHI_KO, ec[`get${k}DiShi`]()),
      xunKong: unknown || est ? "" : ec[`get${k}XunKong`](),
      unknown,
      estimated: est,
    };
  });

  // 오행·관계는 **확정 기둥만**으로 센다. 추정 시주는 별도로 병기한다 —
  // 본문 서술이 확정분 위에서만 이루어지므로 도판의 기준도 같아야 한다.
  const hourEstimated = pillars.some((p) => p.estimated);
  const fixed = pillars.filter((p) => !p.estimated && !p.unknown);
  const known2 = pillars.filter((p) => !p.unknown);
  const count = (ps: Pillar[]) => {
    const o: Record<Ohaeng, number> = { 木:0, 火:0, 土:0, 金:0, 水:0 };
    for (const q of ps) { if (q.ganElement) o[q.ganElement]++; if (q.zhiElement) o[q.zhiElement]++; }
    return o;
  };
  const ohaeng = count(fixed);
  const ohaengEst = hourEstimated ? count(known2) : null;

  const relations = [
    ...stemRelations(fixed.map((q) => q.gan)),
    ...branchRelations(fixed.map((q) => q.zhi)),
  ];
  const relAll = [
    ...stemRelations(known2.map((q) => q.gan)),
    ...branchRelations(known2.map((q) => q.zhi)),
  ];
  const seenRel = new Set(relations.map((r) => r.kind + r.chars));
  const relationsEst = hourEstimated ? relAll.filter((r) => !seenRel.has(r.kind + r.chars)) : [];

  // 대운 — 나이는 만나이(대운 시작연도 − 출생연도) 기준. 만세력 앱 표기와 일치한다.
  const yun = ec.getYun(gender === "M" ? 1 : 0);
  const thisYear = new Date().getFullYear();
  // 대운수 = 기운(起運)까지의 년수. 만세력 표기와 맞추려면 개월을 반올림한다.
  //   케이스 A 5년11월 → 6 / 케이스 B 9년5월 → 9 (캡처 실측 일치)
  const daeunSu = Math.round(yun.getStartYear() + yun.getStartMonth() / 12);
  const list: DaeUn[] = yun.getDaYun()
    .filter((dd: any) => !!dd.getGanZhi())
    .map((dd: any, i: number) => {
      const sy = dd.getStartYear(), ey = dd.getEndYear();
      const gz = dd.getGanZhi();
      return {
        ganzhi: gz, ganzhiKo: ganzhiKo(gz),
        startAge: daeunSu + i * 10, startYear: sy, endYear: ey,
        sipseong: sipseongKo(ilganChar, gz.charAt(0)),
        isCurrent: thisYear >= sy && thisYear <= ey,
      };
    });

  // 월주가 바뀌는 건 節뿐이다(氣는 월건을 바꾸지 않는다) → 경계 판정은 節 기준.
  const prev = lunar.getPrevJie(), next = lunar.getNextJie();
  const ms = (jq: any) => new Date(jq.getSolar().toYmdHms().replace(" ", "T")).getTime();
  const dayMs = 86400000;
  const daysFromPrev = Math.floor((corrected.getTime() - ms(prev)) / dayMs);
  const daysToNext = Math.floor((ms(next) - corrected.getTime()) / dayMs);

  // 시진 경계까지 남은 분 (정시법: 짝수 정시 기준 2시간 단위)
  let hourBoundaryMin: number | null = null;
  if (!bazi.timeUnknown) {
    const m = corrected.getHours() * 60 + corrected.getMinutes();
    const since = ((m + 60) % 120); // 23:00 시작 자시 기준 오프셋
    hourBoundaryMin = Math.min(since, 120 - since);
  }

  return {
    bazi, gender, pillars,
    ilgan: bazi.ilgan, ilganKo: ko(GAN_KO, bazi.ilgan), ilganElement: ELEMENT[bazi.ilgan] ?? null,
    ohaeng, ohaengEst, relations, relationsEst, hourEstimated,
    daeun: { forward: yun.isForward(), startAge: list.length ? list[0].startAge : 0, list },
    jeolip: {
      prev: { name: prev.getName(), at: prev.getSolar().toYmdHms() },
      next: { name: next.getName(), at: next.getSolar().toYmdHms() },
      daysFromPrev, daysToNext, boundary: daysFromPrev <= 3 || daysToNext <= 3,
    },
    correction: {
      placeName: placeName(bazi.placeId),
      solarOffsetMin: bazi.solarOffsetMin, eotMin: bazi.eotMin,
      totalOffsetMin: bazi.totalOffsetMin, correctedTime: bazi.correctedTime,
      hourBoundaryMin,
    },
  };
}

export const sipseongKo = (dayGan: string, target: string) => ko(SIPSEONG_KO, shiShenOfStem(dayGan, target));

// 일간 기준 어떤 천간의 십성 (대운·세운 천간용)
const GAN_ORDER = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const SIPSEONG_BY_DELTA = ["比肩","劫财","食神","伤官","偏财","正财","七杀","正官","偏印","正印"];
function shiShenOfStem(dayGan: string, target: string): string {
  const di = GAN_ORDER.indexOf(dayGan), ti = GAN_ORDER.indexOf(target);
  if (di < 0 || ti < 0) return "";
  // 양간 기준 순환. 음양 동일 여부로 정/편 결정 → lunar 표준 배열과 동일하게 매핑.
  const sameParity = di % 2 === ti % 2;
  const step = ((Math.floor(ti / 2) - Math.floor(di / 2)) + 5) % 5;
  return SIPSEONG_BY_DELTA[step * 2 + (sameParity ? 0 : 1)];
}

// ── 시주 역추정 ──────────────────────────────────────────────────────────
// 출생 시각을 모를 때 여덟 글자를 여섯 글자로 줄이지 않는다. 12개 후보를 모두 세우고
// 각 후보가 명식을 어떻게 바꾸는지 계산해, 성격·자녀·말년 양상으로 좁힐 근거를 만든다.
// 시주는 대운에 영향을 주지 않는다(대운은 월주+년간 음양+성별로 결정) — 바뀌는 것은
// 시간·시지의 십성, 오행 개수, 합충 관계, 12운성이다.

const HOUR_RANGE: Record<string, string> = {
  子:"23:00~01:00", 丑:"01:00~03:00", 寅:"03:00~05:00", 卯:"05:00~07:00",
  辰:"07:00~09:00", 巳:"09:00~11:00", 午:"11:00~13:00", 未:"13:00~15:00",
  申:"15:00~17:00", 酉:"17:00~19:00", 戌:"19:00~21:00", 亥:"21:00~23:00",
};

export type HourCandidate = {
  zhi: string; zhiKo: string; ganzhi: string; ganzhiKo: string;
  range: string;                 // 진태양시 기준 시간대
  ganSipseong: string;           // 시간 십성
  zhiSipseong: string;           // 시지 십성(본기)
  ohaeng: Record<Ohaeng, number>; // 이 후보를 넣었을 때의 오행 분포
  newRelations: Relation[];       // 이 후보가 새로 만드는 합충
  diShi: string;                  // 일간 기준 12운성
};

/** 출생 시각 미상일 때 12개 시주 후보를 전부 세운다. */
export function hourCandidates(m: Myeongsik): HourCandidate[] {
  const ilgan = m.ilgan;
  const startGan = JASI_GAN[ilgan];
  const si = GAN12.indexOf(startGan);
  const known = m.pillars.slice(0, 3);            // 년·월·일
  const baseZhi = known.map((p) => p.zhi);
  const baseGan = known.map((p) => p.gan);

  return ZHI12.map((zhi, i) => {
    const gan = GAN12[(si + i) % 10];
    const gz = gan + zhi;
    const oh: Record<Ohaeng, number> = { 木:0, 火:0, 土:0, 金:0, 水:0 };
    for (const p of known) {
      if (p.ganElement) oh[p.ganElement]++;
      if (p.zhiElement) oh[p.zhiElement]++;
    }
    if (ELEMENT[gan]) oh[ELEMENT[gan]]++;
    if (ELEMENT[zhi]) oh[ELEMENT[zhi]]++;

    const allZhi = [...baseZhi, zhi];
    const allGan = [...baseGan, gan];
    const before = new Set([...stemRelations(baseGan), ...branchRelations(baseZhi)].map((r) => r.kind + r.chars));
    const after = [...stemRelations(allGan), ...branchRelations(allZhi)];

    return {
      zhi, zhiKo: ko(ZHI_KO, zhi), ganzhi: gz, ganzhiKo: ganzhiKo(gz),
      range: HOUR_RANGE[zhi],
      ganSipseong: sipseongKo(ilgan, gan),
      zhiSipseong: sipseongKo(ilgan, (HIDE_GAN[zhi] ?? []).slice(-1)[0] ?? ""),
      ohaeng: oh,
      newRelations: after.filter((r) => !before.has(r.kind + r.chars)),
      diShi: "",
    };
  });
}
