import { NextRequest, NextResponse } from "next/server";

// ── API 라우트 보호 (P0): origin 체크 + IP rate-limit ───────────────
// 분산 backend = Upstash Redis REST(키 있으면 자동). 키 없으면 in-memory fallback
// (serverless 인스턴스별·콜드스타트마다 리셋 → best-effort. 운영은 Upstash 권장).
// Upstash는 fetch REST라 npm 의존성 0. 환경변수만 넣으면 분산 모드로 자동 승급.

const UP_URL = process.env.UPSTASH_REDIS_REST_URL;
const UP_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const hasUpstash = !!(UP_URL && UP_TOKEN);

const memHits = new Map<string, { count: number; resetAt: number }>();

async function upstash(cmd: (string | number)[]): Promise<unknown> {
  const path = cmd.map((c) => encodeURIComponent(String(c))).join("/");
  const res = await fetch(`${UP_URL}/${path}`, {
    headers: { Authorization: `Bearer ${UP_TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  return (await res.json()).result;
}

export function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

// 자기 사이트에서 온 fetch만 허용 → 외부 스크립트(curl 등) 직접 호출 1차 차단.
export function originAllowed(req: NextRequest): boolean {
  const src = req.headers.get("origin") || req.headers.get("referer") || "";
  const isProd = process.env.NODE_ENV === "production";

  if (!src) {
    // origin·referer 둘 다 없음 = 서버-서버/curl → 운영에선 차단, dev는 허용
    return !isProd;
  }
  if (!isProd && /localhost|127\.0\.0\.1/.test(src)) return true;

  const allow = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (allow.length === 0) {
    // ALLOWED_ORIGINS 미설정 시: 같은 host의 referer면 허용 (무설정 graceful).
    const host = req.headers.get("host");
    return host ? src.includes(host) : false;
  }
  return allow.some((a) => src.startsWith(a));
}

export async function rateLimit(
  id: string,
  limit: number,
  windowSec: number,
): Promise<{ ok: boolean; remaining: number }> {
  if (hasUpstash) {
    try {
      const key = `rl:${id}`;
      const count = (await upstash(["INCR", key])) as number;
      if (count === 1) await upstash(["EXPIRE", key, windowSec]);
      return { ok: count <= limit, remaining: Math.max(0, limit - count) };
    } catch {
      // Upstash 장애 → in-memory로 degrade (서비스 중단보다 느슨한 보호가 낫다)
    }
  }
  const now = Date.now();
  if (memHits.size > 5000) {
    for (const [k, v] of memHits) if (now > v.resetAt) memHits.delete(k);
  }
  const cur = memHits.get(id);
  if (!cur || now > cur.resetAt) {
    memHits.set(id, { count: 1, resetAt: now + windowSec * 1000 });
    return { ok: true, remaining: limit - 1 };
  }
  cur.count += 1;
  return { ok: cur.count <= limit, remaining: Math.max(0, limit - cur.count) };
}

// 통합 가드: 통과 → null / 차단 → NextResponse(403·429). LLM 라우트 POST 첫 줄에 사용.
export async function guardRequest(
  req: NextRequest,
  route: string,
  opts: { perMin: number; perDay?: number },
): Promise<NextResponse | null> {
  if (!originAllowed(req)) {
    return NextResponse.json({ error: "허용되지 않은 요청 출처입니다." }, { status: 403 });
  }
  const ip = clientIp(req);
  const minute = await rateLimit(`${route}:min:${ip}`, opts.perMin, 60);
  if (!minute.ok) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }
  if (opts.perDay) {
    const day = await rateLimit(`${route}:day:${ip}`, opts.perDay, 86400);
    if (!day.ok) {
      return NextResponse.json(
        { error: "오늘 사용 한도에 도달했습니다. 내일 다시 만나요." },
        { status: 429, headers: { "Retry-After": "3600" } },
      );
    }
  }
  return null;
}
