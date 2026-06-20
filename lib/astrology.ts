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
 * 생일(yyyy-mm-dd) → 태양 별자리(sun sign).
 * V1: 단순 일자 룩업. V2에서 Swiss Ephemeris 행성 차트 추가.
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
