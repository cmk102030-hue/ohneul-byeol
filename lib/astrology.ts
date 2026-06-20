import * as Astronomy from "astronomy-engine";
import { SEOUL_LON, SEOUL_LAT, birthInstantUTC } from "./timezone";

export type ZodiacInfo = {
  korean: string;
  english: string;
  element: "불" | "흙" | "공기" | "물";
  modality: "활동궁" | "고정궁" | "변통궁";
  rulingPlanet: string;
  symbol: string;
  keywords: string[];
};

const Z: Record<string, ZodiacInfo> = {
  aries: { korean: "양자리", english: "Aries", element: "불", modality: "활동궁", rulingPlanet: "화성", symbol: "♈", keywords: ["용기", "충동", "리더십"] },
  taurus: { korean: "황소자리", english: "Taurus", element: "흙", modality: "고정궁", rulingPlanet: "금성", symbol: "♉", keywords: ["안정", "고집", "감각"] },
  gemini: { korean: "쌍둥이자리", english: "Gemini", element: "공기", modality: "변통궁", rulingPlanet: "수성", symbol: "♊", keywords: ["호기심", "변덕", "재치"] },
  cancer: { korean: "게자리", english: "Cancer", element: "물", modality: "활동궁", rulingPlanet: "달", symbol: "♋", keywords: ["감수성", "보호", "추억"] },
  leo: { korean: "사자자리", english: "Leo", element: "불", modality: "고정궁", rulingPlanet: "태양", symbol: "♌", keywords: ["자존", "관대", "표현"] },
  virgo: { korean: "처녀자리", english: "Virgo", element: "흙", modality: "변통궁", rulingPlanet: "수성", symbol: "♍", keywords: ["분석", "완벽", "실용"] },
  libra: { korean: "천칭자리", english: "Libra", element: "공기", modality: "활동궁", rulingPlanet: "금성", symbol: "♎", keywords: ["균형", "조화", "관계"] },
  scorpio: { korean: "전갈자리", english: "Scorpio", element: "물", modality: "고정궁", rulingPlanet: "명왕성", symbol: "♏", keywords: ["깊이", "집착", "변환"] },
  sagittarius: { korean: "사수자리", english: "Sagittarius", element: "불", modality: "변통궁", rulingPlanet: "목성", symbol: "♐", keywords: ["자유", "탐험", "낙천"] },
  capricorn: { korean: "염소자리", english: "Capricorn", element: "흙", modality: "활동궁", rulingPlanet: "토성", symbol: "♑", keywords: ["야망", "책임", "절제"] },
  aquarius: { korean: "물병자리", english: "Aquarius", element: "공기", modality: "고정궁", rulingPlanet: "천왕성", symbol: "♒", keywords: ["독립", "혁신", "거리감"] },
  pisces: { korean: "물고기자리", english: "Pisces", element: "물", modality: "변통궁", rulingPlanet: "해왕성", symbol: "♓", keywords: ["감성", "꿈", "공감"] },
};

/**
 * 생일(yyyy-mm-dd) → 태양 별자리(sun sign). 통념(달력 구간) 기준 룩업.
 */
export function getZodiac(birthDate: string): ZodiacInfo {
  const [, mStr, dStr] = birthDate.split("-");
  const m = parseInt(mStr, 10);
  const d = parseInt(dStr, 10);
  const key = m * 100 + d;

  if (key >= 321 && key <= 419) return Z.aries;
  if (key >= 420 && key <= 520) return Z.taurus;
  if (key >= 521 && key <= 620) return Z.gemini;
  if (key >= 621 && key <= 722) return Z.cancer;
  if (key >= 723 && key <= 822) return Z.leo;
  if (key >= 823 && key <= 922) return Z.virgo;
  if (key >= 923 && key <= 1022) return Z.libra;
  if (key >= 1023 && key <= 1121) return Z.scorpio;
  if (key >= 1122 && key <= 1221) return Z.sagittarius;
  if (key >= 1222 || key <= 119) return Z.capricorn;
  if (key >= 120 && key <= 218) return Z.aquarius;
  return Z.pisces; // 2/19 ~ 3/20
}

