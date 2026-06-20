// lunar-javascript: 음력·천간지지 사주 8자. CommonJS 라이브러리, 타입 정의 없음.
// @ts-expect-error - no types for lunar-javascript
import { Solar } from "lunar-javascript";

export type BaZi = {
  year: string; // 년주 (年柱)
  month: string; // 월주
  day: string; // 일주
  hour: string; // 시주
  ilgan: string; // 일간 = 일주의 첫 글자 (천간) — 사주 해석 기준
  yearStem: string; // 년간
  yearBranch: string; // 년지
  korean: string; // 사람이 읽는 표기
  lunar: { year: number; month: number; day: number; isLeapMonth: boolean };
  zodiacAnimal: string; // 띠 (쥐·소·범...)
  solarOffsetMin: number; // 적용된 진태양시 보정(분) — 디버그·검증용
};

const ANIMAL_MAP: Record<string, string> = {
  "子": "쥐", "丑": "소", "寅": "범", "卯": "토끼",
  "辰": "용", "巳": "뱀", "午": "말", "未": "양",
  "申": "원숭이", "酉": "닭", "戌": "개", "亥": "돼지",
};

// ── 진태양시 보정 (true solar time) ──────────────────────────────────────
// 명리 표준은 시계시가 아니라 실제 태양시 기준. 보정 = −(해당 시점 한국 표준시 UTC오프셋 − 서울 평균태양시).
// 서울 경도 126.978°E → 평균태양시 = UTC+8h27.9m(30,475s). 시대별 표준시:
//   UTC+9(135°E·1912~54·1961~現)        → −32분
//   UTC+9 + 서머타임(1948-51·1987-88)    → −92분
//   UTC+8:30(127.5°E·1954-08-10~61-08-09) → −2분
//   UTC+8:30 + 서머타임(1955-60 여름)     → −62분
// 전이 시각·오프셋은 IANA tz DB(Asia/Seoul, zdump 실측) 기준. 자정 인근 日柱·일간, 시진 경계 時柱 정확도에 직결.
// caveat: 유파에 따라 표준시 그대로 쓰기도 함(정책 결정사항). 본 엔진은 진태양시 채택.

// [전이 wall-clock 시각 YYYYMMDDHHMM(KST 로컬), 보정분] — 마지막 ≤ 출생시각 항목 적용.
const SOLAR_OFFSET_TRANSITIONS: ReadonlyArray<readonly [number, number]> = [
  [190804010002, -2],  // 대한제국 표준시 UTC+8:30
  [191201010030, -32], // 조선총독부 UTC+9 (JST)
  [194806010100, -92], [194809122300, -32], // 1948 서머타임
  [194904030100, -92], [194909102300, -32], // 1949
  [195004010100, -92], [195009092300, -32], // 1950
  [195105060100, -92], [195109082300, -32], // 1951
  [195403202330, -2],  // UTC+8:30 환원
  [195505050100, -62], [195509082300, -2],  // 1955 서머타임(+8:30)
  [195605200100, -62], [195609292300, -2],  // 1956
  [195705050100, -62], [195709212300, -2],  // 1957
  [195805040100, -62], [195809202300, -2],  // 1958
  [195905030100, -62], [195909192300, -2],  // 1959
  [196005010100, -62], [196009172300, -2],  // 1960
  [196108100030, -32], // UTC+9 환원 (현행)
  [198705100300, -92], [198710110200, -32], // 1987 서머타임
  [198805080300, -92], [198810090200, -32], // 1988
];

function trueSolarOffsetMin(y: number, mo: number, d: number, hh: number, mm: number): number {
  const key = ((((y * 100 + mo) * 100 + d) * 100 + hh) * 100) + mm;
  let off = 0; // 1908-04 이전(LMT, 서울 평균태양시) ≈ 0분
  for (const [at, o] of SOLAR_OFFSET_TRANSITIONS) {
    if (key >= at) off = o;
    else break;
  }
  return off;
}

export function getBaZi(birthDate: string, birthTime: string): BaZi {
  const [yStr, mStr, dStr] = birthDate.split("-");
  const [hhStr, mmStr] = birthTime.split(":");
  const y = parseInt(yStr, 10);
  const mo = parseInt(mStr, 10);
  const d = parseInt(dStr, 10);
  const hh = parseInt(hhStr, 10);
  const mm = parseInt(mmStr, 10);

  // 진태양시 보정 (출생 시점의 시대별 표준시 기준 · Date 연산으로 날짜 경계까지 안전 처리)
  const offsetMin = trueSolarOffsetMin(y, mo, d, hh, mm);
  const corrected = new Date(y, mo - 1, d, hh, mm + offsetMin);
  const solar = Solar.fromYmdHms(
    corrected.getFullYear(),
    corrected.getMonth() + 1,
    corrected.getDate(),
    corrected.getHours(),
    corrected.getMinutes(),
    0,
  );
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();

  const year: string = ec.getYear();
  const month: string = ec.getMonth();
  const day: string = ec.getDay();
  const hour: string = ec.getTime();

  const yearStem = year.charAt(0);
  const yearBranch = year.charAt(1);

  // lunar-javascript은 윤달(閏月)을 음수 월로 반환(예: 윤4월 = -4). 절대값 + 플래그로 분리.
  const rawLunarMonth: number = lunar.getMonth();
  const lunarIsLeap = rawLunarMonth < 0;
  const lunarMonth = Math.abs(rawLunarMonth);

  return {
    year,
    month,
    day,
    hour,
    ilgan: day.charAt(0),
    yearStem,
    yearBranch,
    korean: `${year} · ${month} · ${day} · ${hour}`,
    lunar: { year: lunar.getYear(), month: lunarMonth, day: lunar.getDay(), isLeapMonth: lunarIsLeap },
    zodiacAnimal: ANIMAL_MAP[yearBranch] ?? "?",
    solarOffsetMin: offsetMin,
  };
}
