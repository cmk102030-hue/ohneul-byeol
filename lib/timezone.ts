// ── 한국 표준시 역사 (단일 출처) ──────────────────────────────────────────
// IANA tz DB(Asia/Seoul, zdump 실측) 기반 시대별 UTC 오프셋(분, 동경 +).
//   UTC+9(=540·1912~54·1961~現) / 서머타임 UTC+10(=600·1948-51·1987-88)
//   UTC+8:30(=510·1954-08~61-08) / 그 서머타임 UTC+9:30(=570·1955-60 여름)
// 사주(진태양시 보정)와 점성(달자리·상승궁 UTC 변환) 양쪽이 이 표 하나를 공유한다.

export const SEOUL_LON = 126.9784; // 서울 경도(°E)
export const SEOUL_LAT = 37.5665;  // 서울 위도(°N)

// 서울 평균태양시 = 경도/15 시간 → UTC 동경 분. 진태양시 보정의 기준점.
export const SEOUL_MEAN_SOLAR_MIN = (SEOUL_LON / 15) * 60; // ≈ 507.91분

// [전이 wall-clock 시각 YYYYMMDDHHMM(KST 로컬), 그 시점부터의 UTC 오프셋(분)]
// 마지막 ≤ 출생시각 항목 적용. 1908-04 이전(LMT)은 표 밖 → 평균태양시(서울)로 간주.
const UTC_OFFSET_TRANSITIONS: ReadonlyArray<readonly [number, number]> = [
  [190804010002, 510], // 대한제국 표준시 UTC+8:30
  [191201010030, 540], // 조선총독부 UTC+9 (JST)
  [194806010100, 600], [194809122300, 540], // 1948 서머타임
  [194904030100, 600], [194909102300, 540], // 1949
  [195004010100, 600], [195009092300, 540], // 1950
  [195105060100, 600], [195109082300, 540], // 1951
  [195403202330, 510], // UTC+8:30 환원
  [195505050100, 570], [195509082300, 510], // 1955 서머타임(+9:30)
  [195605200100, 570], [195609292300, 510], // 1956
  [195705050100, 570], [195709212300, 510], // 1957
  [195805040100, 570], [195809202300, 510], // 1958
  [195905030100, 570], [195909192300, 510], // 1959
  [196005010100, 570], [196009172300, 510], // 1960
  [196108100030, 540], // UTC+9 환원 (현행)
  [198705100300, 600], [198710110200, 540], // 1987 서머타임
  [198805080300, 600], [198810090200, 540], // 1988
];

/** 출생 wall-clock(KST 로컬) 시점의 한국 표준시 UTC 오프셋(분, 동경 +). */
export function koreaUtcOffsetMin(y: number, mo: number, d: number, hh: number, mm: number): number {
  const key = ((((y * 100 + mo) * 100 + d) * 100 + hh) * 100) + mm;
  let off = Math.round(SEOUL_MEAN_SOLAR_MIN); // 1908 이전 LMT ≈ 평균태양시
  for (const [at, o] of UTC_OFFSET_TRANSITIONS) {
    if (key >= at) off = o;
    else break;
  }
  return off;
}

/** 출생 wall-clock(KST) → 실제 UTC 순간(Date). 점성 계산용. */
export function birthInstantUTC(birthDate: string, birthTime: string): Date {
  const [y, mo, d] = birthDate.split("-").map((s) => parseInt(s, 10));
  const [hh, mm] = birthTime.split(":").map((s) => parseInt(s, 10));
  const offMin = koreaUtcOffsetMin(y, mo, d, hh, mm);
  // UTC = 로컬 − 오프셋
  return new Date(Date.UTC(y, mo - 1, d, hh, mm) - offMin * 60000);
}