// ── 점성 3중융합 엔진 (태양·달·상승궁) ────────────────────────────────────
// 황도 좌표는 천문 라이브러리(astronomy-engine·검증된 ephemeris)로 계산. 회귀(tropical) 황대.
// 달자리: 출생 순간 달의 황경 → 별자리. 상승궁(ascendant): 출생 시각·장소(서울)의 동쪽 지평선 황도점.
// 시각·장소 의존이라 출생시각 정확도에 민감(상승궁은 분 단위, 달은 ~2.3일 단위로 둔감).

// 황경 0°=양자리 기점, 30° 간격 12궁 순서.
const SIGNS: readonly ZodiacInfo[] = [
  Z.aries, Z.taurus, Z.gemini, Z.cancer, Z.leo, Z.virgo,
  Z.libra, Z.scorpio, Z.sagittarius, Z.capricorn, Z.aquarius, Z.pisces,
];

const mod360 = (x: number) => ((x % 360) + 360) % 360;

/** 황경(°) → 회귀 황대 별자리. */
export function signFromLongitude(lonDeg: number): ZodiacInfo {
  return SIGNS[Math.floor(mod360(lonDeg) / 30) % 12];
}

/** 평균 황도경사(°). T = J2000 기준 율리우스 세기. (장동 ~9″은 별자리 판정에 무의미) */
function meanObliquityDeg(date: Date): number {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const T = (jd - 2451545.0) / 36525;
  return 23.439291 - 0.0130042 * T - 1.64e-7 * T * T + 5.04e-7 * T * T * T;
}

/** 달자리 — 출생 순간 달의 황경 기준. */
export function getMoonSign(birthDate: string, birthTime: string): ZodiacInfo {
  const t = Astronomy.MakeTime(birthInstantUTC(birthDate, birthTime));
  const moon = Astronomy.EclipticGeoMoon(t); // 회귀 황경(of-date)
  return signFromLongitude(moon.lon);
}

/** 상승궁(ascendant) — 출생 시각·서울 위경도의 동쪽 지평선에 떠오르는 황도점. 정확한 출생시각 필요. */
export function getRising(birthDate: string, birthTime: string): ZodiacInfo {
  const utc = birthInstantUTC(birthDate, birthTime);
  const t = Astronomy.MakeTime(utc);
  const gastHours = Astronomy.SiderealTime(t); // 그리니치 겉보기 항성시(시)
  const ramcDeg = mod360(gastHours * 15 + SEOUL_LON); // 지역 항성시 = MC 적경(°)
  const D2R = Math.PI / 180;
  const th = ramcDeg * D2R;
  const eps = meanObliquityDeg(utc) * D2R;
  const phi = SEOUL_LAT * D2R;
  // 동쪽 지평선 황도점(검증: 라이브러리 지평선 변환으로 alt≈0·방위 동쪽 확인).
  const ascDeg = mod360(
    Math.atan2(Math.cos(th), -(Math.sin(th) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))) / D2R,
  );
  return signFromLongitude(ascDeg);
}

export type AstrologyChart = {
  sun: ZodiacInfo;
  moon: ZodiacInfo;
  rising: ZodiacInfo | null; // 출생시각 미상 시 null
};

/** 태양·달·상승궁 3중 별자리. timeKnown=false(출생시각 미상)면 상승궁 생략(달·태양은 유지). */
export function getAstrology(birthDate: string, birthTime: string, timeKnown = true): AstrologyChart {
  return {
    sun: getZodiac(birthDate),
    moon: getMoonSign(birthDate, birthTime),
    rising: timeKnown ? getRising(birthDate, birthTime) : null,
  };
}
