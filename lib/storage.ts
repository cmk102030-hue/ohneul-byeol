"use client";

export type BirthProfile = {
  birthDate: string; // yyyy-mm-dd
  birthTime: string; // HH:MM
  mbti?: string;
  nickname?: string;
};

const PROFILE_KEY = "horoscope-kr.profile";
const COLLECTION_KEY = "horoscope-kr.collection"; // { [cardId]: { firstDrawnAt: yyyy-mm-dd, count: number } }

export function loadProfile(): BirthProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BirthProfile;
  } catch {
    return null;
  }
}

export function saveProfile(p: BirthProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

export function clearProfile() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PROFILE_KEY);
  window.localStorage.removeItem(COLLECTION_KEY);
}

export type CollectionEntry = { firstDrawnAt: string; count: number };
export type Collection = Record<string, CollectionEntry>;

export function loadCollection(): Collection {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(COLLECTION_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Collection;
  } catch {
    return {};
  }
}

export function recordCardDraw(cardId: string, date: string) {
  if (typeof window === "undefined") return;
  const col = loadCollection();
  const prev = col[cardId];
  col[cardId] = {
    firstDrawnAt: prev?.firstDrawnAt ?? date,
    count: (prev?.count ?? 0) + 1,
  };
  window.localStorage.setItem(COLLECTION_KEY, JSON.stringify(col));
}
