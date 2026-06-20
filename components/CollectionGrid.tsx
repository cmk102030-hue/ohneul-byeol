"use client";

import { CARDS } from "@/lib/cards";
import type { Collection } from "@/lib/storage";

export default function CollectionGrid({
  collection,
  onClose,
}: {
  collection: Collection;
  onClose: () => void;
}) {
  const total = CARDS.length;
  const collected = CARDS.filter((c) => collection[c.id]).length;

  return (
    <div className="fixed inset-0 z-40 bg-bg-0/95 backdrop-blur-xl overflow-y-auto">
      <div className="absolute inset-0 starfield pointer-events-none opacity-40" />

      <div className="relative max-w-md mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[22px] font-black tracking-tight gradient-text-accent">컬렉션</h2>
            <p className="text-[11px] text-white/45 mt-0.5">
              {collected}/{total} 수집 · {Math.round((collected / total) * 100)}%
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white text-2xl leading-none w-10 h-10 flex items-center justify-center"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-gradient-to-r from-accent to-accent-pink transition-all duration-700"
            style={{ width: `${(collected / total) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {CARDS.map((c) => {
            const owned = !!collection[c.id];
            return (
              <div
                key={c.id}
                className={`relative rounded-2xl overflow-hidden transition-all ${owned ? "" : "opacity-25 grayscale"}`}
                style={{ aspectRatio: "9 / 14" }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient}`} />
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)" }}
                />
                <div className="relative h-full flex flex-col justify-between p-2.5 z-10">
                  <div className="text-[8px] tracking-[0.2em] uppercase text-white/70 font-black">
                    {String(c.number).padStart(2, "0")}
                  </div>
                  <div className="text-3xl text-center my-1 drop-shadow">{c.symbol}</div>
                  <div className="text-[10px] font-black text-white tracking-tight leading-tight">{c.name}</div>
                  {owned && collection[c.id] && (
                    <div className="text-[8px] text-white/60 mt-0.5">×{collection[c.id].count}</div>
                  )}
                </div>
                {!owned && (
                  <div className="absolute inset-0 flex items-center justify-center text-white/40 text-2xl">?</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center text-[11px] text-white/30 mt-8">
          매일 오전 9시 새 카드 · 같은 날 재방문 = 같은 카드
        </div>
      </div>
    </div>
  );
}
