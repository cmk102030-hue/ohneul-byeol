"use client";

// Phase 1 측정 셋업 — 익명 uuid + 핵심 4 이벤트(visit/draw/share/referrer)
// 게이트 측정 목표: K-factor 0.2+ / D7 리텐션 / DAU (direction_research_2026-06-08.md)
// 전송: Vercel Analytics custom event(track) + localStorage 자체 보조 측정(코호트 export용)

import { track } from "@vercel/analytics";

const UID_KEY = "horoscope-kr.uid";
const FIRST_SEEN_KEY = "horoscope-kr.firstSeen"; // yyyy-mm-dd
const VISIT_DAYS_KEY = "horoscope-kr.visitDays"; // string[] — 방문일(자체 D7/DAU 보조)

function todayKST(): string {
  const d = new Date(Date.now() + 9 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

function genUid(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* fallthrough */
  }
  return "u_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** 익명 식별자 — 없으면 생성·저장. draw→share 연결, 코호트 분석용. */
export function getUid(): string {
  if (typeof window === "undefined") return "";
  let uid = window.localStorage.getItem(UID_KEY);
  if (!uid) {
    uid = genUid();
    window.localStorage.setItem(UID_KEY, uid);
  }
  return uid;
}

/** 유입 출처 분류 — 공유 URL(?ref=/?utm_source=) 우선, 그다음 document.referrer 도메인. */
function classifyReferrer(): { source: string; ref: string } {
  if (typeof window === "undefined") return { source: "unknown", ref: "" };
  // 공유 URL 식별자(Phase 2 K-loop에서 OG/공유 링크에 부착)
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref") || params.get("utm_source") || "";
  if (ref) return { source: ref.toLowerCase().slice(0, 32), ref: ref.slice(0, 64) };

  const r = document.referrer;
  if (!r) return { source: "direct", ref: "" };
  try {
    const host = new URL(r).hostname.replace(/^www\./, "");
    if (host === window.location.hostname) return { source: "internal", ref: "" };
    if (host.includes("instagram")) return { source: "instagram", ref: "" };
    if (host.includes("kakao") || host.includes("kko")) return { source: "kakao", ref: "" };
    if (host.includes("threads")) return { source: "threads", ref: "" };
    if (host === "t.co" || host.includes("twitter") || host.includes("x.com")) return { source: "twitter", ref: "" };
    if (host.includes("facebook") || host === "fb.com") return { source: "facebook", ref: "" };
    if (host.includes("naver")) return { source: "naver", ref: "" };
    if (host.includes("google")) return { source: "google", ref: "" };
    if (host.includes("daum")) return { source: "daum", ref: "" };
    return { source: host.slice(0, 32), ref: "" };
  } catch {
    return { source: "other", ref: "" };
  }
}

let visitTracked = false;

/** 방문 — 세션당 1회. 신규 여부·유입 출처·재방문 일수 기록. K-factor/리텐션 backbone. */
export function trackVisit(): void {
  if (typeof window === "undefined" || visitTracked) return;
  visitTracked = true;

  const uid = getUid();
  const today = todayKST();

  const firstSeen = window.localStorage.getItem(FIRST_SEEN_KEY);
  const isNew = !firstSeen;
  if (isNew) window.localStorage.setItem(FIRST_SEEN_KEY, today);

  let days: string[] = [];
  try {
    days = JSON.parse(window.localStorage.getItem(VISIT_DAYS_KEY) || "[]");
  } catch {
    days = [];
  }
  if (!days.includes(today)) {
    days.push(today);
    window.localStorage.setItem(VISIT_DAYS_KEY, JSON.stringify(days.slice(-90)));
  }

  const daysSinceFirst = firstSeen
    ? Math.max(0, Math.round((Date.parse(today) - Date.parse(firstSeen)) / 86400000))
    : 0;

  const { source, ref } = classifyReferrer();
  track("visit", {
    uid,
    source,
    ref,
    isNew,
    daysSinceFirst,
    visitDays: days.length,
  });
}

/** 카드 뽑기 성공 — 신규 카드 여부 포함(컬렉션 진척·재방문 동기). */
export function trackDraw(cardId: string, isNewCard: boolean): void {
  if (typeof window === "undefined") return;
  track("draw", { uid: getUid(), cardId, isNewCard });
}

/** 공유 실행 — Web Share API vs 다운로드 fallback 구분(K-factor 분자). cardId="compat"면 궁합 공유. */
export function trackShare(method: "webshare" | "download", cardId: string): void {
  if (typeof window === "undefined") return;
  track("share", { uid: getUid(), method, cardId });
}

/** 친구 궁합 생성 — 소셜그래프 진입(K-factor 핵심 동력). */
export function trackCompat(score: number): void {
  if (typeof window === "undefined") return;
  track("compat", { uid: getUid(), score });
}
