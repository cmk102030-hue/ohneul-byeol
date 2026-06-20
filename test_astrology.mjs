// 점성 3중융합 엔진 검증 — 달자리·상승궁(ascendant)을 astronomy-engine 오라클로 독립 대조.
// 실행: node --import ./ts-resolve.mjs test_astrology.mjs
import { getMoonSign, getRising, getAstrology, signFromLongitude } from "./lib/astrology.ts";
import { birthInstantUTC, koreaUtcOffsetMin, SEOUL_LON, SEOUL_LAT } from "./lib/timezone.ts";
import * as A from "astronomy-engine";

let pass = 0, fail = 0;
function ok(label, cond, extra = "") {
  console.log(`  ${cond ? "✅" : "❌"} ${label}${extra ? " — " + extra : ""}`);
  cond ? pass++ : fail++;
}
const D2R = Math.PI / 180, R2D = 180 / Math.PI;
const mod360 = (x) => ((x % 360) + 360) % 360;

console.log("=== 1. 시대별 UTC 변환(birthInstantUTC) — 서머타임 반영 ===");
{
  // 1987-07-15 12:00 KST(서머타임 UTC+10) → UTC 02:00
  const u1 = birthInstantUTC("1987-07-15", "12:00");
  ok("1987-07-15 12:00 KST → UTC 02:00", u1.toISOString() === "1987-07-15T02:00:00.000Z", u1.toISOString());
  // 1987-12-15 12:00 KST(평시 UTC+9) → UTC 03:00
  const u2 = birthInstantUTC("1987-12-15", "12:00");
  ok("1987-12-15 12:00 KST → UTC 03:00", u2.toISOString() === "1987-12-15T03:00:00.000Z", u2.toISOString());
  ok("1987 서머타임 오프셋 +600", koreaUtcOffsetMin(1987, 7, 15, 12, 0) === 600);
  ok("1987 겨울 오프셋 +540", koreaUtcOffsetMin(1987, 12, 15, 12, 0) === 540);
}

console.log("\n=== 2. 달자리 — 라이브러리 EclipticGeoMoon 오라클 대조 ===");
{
  // 2000-01-01 09:00 KST = 2000-01-01 00:00 UTC, 달 황경 217.3°(전갈)
  const ms = getMoonSign("2000-01-01", "09:00");
  ok("2000-01-01 09:00 KST 달자리 = Scorpio", ms.english === "Scorpio", ms.korean);
  // 임의 날짜들: getMoonSign이 라이브러리 직접계산 sign과 일치하는가
  for (const [bd, bt] of [["1996-05-28", "12:00"], ["1987-07-15", "00:20"], ["2010-03-03", "18:40"], ["1975-11-09", "06:00"]]) {
    const t = A.MakeTime(birthInstantUTC(bd, bt));
    const lon = A.EclipticGeoMoon(t).lon;
    const oracle = signFromLongitude(lon);
    const got = getMoonSign(bd, bt);
    ok(`${bd} ${bt} 달자리 = 오라클`, got.english === oracle.english, `${got.korean} (황경 ${lon.toFixed(1)}°)`);
  }
}

console.log("\n=== 3. 상승궁 — 동쪽 지평선 검증 + 공개함수 일치 ===");
{
  // 독립 재계산: 같은 공식으로 asc 황경 산출 → 라이브러리 지평선 변환으로 alt≈0·동쪽 확인 → getRising 사인과 대조.
  function ascLongitude(bd, bt) {
    const utc = birthInstantUTC(bd, bt);
    const t = A.MakeTime(utc);
    const ramc = mod360(A.SiderealTime(t) * 15 + SEOUL_LON);
    const jd = utc.getTime() / 86400000 + 2440587.5;
    const T = (jd - 2451545.0) / 36525;
    const eps = (23.439291 - 0.0130042 * T - 1.64e-7 * T * T + 5.04e-7 * T * T * T) * D2R;
    const th = ramc * D2R, phi = SEOUL_LAT * D2R;
    return mod360(Math.atan2(Math.cos(th), -(Math.sin(th) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))) * R2D);
  }
  function horizonOf(bd, bt, lon) {
    const utc = birthInstantUTC(bd, bt);
    const t = A.MakeTime(utc);
    const l = lon * D2R;
    const eqd = A.RotateVector(A.Rotation_ECT_EQD(t), { x: Math.cos(l), y: Math.sin(l), z: 0, t });
    const sph = A.EquatorFromVector(eqd);
    const obs = new A.Observer(SEOUL_LAT, SEOUL_LON, 38);
    return A.Horizon(t, obs, sph.ra, sph.dec, null); // 굴절 제외 → 기하 고도≈0
  }
  for (const [bd, bt] of [["1996-05-28", "12:00"], ["1987-07-14", "23:48"], ["2001-11-21", "07:30"], ["1980-08-15", "03:10"]]) {
    const lon = ascLongitude(bd, bt);
    const h = horizonOf(bd, bt, lon);
    const eastern = Math.abs(h.altitude) < 0.01 && h.azimuth > 0 && h.azimuth < 180;
    ok(`${bd} ${bt} ascendant 동쪽 지평선`, eastern, `alt=${h.altitude.toFixed(4)}° az=${h.azimuth.toFixed(1)}°`);
    const got = getRising(bd, bt);
    ok(`${bd} ${bt} getRising = 검증 황경 사인`, got.english === signFromLongitude(lon).english, `${got.korean} (asc ${lon.toFixed(1)}°)`);
  }
}

console.log("\n=== 4. getAstrology — 3중 구조 + timeKnown 토글 ===");
{
  const full = getAstrology("1996-05-28", "12:00", true);
  ok("sun·moon·rising 3종 존재", !!full.sun && !!full.moon && !!full.rising, `${full.sun.korean}/${full.moon.korean}/${full.rising.korean}`);
  const noTime = getAstrology("1996-05-28", "12:00", false);
  ok("timeKnown=false → rising null, moon 유지", noTime.rising === null && !!noTime.moon, noTime.moon.korean);
}

console.log(`\n=== 결과: ${pass} pass / ${fail} fail ===`);
if (fail > 0) process.exit(1);
