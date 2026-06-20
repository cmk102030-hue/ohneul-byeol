// ── LLM 결과 캐시 (P0): 동일 입력 = LLM 재호출 차단 → 비용 절감 ──────
// backend = Upstash Redis REST(키 있으면) or in-memory(없으면). 의존성 0.
// 운세는 (날짜+사주+별자리+MBTI+톤+카드) 키, 궁합은 (두 사람+톤) 키로 결정적.

const UP_URL = process.env.UPSTASH_REDIS_REST_URL;
const UP_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const hasUpstash = !!(UP_URL && UP_TOKEN);

const mem = new Map<string, { v: string; exp: number }>();

async function up(cmd: (string | number)[]): Promise<unknown> {
  const path = cmd.map((c) => encodeURIComponent(String(c))).join("/");
  const res = await fetch(`${UP_URL}/${path}`, {
    headers: { Authorization: `Bearer ${UP_TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  return (await res.json()).result;
}

export function cacheKey(parts: (string | number | null | undefined)[]): string {
  return "llm:" + parts.map((p) => String(p ?? "")).join("|");
}

// hit이면 캐시값, miss면 producer 실행 후 저장. producer가 throw하면 캐시하지 않고 전파.
export async function cached<T>(
  key: string,
  ttlSec: number,
  producer: () => Promise<T>,
): Promise<{ value: T; hit: boolean }> {
  if (hasUpstash) {
    try {
      const raw = await up(["GET", key]);
      if (raw) return { value: JSON.parse(raw as string) as T, hit: true };
    } catch {
      /* miss로 진행 */
    }
  } else {
    const m = mem.get(key);
    if (m && Date.now() < m.exp) return { value: JSON.parse(m.v) as T, hit: true };
  }

  const value = await producer();
  const serial = JSON.stringify(value);

  if (hasUpstash) {
    try {
      await up(["SET", key, serial, "EX", ttlSec]);
    } catch {
      /* 저장 실패는 무시 (다음 요청은 재생성) */
    }
  } else {
    if (mem.size > 2000) {
      const now = Date.now();
      for (const [k, v] of mem) if (now > v.exp) mem.delete(k);
    }
    mem.set(key, { v: serial, exp: Date.now() + ttlSec * 1000 });
  }
  return { value, hit: false };
}
