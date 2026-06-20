"use client";

import { useMemo, useState } from "react";
import type { BirthProfile } from "@/lib/storage";
import type { Tone } from "@/lib/tones";
import { trackCompat, trackShare } from "@/lib/analytics";

const MBTI_LIST = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 80 }, (_, i) => CURRENT_YEAR - 5 - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 10, 20, 30, 40, 50];

function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}
function pad(n: number | string, len = 2): string {
  return String(n).padStart(len, "0");
}
function stripMock(s: string): string {
  return s.replace(/^\[MOCK[^\]]*\]\s*/, "");
}

function Sel({
  label, value, onChange, options, placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}) {
  return (
    <label className="block flex-1">
      <span className="text-[10px] text-white/40 mb-1.5 block tracking-wider uppercase font-semibold">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-bg-1 border border-white/10 rounded-xl px-3 py-3 text-white font-bold focus:border-accent outline-none cursor-pointer hover:border-white/30 transition pr-8 text-sm"
        >
          <option value="" disabled className="bg-bg-1">{placeholder ?? "선택"}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-bg-1">{o.label}</option>
          ))}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 text-xs">▼</span>
      </div>
    </label>
  );
}

type CompatResp = {
  score: number;
  level: string;
  text: string;
  breakdown: { element: number; mbti: number; saju: number };
  me: { name: string; zodiac: string; symbol: string; mbti: string | null };
  friend: { name: string; zodiac: string; symbol: string; mbti: string | null };
};

