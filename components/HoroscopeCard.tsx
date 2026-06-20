"use client";

import type { Tone } from "@/lib/tones";

type Astrology = { korean: string; symbol: string; english: string };

const TONE_LABEL: Record<Tone, string> = {
  warm: "다정",
  cynical: "시니컬",
  darkComedy: "블랙코미디",
  tsundere: "츤데레",
  traditional: "진중",
};

export default function HoroscopeCard({
  text,
  astrology,
  mbti,
  date,
  nickname,
  tone,
  loading,
}: {
  text: string;
  astrology: Astrology | null;
  mbti: string | null;
  date: string;
  nickname?: string;
  tone: Tone;
  loading: boolean;
}) {
  const dateLabel = date.replace(/-/g, ".");
  const persona = [astrology?.symbol, astrology?.korean, mbti].filter(Boolean).join(" · ");

  return (
    <div
      className="card-glow floaty relative w-full max-w-[340px] mx-auto rounded-[32px] p-7 flex flex-col justify-between overflow-hidden"
      style={{
        aspectRatio: "9 / 16",
        background:
          "linear-gradient(160deg, #1f1138 0%, #0f1a2e 50%, #0a0814 100%)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      {/* Multi-layer glow */}
      <div
        className="absolute -top-32 -left-20 w-[160%] h-[70%] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(196,163,255,0.32) 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute -bottom-32 -right-20 w-[140%] h-[60%] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(110,231,255,0.15) 0%, transparent 70%)",
        }}
      />
      {/* Tiny star particles inside card */}
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 22% 18%, rgba(255,255,255,0.9), transparent), " +
            "radial-gradient(1px 1px at 78% 26%, rgba(196,163,255,0.7), transparent), " +
            "radial-gradient(1.5px 1.5px at 38% 72%, rgba(255,255,255,0.7), transparent), " +
            "radial-gradient(1px 1px at 82% 82%, rgba(110,231,255,0.6), transparent)",
        }}
      />

      {/* Header */}
      <div className="relative z-10">
        <div className="text-[10px] tracking-[0.24em] text-accent uppercase font-black">
          ★ {dateLabel}
        </div>
        {persona && (
          <div className="text-[11px] text-white/55 mt-1 font-semibold tracking-wide">
            {persona}
          </div>
        )}
        {nickname && (
          <div className="text-xs text-white/75 mt-2 font-bold">{nickname}님께</div>
        )}
      </div>

      {/* Main text */}
      <div className="relative z-10 flex-1 flex items-center py-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center w-full gap-3">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-accent-pink animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-accent-cyan animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <div className="text-white/40 text-xs tracking-wider">별이 말을 고르는 중</div>
          </div>
        ) : (
          <p
            className="text-[20px] leading-[1.5] font-black text-white tracking-tight"
            style={{ textShadow: "0 2px 24px rgba(196,163,255,0.3)" }}
          >
            {text}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 flex items-center justify-between text-[10px] tracking-[0.16em] uppercase">
        <span className="text-white/40 font-bold">{TONE_LABEL[tone]}</span>
        <span className="text-accent/60 font-bold">@TBD</span>
      </div>
    </div>
  );
}
