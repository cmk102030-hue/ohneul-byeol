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
  lunar: { year: number; month: number; day: number };
  zodiacAnimal: string; // 띠 (쥐·소·범...)
};

const ANIMAL_MAP: Record<string, string> = {
  "子": "쥐", "丑": "소", "寅": "범", "卯": "토끼",
  "辰": "용", "巳": "뱀", "午": "말", "未": "양",
  "申": "원숭이", "酉": "닭", "戌": "개", "亥": "돼지",
};

// 진태양시 보정: 한국 표준시(동경 135°) − 서울 경도(126.98°) ≈ −32분.
// 명리 표준은 실제 태양시 기준(시계시 아님). 자정 직후 日柱·시진 경계 時柱 정확도에 직결.
// caveat: 유파에 따라 표준시 그대로 쓰기도 함(정책 결정사항) / 서머타임(1948-51·1987-88) 추가 −60분은 미반영(TODO).
const SEOUL_TRUE_SOLAR_OFFSET_MIN = -32;

export function getBaZi(birthDate: string, birthTime: string): BaZi {
  const [yStr, mStr, dStr] = birthDate.split("-");
  const [hhStr, mmStr] = birthTime.split(":");
  const y = parseInt(yStr, 10);
  const mo = parseInt(mStr, 10);
  const d = parseInt(dStr, 10);
  const hh = parseInt(hhStr, 10);
  const mm = parseInt(mmStr, 10);

  // 진태양시 보정 (Date 연산으로 날짜 경계까지 안전 처리)
  const corrected = new Date(y, mo - 1, d, hh, mm + SEOUL_TRUE_SOLAR_OFFSET_MIN);
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

  return {
    year,
    month,
    day,
    hour,
    ilgan: day.charAt(0),
    yearStem,
    yearBranch,
    korean: `${year} · ${month} · ${day} · ${hour}`,
    lunar: { year: lunar.getYear(), month: lunar.getMonth(), day: lunar.getDay() },
    zodiacAnimal: ANIMAL_MAP[yearBranch] ?? "?",
  };
}
