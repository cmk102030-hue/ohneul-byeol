"use client";

import type { Tone } from "@/lib/tones";

type ToneSpec = {
  id: Tone;
  label: string;
  locked: boolean;
  hint: string;
  gradient: string;
};

const TONES: ToneSpec[] = [
  { id: "warm", label: "다정", locked: false, hint: "친근한 친구 톤", gradient: "linear-gradient(135deg, #ffb3d1, #c4a3ff)" },
  { id: "cynical", label: "시니컬", locked: false, hint: "Co-Star 정수", gradient: "linear-gradient(135deg, #6ee7ff, #c4a3ff)" },
  { id: "darkComedy", label: "블랙코미디", locked: false, hint: "자기풍자", gradient: "linear-gradient(135deg, #2a2342, #ff7a8a)" },
  { id: "tsundere", label: "츤데레", locked: false, hint: "캐릭터 톤", gradient: "linear-gradient(135deg, #ffb3d1, #ff7a8a)" },
  { id: "traditional", label: "진중", locked: false, hint: "전통 사주", gradient: "linear-gradient(135deg, #ffd66b, #ff7a8a)" },
];

export default function ToneSelector({
  current,
  onSelect,
}: {
  current: Tone;
  onSelect: (t: Tone, locked: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {TONES.map((t) => {
        const active = current === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id, t.locked)}
            title={t.hint}
            className={`group relative py-3 px-1 rounded-xl text-xs font-black tracking-tight transition-all ${
              active
                ? "text-bg-0 shadow-[0_8px_24px_-8px_rgba(196,163,255,0.7)] scale-[1.05]"
                : "bg-bg-1 border border-white/10 text-white/65 hover:border-accent/40 hover:text-white"
            }`}
            style={active ? { background: t.gradient } : undefined}
          >
            {t.label}
            {t.locked && !active && (
              <span className="absolute top-1 right-1.5 text-[8px] text-accent/70 group-hover:text-accent transition">●</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
