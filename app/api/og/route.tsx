import { ImageResponse } from "next/og";
import { CARDS, getCardById } from "@/lib/cards";

export const runtime = "edge";

const FONT_URL =
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Black.otf";
const FONT_BOLD_URL =
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Bold.otf";

const TONE_LABEL: Record<string, string> = {
  warm: "다정",
  cynical: "시니컬",
  darkComedy: "블랙코미디",
  tsundere: "츤데레",
  traditional: "진중",
};

const GRADIENT_TO_COLORS: Record<string, [string, string]> = {
  "from-emerald-300 to-cyan-400": ["#6ee7b7", "#22d3ee"],
  "from-purple-400 to-fuchsia-500": ["#c084fc", "#d946ef"],
  "from-indigo-400 to-violet-600": ["#818cf8", "#7c3aed"],
  "from-pink-400 to-rose-500": ["#f472b6", "#f43f5e"],
  "from-red-500 to-orange-600": ["#ef4444", "#ea580c"],
  "from-amber-400 to-yellow-600": ["#fbbf24", "#ca8a04"],
  "from-rose-400 to-pink-600": ["#fb7185", "#db2777"],
  "from-sky-400 to-blue-600": ["#38bdf8", "#2563eb"],
  "from-yellow-400 to-orange-500": ["#facc15", "#f97316"],
  "from-slate-400 to-zinc-700": ["#94a3b8", "#3f3f46"],
  "from-teal-400 to-emerald-600": ["#2dd4bf", "#059669"],
  "from-cyan-400 to-blue-500": ["#22d3ee", "#3b82f6"],
  "from-blue-400 to-indigo-600": ["#60a5fa", "#4f46e5"],
  "from-zinc-600 to-slate-900": ["#52525b", "#0f172a"],
  "from-rose-600 to-red-900": ["#e11d48", "#7f1d1d"],
  "from-orange-500 to-red-700": ["#f97316", "#b91c1c"],
  "from-sky-300 to-violet-500": ["#7dd3fc", "#8b5cf6"],
  "from-indigo-500 to-purple-800": ["#6366f1", "#6b21a8"],
  "from-yellow-300 to-orange-500": ["#fde047", "#f97316"],
  "from-violet-400 to-fuchsia-600": ["#a78bfa", "#c026d3"],
  "from-emerald-500 to-cyan-700": ["#10b981", "#0e7490"],
};

async function loadFont(url: string): Promise<ArrayBuffer | null> {
  try {
    const r = await fetch(url, { cache: "force-cache" });
    if (!r.ok) return null;
    return await r.arrayBuffer();
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cardId = searchParams.get("card") ?? CARDS[0].id;
  const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const nickname = searchParams.get("nickname") ?? "";
  const tone = searchParams.get("tone") ?? "warm";
  const zodiac = searchParams.get("zodiac") ?? "";
  const mbti = searchParams.get("mbti") ?? "";
  const horoscope = (searchParams.get("horoscope") ?? "").replace(/^\[MOCK[^\]]*\]\s*/, "").slice(0, 140);
  const host = (searchParams.get("host") ?? "").replace(/^www\./, "");

  const card = getCardById(cardId) ?? CARDS[0];
  const [c1, c2] = GRADIENT_TO_COLORS[card.gradient] ?? ["#c4a3ff", "#6ee7ff"];
  const dateLabel = date.replace(/-/g, ".");
  const persona = [zodiac, mbti].filter(Boolean).join(" · ");
  const toneLabel = TONE_LABEL[tone] ?? tone;
  const footerMeta = [toneLabel, persona, nickname && `${nickname}님께`]
    .filter(Boolean)
    .join("  ·  ");
  const siteLabel = host || "오늘의 별";

  const [fontBlack, fontBold] = await Promise.all([
    loadFont(FONT_URL),
    loadFont(FONT_BOLD_URL),
  ]);

  const fonts = [];
  if (fontBlack) fonts.push({ name: "Pretendard", data: fontBlack, weight: 900 as const, style: "normal" as const });
  if (fontBold) fonts.push({ name: "Pretendard", data: fontBold, weight: 700 as const, style: "normal" as const });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: `linear-gradient(160deg, ${c1} 0%, ${c2} 60%, #0a0814 100%)`,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.6) 100%)",
            display: "flex",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            padding: "100px 80px 0",
          }}
        >
          <div style={{ fontSize: 30, letterSpacing: 6, color: "rgba(255,255,255,0.85)", fontWeight: 700, display: "flex" }}>
            ★ {dateLabel}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", marginTop: 28, gap: 24 }}>
            <span style={{ fontSize: 180, fontWeight: 900, color: "#fff", lineHeight: 0.95, letterSpacing: -4 }}>
              {String(card.number).padStart(2, "0")}
            </span>
            <span style={{ fontSize: 110, fontWeight: 900, color: "#fff", lineHeight: 0.95, letterSpacing: -3 }}>
              {card.name}
            </span>
          </div>
          <div style={{ fontSize: 34, color: "rgba(255,255,255,0.7)", marginTop: 14, fontWeight: 700, display: "flex" }}>
            {card.english}
          </div>
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: 300, lineHeight: 1, color: "#fff", display: "flex", textShadow: `0 0 70px ${c1}` }}>
            {card.symbol}
          </div>
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            padding: "0 80px 80px",
            gap: 24,
          }}
        >
          <div style={{ display: "flex", gap: 12 }}>
            {card.keywords.map((k) => (
              <div
                key={k}
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  color: "#fff",
                  background: "rgba(0,0,0,0.4)",
                  padding: "10px 22px",
                  borderRadius: 999,
                  display: "flex",
                }}
              >
                #{k}
              </div>
            ))}
          </div>

          {horoscope ? (
            <div
              style={{
                background: "rgba(0,0,0,0.58)",
                borderRadius: 28,
                padding: "30px 34px",
                border: "1px solid rgba(255,255,255,0.22)",
                boxShadow: `0 0 60px -8px ${c1}`,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ fontSize: 21, letterSpacing: 5, color: "rgba(255,255,255,0.78)", fontWeight: 900, marginBottom: 12, display: "flex" }}>
                오늘의 운세
              </div>
              <div style={{ fontSize: 42, fontWeight: 900, color: "#fff", lineHeight: 1.4, display: "flex" }}>
                {horoscope}
              </div>
            </div>
          ) : null}

          <div
            style={{
              background: "rgba(0,0,0,0.4)",
              borderRadius: 22,
              padding: "20px 28px",
              border: "1px solid rgba(255,255,255,0.14)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ fontSize: 18, letterSpacing: 4, color: "rgba(255,255,255,0.6)", fontWeight: 900, marginBottom: 8, display: "flex" }}>
              오늘의 미션
            </div>
            <div style={{ fontSize: 30, fontWeight: 700, color: "rgba(255,255,255,0.92)", lineHeight: 1.3, display: "flex" }}>
              {card.mission}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 20,
              fontWeight: 700,
              color: "rgba(255,255,255,0.55)",
              letterSpacing: 3,
              marginTop: 2,
            }}
          >
            <div style={{ display: "flex" }}>{footerMeta}</div>
            <div style={{ display: "flex" }}>★ {siteLabel}</div>
          </div>

          <div style={{ display: "flex", fontSize: 16, color: "rgba(255,255,255,0.42)", fontWeight: 700, letterSpacing: 1 }}>
            재미·참고용 콘텐츠예요 · 의료·법률·재무 결정의 근거가 아니에요
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      fonts: fonts.length > 0 ? fonts : undefined,
    },
  );
}
