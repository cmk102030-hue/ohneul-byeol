// lunar-javascript: 음력·천간지지 사주 8자. CommonJS 라이브러리, 타입 정의 없음.
// @ts-expect-error - no types for lunar-javascript
import { Solar } from "lunar-javascript";
import { koreaUtcOffsetMin } from "./timezone";
import { lonOf, meanSolarMin, equationOfTimeMin, DEFAULT_PLACE_ID } from "./solar-time";

export type SajuOptions = {
  /** 출생지 id (solar-time.ts BIRTH_PLACES). 미지정 = 서울 */
  placeId?: string;
  /** 균시차 적용. 기본 true */
  useEot?: boolean;
  /** 출생시각 미상 — 시주를 산출하지 않는다 */
  timeUnknown?: boolean;
};

export type BaZi = {
  year: string; // 년주 (年柱)
  month: string; // 월주
  day: string; // 일주
  hour: string; // 시주 — timeUnknown이면 ""
  ilgan: string; // 일간 = 일주의 첫 글자 (천간) — 사주 해석 기준
  yearStem: string;
  yearBranch: string;
  korean: string; // 사람이 읽는 표기
  lunar: { year: number; month: number; day: number; isLeapMonth: boolean };
  zodiacAnimal: string; // 띠
  // ── 보정 내역 (검증·화면 노출용) ──
  solarOffsetMin: number; // 경도 보정분 (표준시 → 평균태양시)
  eotMin: number; // 균시차 분
  totalOffsetMin: number; // 실제 적용된 총 보정분
  placeId: string;
  timeUnknown: boolean;
  correctedTime: string; // 보정 후 시각 "HH:MM" — timeUnknown이면 ""
};

const ANIMAL_MAP: Record<string, string> = {
  "子": "쥐", "丑": "소", "寅": "범", "卯": "토끼",
  "辰": "용", "巳": "뱀", "午": "말", "未": "양",
  "申": "원숭이", "酉": "닭", "戌": "개", "亥": "돼지",
};

// ── 진태양시 보정 ────────────────────────────────────────────────────────
// 명리 시주는 시계시가 아니라 실제 태양 위치 기준.
//   경도 보정 = 출생지 평균태양시분 − 그 시점 한국 표준시 UTC오프셋분
//               (서울·UTC+9 → −32분 / 서머타임 −92분 / 1954~61 UTC+8:30 → −2분)
//   균시차    = 지구 궤도 이심률·자전축 경사로 인한 −14~+16분 (날짜 함수)
// caveat: 유파에 따라 표준시 그대로 쓰기도 한다. 본 엔진은 진태양시 채택.
//         시진 경계는 lunar-javascript의 정시법(11:00~13:00 = 午時)을 따른다.
export function solarCorrection(
  y: number, mo: number, d: number, hh: number, mm: number, opts: SajuOptions = {},
) {
  const placeId = opts.placeId ?? DEFAULT_PLACE_ID;
  const lonMin = meanSolarMin(lonOf(placeId));
  const solarOffsetMin = Math.round(lonMin - koreaUtcOffsetMin(y, mo, d, hh, mm));
  const eotMin = opts.useEot === false ? 0 : equationOfTimeMin(y, mo, d, hh);
  return {
    placeId,
    solarOffsetMin,
    eotMin: Math.round(eotMin * 10) / 10,
    totalOffsetMin: Math.round(solarOffsetMin + eotMin),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function getBaZi(birthDate: string, birthTime: string, opts: SajuOptions = {}): BaZi {
  const [y, mo, d] = birthDate.split("-").map((s) => parseInt(s, 10));
  const timeUnknown = !!opts.timeUnknown || !/^\d{1,2}:\d{2}$/.test(birthTime);
  // 시각 미상이면 정오로 계산한다 — 날짜 경계에서 가장 멀어 년·월·일주가 안전하다.
  // 시주는 산출하지 않는다(지어내지 않는다).
  const [hh, mm] = timeUnknown ? [12, 0] : birthTime.split(":").map((s) => parseInt(s, 10));

  const corr = solarCorrection(y, mo, d, hh, mm, opts);
  const corrected = new Date(y, mo - 1, d, hh, mm + corr.totalOffsetMin);
  const solar = Solar.fromYmdHms(
    corrected.getFullYear(), corrected.getMonth() + 1, corrected.getDate(),
    corrected.getHours(), corrected.getMinutes(), 0,
  );
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();

  const year: string = ec.getYear();
  const month: string = ec.getMonth();
  const day: string = ec.getDay();
  const hour: string = timeUnknown ? "" : ec.getTime();
  const yearBranch = year.charAt(1);

  const rawLunarMonth: number = lunar.getMonth();

  return {
    year, month, day, hour,
    ilgan: day.charAt(0),
    yearStem: year.charAt(0),
    yearBranch,
    korean: [year, month, day, hour || "시주미상"].join(" · "),
    lunar: {
      year: lunar.getYear(),
      month: Math.abs(rawLunarMonth),
      day: lunar.getDay(),
      isLeapMonth: rawLunarMonth < 0, // lunar-javascript은 윤달을 음수 월로 반환
    },
    zodiacAnimal: ANIMAL_MAP[yearBranch] ?? "?",
    solarOffsetMin: corr.solarOffsetMin,
    eotMin: corr.eotMin,
    totalOffsetMin: corr.totalOffsetMin,
    placeId: corr.placeId,
    timeUnknown,
    correctedTime: timeUnknown ? "" : `${pad(corrected.getHours())}:${pad(corrected.getMinutes())}`,
  };
}
