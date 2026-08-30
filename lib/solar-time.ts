// ── 진태양시 구성요소: 출생지 경도 + 균시차 ──────────────────────────────
// timezone.ts = 시대별 표준시(행정). 이 파일 = 천문(경도·균시차).
// 진태양시 = 표준시 − (표준시경도 − 출생지경도) + 균시차
//          = 표준시 + (출생지 평균태양시분 − 표준시 UTC오프셋분) + 균시차

/** 주요 출생지 경도(°E). 미상 시 서울. */
export const BIRTH_PLACES: ReadonlyArray<{ id: string; name: string; lon: number }> = [
  { id: "seoul", name: "서울", lon: 126.978 },
  { id: "incheon", name: "인천", lon: 126.705 },
  { id: "bundang", name: "분당/성남", lon: 127.108 },
  { id: "suwon", name: "수원/경기", lon: 127.029 },
  { id: "chuncheon", name: "춘천/강원", lon: 127.734 },
  { id: "gangneung", name: "강릉", lon: 128.896 },
  { id: "daejeon", name: "대전/충남", lon: 127.385 },
  { id: "cheongju", name: "청주/충북", lon: 127.489 },
  { id: "jeonju", name: "전주/전북", lon: 127.148 },
  { id: "gwangju", name: "광주/전남", lon: 126.851 },
  { id: "daegu", name: "대구/경북", lon: 128.601 },
  { id: "pohang", name: "포항", lon: 129.365 },
  { id: "busan", name: "부산", lon: 129.075 },
  { id: "changwon", name: "창원/경남", lon: 128.681 },
  { id: "ulsan", name: "울산", lon: 129.311 },
  { id: "jeju", name: "제주", lon: 126.531 },
  { id: "ulleung", name: "울릉/독도", lon: 130.906 },
];

export const DEFAULT_PLACE_ID = "seoul";

export function lonOf(placeId?: string): number {
  return (BIRTH_PLACES.find((p) => p.id === placeId) ?? BIRTH_PLACES[0]).lon;
}
export function placeName(placeId?: string): string {
  return (BIRTH_PLACES.find((p) => p.id === placeId) ?? BIRTH_PLACES[0]).name;
}

/** 경도의 평균태양시(분, UTC 기준 동경 +). 15°=1시간. */
export function meanSolarMin(lon: number): number {
  return (lon / 15) * 60;
}

/**
 * 균시차(Equation of Time, 분) = 진태양시 − 평균태양시.
 * NOAA 근사식. 연중 −14분(2월 중순) ~ +16분(11월 초).
 */
export function equationOfTimeMin(y: number, mo: number, d: number, hourLocal = 12): number {
  const start = Date.UTC(y, 0, 1);
  const dayOfYear = Math.floor((Date.UTC(y, mo - 1, d) - start) / 86400000) + 1;
  const g = ((2 * Math.PI) / 365) * (dayOfYear - 1 + (hourLocal - 12) / 24);
  return (
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(g) -
      0.032077 * Math.sin(g) -
      0.014615 * Math.cos(2 * g) -
      0.040849 * Math.sin(2 * g))
  );
}
