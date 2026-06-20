"use client";

import { useState, useEffect } from "react";
import type { Card } from "@/lib/cards";
import type { Tone } from "@/lib/tones";

type Astrology = { korean: string; symbol: string };

const TONE_LABEL: Record<Tone, string> = {
  warm: "다정",
  cynical: "시니컬",
  darkComedy: "블랙코미디",
  tsundere: "츤데레",
  traditional: "진중",
};

export default function CardDraw({
  card,
  horoscopeText,
  astrology,
  mbti,
  date,
  nickname,
  tone,
  loading,
  autoFlip,
}: {
  card: Card | null;
  horoscopeText: string;
  astrology: Astrology | null;
  mbti: string | null;
  date: string;
  nickname?: string;
  tone: Tone;
  loading: boolean;
  autoFlip?: boolean;
}) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setFlipped(false);
    if (autoFlip) {
      const t = setTimeout(() => setFlipped(true), 600);
      return () => clearTimeout(t);
    }
  }, [card?.id, autoFlip]);

  const dateLabel = date.replace(/-/g, ".");
  const persona = [astrology?.symbol, astrology?.korean, mbti].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col items-center w-full">
      <div
        className="card-glow floaty relative w-full max-w-[340px] mx-auto"
        style={{ perspective: "1200px", aspectRatio: "9 / 16" }}
      >
        <div
          className="relative w-full h-full transition-transform duration-[900ms]"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* BACK (default visible) */}
          <button
            onClick={() => setFlipped(true)}
            disabled={loading || !card || flipped}
            className="absolute inset-0 rounded-[32px] overflow-hidden focus:outline-none"
            style={{
              backfaceVisibility: "hidden",
              background: "linear-gradient(160deg, #2a1a4d 0%, #1a0f2e 60%, #0a0814 100%)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at center, rgba(196,163,255,0.3) 0%, transparent 65%)" }}
            />
            <div className="absolute inset-0 pointer-events-none opacity-70"
              style={{
                backgroundImage:
                  "radial-gradient(1.5px 1.5px at 20% 25%, rgba(255,255,255,0.85), transparent), " +
                  "radial-gradient(1px 1px at 78% 30%, rgba(196,163,255,0.7), transparent), " +
                  "radial-gradient(2px 2px at 40% 70%, rgba(255,255,255,0.8), transparent), " +
                  "radial-gradient(1px 1px at 70% 80%, rgba(110,231,255,0.7), transparent)",
              }}
            />
            <div className="relative h-full flex flex-col items-center justify-center gap-5 z-10">
              <div className="text-[10px] tracking-[0.3em] text-accent/80 uppercase font-black">{dateLabel}</div>
              <div className="text-[60px] floaty leading-none">✦</div>
              <div className="text-white font-black text-lg tracking-tight">오늘의 카드</div>
              <div className="text-xs text-white/50 mt-1">{loading ? "별이 카드를 고르는 중…" : card ? "탭해서 펼치기" : "잠시만"}</div>
              {nickname && <div className="text-[10px] text-white/40 mt-2">{nickname}님께</div>}
            </div>
          </button>

          {/* FRONT (revealed) */}
          <div
            className="absolute inset-0 rounded-[32px] overflow-hidden"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {card && (
              <div className={`relative w-full h-full bg-gradient-to-br ${card.gradient}`}>
                <div className="absolute inset-0"
                  style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 100%)" }}
                />
                <div className="relative h-full flex flex-col justify-between p-6 z-10">
                  <div>
                    <div className="text-[10px] tracking-[0.24em] text-white/80 uppercase font-black">★ {dateLabel}</div>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-[40px] font-black text-white leading-none">{String(card.number).padStart(2, "0")}</span>
                      <span className="text-[22px] font-black text-white tracking-tight">{card.name}</span>
                    </div>
                    <div className="text-[11px] text-white/70 mt-0.5 italic">{card.english}</div>
                  </div>

                  <div className="text-center my-2">
                    <div className="text-[100px] leading-none drop-shadow-2xl">{card.symbol}</div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {card.keywords.map((k) => (
                        <span key={k} className="text-[10px] font-bold text-white bg-black/30 px-2.5 py-1 rounded-full backdrop-blur">#{k}</span>
                      ))}
                    </div>
                    <div className="bg-black/40 backdrop-blur rounded-2xl p-3.5 border border-white/15">
                      <div className="text-[9px] text-white/70 font-black tracking-[0.2em] uppercase mb-1.5">오늘의 미션</div>
                      <p className="text-[13px] font-bold text-white leading-snug">{card.mission}</p>
                    </div>
                    <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.2em] font-bold text-white/60">
                      <span>{TONE_LABEL[tone]}</span>
                      <span>@TBD</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Below-card text horoscope */}
      <div className="w-full max-w-[340px] mt-5 px-1">
        <div className="text-[10px] tracking-[0.22em] uppercase text-accent font-black mb-1.5">오늘의 한 줄</div>
        {loading ? (
          <div className="flex gap-1.5 py-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 rounded-full bg-accent-pink animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 rounded-full bg-accent-cyan animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        ) : (
          <p className="text-[15px] leading-snug font-bold text-white/85"
            style={{ textShadow: "0 2px 16px rgba(196,163,255,0.18)" }}
          >
            {horoscopeText}
          </p>
        )}
        {persona && (
          <div className="text-[10px] text-white/35 mt-2 tracking-wide">{persona}</div>
        )}
      </div>
    </div>
  );
}