export default function CompatView({
  profile, tone, onClose,
}: {
  profile: BirthProfile;
  tone: Tone;
  onClose: () => void;
}) {
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [fMbti, setFMbti] = useState("");
  const [fName, setFName] = useState("");
  const [result, setResult] = useState<CompatResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const dayOptions = useMemo(() => {
    const max = year && month ? daysInMonth(Number(year), Number(month)) : 31;
    return Array.from({ length: max }, (_, i) => ({ value: String(i + 1), label: `${i + 1}일` }));
  }, [year, month]);

  const canSubmit = year !== "" && month !== "" && day !== "";

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/compat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          me: { birthDate: profile.birthDate, birthTime: profile.birthTime, mbti: profile.mbti },
          friend: {
            birthDate: `${year}-${pad(month)}-${pad(day)}`,
            birthTime: hour !== "" && minute !== "" ? `${pad(hour)}:${pad(minute)}` : undefined,
            mbti: fMbti || undefined,
            name: fName.trim() || undefined,
          },
          tone,
        }),
      });
      const j = await res.json();
      if (j.error) {
        setError(j.error);
        setLoading(false);
        return;
      }
      setResult(j as CompatResp);
      trackCompat(j.score);
      setLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  }

  async function handleShareCompat() {
    if (!result) return;
    setToast("궁합 카드 만드는 중…");
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const host = typeof window !== "undefined" ? window.location.host : "";
    const cleanText = stripMock(result.text);
    const params = new URLSearchParams({
      meName: result.me.name, meSymbol: result.me.symbol, meZodiac: result.me.zodiac, meMbti: result.me.mbti ?? "",
      frName: result.friend.name, frSymbol: result.friend.symbol, frZodiac: result.friend.zodiac, frMbti: result.friend.mbti ?? "",
      score: String(result.score), level: result.level, text: cleanText, host,
    });
    const ogUrl = `/api/og/compat?${params.toString()}`;
    const shareUrl = `${origin}/?ref=compat`;
    const shareText = `${result.me.name} ♡ ${result.friend.name} 궁합 ${result.score}점 · ${result.level}\n${cleanText}\n\n나도 궁합 보기 → ${shareUrl}`;
    try {
      const res = await fetch(ogUrl);
      if (!res.ok) throw new Error(`og fetch failed (${res.status})`);
      const blob = await res.blob();
      const file = new File([blob], `compat-${result.score}.png`, { type: "image/png" });
      if (typeof navigator !== "undefined" && (navigator as any).canShare?.({ files: [file] })) {
        try {
          await (navigator as any).share({ files: [file], text: shareText });
          trackShare("webshare", "compat");
          setToast("공유 완료");
          setTimeout(() => setToast(null), 1600);
          return;
        } catch (e: any) {
          if (e?.name === "AbortError") {
            setToast(null);
            return;
          }
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `compat-${result.score}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      navigator.clipboard?.writeText(shareText);
      trackShare("download", "compat");
      setToast("PNG 다운로드 + 텍스트 복사됨");
      setTimeout(() => setToast(null), 2400);
    } catch (e) {
      setToast(`공유 실패: ${e instanceof Error ? e.message : String(e)}`);
      setTimeout(() => setToast(null), 3000);
    }
  }

  const breakdownItems: Array<[string, number, number]> = [
    ["원소", result?.breakdown.element ?? 0, 40],
    ["MBTI", result?.breakdown.mbti ?? 0, 30],
    ["사주합", result?.breakdown.saju ?? 0, 15],
  ];

  return (
    <div className="fixed inset-0 z-50 bg-bg-0/95 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen flex flex-col items-center px-4 py-8 relative">
        <div className="absolute inset-0 starfield pointer-events-none" />

        <div className="relative z-10 w-full max-w-md flex justify-between items-center mb-6">
          <h2 className="text-[20px] font-black gradient-text-accent">친구 궁합 ♡</h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white text-sm border border-white/15 rounded-full px-4 py-1.5 font-bold transition"
          >
            닫기
          </button>
        </div>

        {!result ? (
          <div className="relative z-10 w-full max-w-md space-y-5">
            <p className="text-sm text-white/55">상대 생년월일을 넣으면 둘의 궁합을 봐줄게. 시간·MBTI는 선택이야.</p>

            <div>
              <div className="text-[10px] text-white/40 mb-2 tracking-wider uppercase font-semibold">상대 생년월일</div>
              <div className="flex gap-2">
                <Sel label="년" value={year} placeholder="년"
                  onChange={(v) => { setYear(v); if (day && Number(day) > daysInMonth(Number(v), Number(month || 1))) setDay(""); }}
                  options={YEARS.map((y) => ({ value: String(y), label: `${y}` }))} />
                <Sel label="월" value={month} placeholder="월"
                  onChange={(v) => { setMonth(v); if (day && year && Number(day) > daysInMonth(Number(year), Number(v))) setDay(""); }}
                  options={MONTHS.map((m) => ({ value: String(m), label: `${m}월` }))} />
                <Sel label="일" value={day} onChange={setDay} options={dayOptions} placeholder="일" />
              </div>
            </div>

            <div>
              <div className="text-[10px] text-white/40 mb-2 tracking-wider uppercase font-semibold">
                태어난 시간 <span className="text-white/30 normal-case tracking-normal">(모르면 비워둬)</span>
              </div>
              <div className="flex gap-2">
                <Sel label="시" value={hour} onChange={setHour} options={HOURS.map((h) => ({ value: pad(h), label: `${pad(h)}시` }))} placeholder="시" />
                <Sel label="분" value={minute} onChange={setMinute} options={MINUTES.map((m) => ({ value: pad(m), label: `${pad(m)}분` }))} placeholder="분" />
              </div>
            </div>

            <div>
              <div className="text-[10px] text-white/40 mb-2 tracking-wider uppercase font-semibold">
                상대 MBTI <span className="text-white/30 normal-case tracking-normal">(선택)</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {MBTI_LIST.map((m) => {
                  const active = fMbti === m;
                  return (
                    <button
                      key={m}
                      onClick={() => setFMbti(active ? "" : m)}
                      className={`py-2.5 rounded-lg text-xs font-black transition-all ${
                        active
                          ? "bg-gradient-to-br from-accent to-accent-pink text-bg-0 scale-[1.03]"
                          : "bg-bg-1 border border-white/10 text-white/55 hover:text-white hover:border-accent/50"
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            <input
              type="text"
              placeholder="상대 이름·별명 (선택)"
              value={fName}
              maxLength={12}
              onChange={(e) => setFName(e.target.value)}
              className="w-full bg-bg-1 border border-white/10 rounded-xl px-4 py-3.5 text-white font-bold focus:border-accent outline-none placeholder:font-normal placeholder:text-white/30"
            />

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{error}</div>
            )}

            <button
              disabled={!canSubmit || loading}
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-accent to-accent-pink text-bg-0 font-black py-4 rounded-2xl text-base disabled:opacity-30 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] transition shadow-[0_8px_24px_-8px_rgba(196,163,255,0.6)]"
            >
              {loading ? "별 보는 중…" : "궁합 보기 ♡"}
            </button>
          </div>
        ) : (
          <div className="relative z-10 w-full max-w-md space-y-6">
            <div className="flex items-start justify-center gap-3 pt-2">
              <div className="flex flex-col items-center w-28">
                <div className="text-5xl" style={{ textShadow: "0 0 24px rgba(196,163,255,0.8)" }}>{result.me.symbol}</div>
                <div className="text-sm font-black text-white mt-2">{result.me.name}</div>
                <div className="text-[11px] text-white/50 mt-0.5">{result.me.zodiac}</div>
              </div>
              <div className="text-3xl text-accent-pink mt-4">♡</div>
              <div className="flex flex-col items-center w-28">
                <div className="text-5xl" style={{ textShadow: "0 0 24px rgba(255,143,177,0.8)" }}>{result.friend.symbol}</div>
                <div className="text-sm font-black text-white mt-2">{result.friend.name}</div>
                <div className="text-[11px] text-white/50 mt-0.5">{result.friend.zodiac}</div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-baseline">
                <span className="text-[88px] font-black leading-none gradient-text-accent" style={{ letterSpacing: "-2px" }}>{result.score}</span>
                <span className="text-3xl font-black text-white/60">점</span>
              </div>
              <div className="text-xl font-black text-white mt-1">{result.level}</div>
            </div>

            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-pink" style={{ width: `${result.score}%` }} />
            </div>

            <div className="bg-bg-1 border border-white/12 rounded-2xl p-5">
              <div className="text-[15px] text-white/90 leading-relaxed font-medium">{stripMock(result.text)}</div>
            </div>

            <div className="flex gap-2 text-center">
              {breakdownItems.map(([l, v, mx]) => (
                <div key={l} className="flex-1 bg-bg-1/60 border border-white/8 rounded-xl py-2.5">
                  <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{l}</div>
                  <div className="text-sm font-black text-white mt-0.5">
                    {v}<span className="text-white/35 text-xs">/{mx}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setResult(null)}
                className="flex-1 bg-bg-1 border border-white/10 text-white font-bold py-3.5 rounded-2xl hover:border-accent/50 transition text-sm"
              >
                다시
              </button>
              <button
                onClick={handleShareCompat}
                className="flex-1 bg-gradient-to-r from-accent to-accent-pink text-bg-0 font-black py-3.5 rounded-2xl hover:scale-[1.01] active:scale-[0.99] transition text-sm shadow-[0_8px_24px_-8px_rgba(196,163,255,0.5)]"
              >
                궁합 공유 →
              </button>
            </div>
          </div>
        )}

        {toast && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-bg-2 border border-accent/40 text-white text-sm px-5 py-3 rounded-full shadow-2xl backdrop-blur z-50 font-bold">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
