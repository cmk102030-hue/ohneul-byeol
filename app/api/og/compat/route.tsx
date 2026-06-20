import { ImageResponse } from "next/og";

export const runtime = "edge";

const FONT_URL =
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Black.otf";
const FONT_BOLD_URL =
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Bold.otf";

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
  const meName = (searchParams.get("meName") ?? "나").slice(0, 12);
  const meSymbol = searchParams.get("meSymbol") ?? "★";
  const meZodiac = searchParams.get("meZodiac") ?? "";
  const meMbti = searchParams.get("meMbti") ?? "";
  const frName = (searchParams.get("frName") ?? "상대").slice(0, 12);
  const frSymbol = searchParams.get("frSymbol") ?? "☾";
  const frZodiac = searchParams.get("frZodiac") ?? "";
  const frMbti = searchParams.get("frMbti") ?? "";
  const score = Math.max(0, Math.min(99, parseInt(searchParams.get("score") ?? "0", 10) || 0));
  const level = searchParams.get("level") ?? "";
  const text = (searchParams.get("text") ?? "").replace(/^\[MOCK[^\]]*\]\s*/, "").slice(0, 170);
  const host = (searchParams.get("host") ?? "").replace(/^www\./, "");
  const siteLabel = host || "오늘의 별";

  const c1 = "#c4a3ff";
  const c2 = "#ff8fb1";
  const meSub = [meZodiac, meMbti].filter(Boolean).join(" · ");
  const frSub = [frZodiac, frMbti].filter(Boolean).join(" · ");

  const [fontBlack, fontBold] = await Promise.all([loadFont(FONT_URL), loadFont(FONT_BOLD_URL)]);
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
          background: "linear-gradient(165deg, #1c1535 0%, #2c1c44 45%, #0a0814 100%)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -160,
            left: 190,
            width: 700,
            height: 700,
            background: `radial-gradient(circle, ${c1}3a 0%, transparent 60%)`,
            display: "flex",
          }}
        />

        {/* 헤더 */}
        <div style={{ position: "relative", display: "flex", justifyContent: "center", paddingTop: 96 }}>
          <div style={{ fontSize: 30, letterSpacing: 12, color: "rgba(255,255,255,0.72)", fontWeight: 700, display: "flex" }}>
            ★ 우리 궁합
          </div>
        </div>

        {/* 두 사람 */}
        <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 24, marginTop: 64 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 340 }}>
            <div style={{ fontSize: 150, color: "#fff", display: "flex", textShadow: `0 0 55px ${c1}` }}>{meSymbol}</div>
            <div style={{ fontSize: 40, fontWeight: 900, color: "#fff", display: "flex", marginTop: 14 }}>{meName}</div>
            <div style={{ fontSize: 24, color: "rgba(255,255,255,0.6)", display: "flex", marginTop: 6 }}>{meSub}</div>
          </div>
          <div style={{ fontSize: 88, color: c2, display: "flex", marginTop: 36 }}>♡</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 340 }}>
            <div style={{ fontSize: 150, color: "#fff", display: "flex", textShadow: `0 0 55px ${c2}` }}>{frSymbol}</div>
            <div style={{ fontSize: 40, fontWeight: 900, color: "#fff", display: "flex", marginTop: 14 }}>{frName}</div>
            <div style={{ fontSize: 24, color: "rgba(255,255,255,0.6)", display: "flex", marginTop: 6 }}>{frSub}</div>
          </div>
        </div>

        {/* 점수 */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", marginTop: 56 }}>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span style={{ fontSize: 210, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: -4, textShadow: `0 0 60px ${c1}`, display: "flex" }}>
              {score}
            </span>
            <span style={{ fontSize: 64, fontWeight: 900, color: "rgba(255,255,255,0.7)", display: "flex" }}>점</span>
          </div>
          <div style={{ fontSize: 46, fontWeight: 900, color: "#fff", display: "flex", marginTop: 2 }}>{level}</div>
        </div>

        {/* 게이지 */}
        <div style={{ position: "relative", display: "flex", margin: "38px 110px 0", height: 26, background: "rgba(255,255,255,0.12)", borderRadius: 999 }}>
          <div style={{ display: "flex", width: `${score}%`, height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${c1}, ${c2})` }} />
        </div>

        {/* 궁합 텍스트 */}
        <div style={{ position: "relative", display: "flex", flex: 1, alignItems: "flex-end", padding: "44px 80px 0" }}>
          <div
            style={{
              background: "rgba(0,0,0,0.45)",
              borderRadius: 30,
              padding: "34px 38px",
              border: "1px solid rgba(255,255,255,0.2)",
              boxShadow: `0 0 60px -10px ${c1}`,
              display: "flex",
              width: "100%",
            }}
          >
            <div style={{ fontSize: 40, fontWeight: 700, color: "#fff", lineHeight: 1.45, display: "flex" }}>{text}</div>
          </div>
        </div>

        {/* footer CTA */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 12, padding: "28px 80px 72px" }}>
          <div style={{ fontSize: 25, fontWeight: 700, color: "rgba(255,255,255,0.62)", letterSpacing: 2, display: "flex" }}>
            ★ {siteLabel} 에서 나도 궁합 보기
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: 1, display: "flex" }}>
            재미·참고용 콘텐츠예요 · 중요한 결정의 근거가 아니에요
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920, fonts: fonts.length > 0 ? fonts : undefined },
  );
}
