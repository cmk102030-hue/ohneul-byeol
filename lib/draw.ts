import { CARDS, type Card } from "./cards";

/**
 * 결정적 카드 뽑기 — (유저 시드 + 날짜) → 같은 날 = 같은 카드.
 * 사용자 본인은 매일 다른 카드를 받지만, 같은 날 재방문해도 같은 카드.
 * 다른 사용자는 같은 날에 다른 카드 (시드 다름).
 */

function hashString(s: string): number {
  // FNV-1a 32-bit 단순 해시
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function drawCardFor(userSeed: string, date: string): Card {
  const h = hashString(`${userSeed}::${date}`);
  return CARDS[h % CARDS.length];
}

export function buildUserSeed(birthDate: string, birthTime: string, mbti?: string | null): string {
  return `${birthDate}T${birthTime}|${mbti ?? "X"}`;
}
