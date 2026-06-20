"use client";

import { useEffect, useState } from "react";
import Onboarding from "@/components/Onboarding";
import CardDraw from "@/components/CardDraw";
import CollectionGrid from "@/components/CollectionGrid";
import ToneSelector from "@/components/ToneSelector";
import {
  loadProfile,
  saveProfile,
  clearProfile,
  loadCollection,
  recordCardDraw,
  type BirthProfile,
  type Collection,
} from "@/lib/storage";
import type { Tone } from "@/lib/tones";
import type { Card } from "@/lib/cards";
import { trackVisit, trackDraw, trackShare } from "@/lib/analytics";
import CompatView from "@/components/CompatView";

type ChartData = {
  astrology: { korean: string; symbol: string } | null;
  mbti: { code: string; korean: string } | null;
};

function todayKST(): string {
  const d = new Date(Date.now() + 9 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

export default function Home() {
  const [profile, setProfile] = useState<BirthProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [tone, setTone] = useState<Tone>("warm");
  const [date] = useState<string>(todayKST());
  const [card, setCard] = useState<Card | null>(null);
  const [chart, setChart] = useState<ChartData | null>(null);
  const [horoscopeText, setHoroscopeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [collection, setCollection] = useState<Collection>({});
  const [showCollection, setShowCollection] = useState(false);
  const [showCompat, setShowCompat] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    setCollection(loadCollection());
    setHydrated(true);
    trackVisit();
  }, []);

  useEffect(() => {
    if (!profile) return;
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    fetch("/api/draw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        birthDate: profile.birthDate,
        birthTime: profile.birthTime,
        mbti: profile.mbti,
        tone,
        date,
      }),
      signal: ac.signal,
    })
      .then((r) => r.json())
      .then((j) => {
        if (j.error) {
          setError(j.error);
          setLoading(false);
          return;
        }
        setCard(j.card ?? null);
        setChart({
          astrology: j.chart?.astrology ?? null,
          mbti: j.chart?.mbti ?? null,
        });
        setHoroscopeText(j.horoscope?.text ?? "");
        setLoading(false);
        if (j.card) {
          const before = loadCollection();
          const isNewCard = !before[j.card.id];
          recordCardDraw(j.card.id, date);
          setCollection(loadCollection());
          trackDraw(j.card.id, isNewCard);
        }
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          setError(String(e?.message ?? e));
          setLoading(false);
        }
      });
    return () => ac.abort();
  }, [profile, tone, date]);

  function handleOnboardingDone(p: BirthProfile) {
    saveProfile(p);
    setProfile(p);
  }

  function handleToneSelect(t: Tone, locked: boolean) {
    if (locked) {
      setToast(`'${t}' 톤은 잠금. V1 무료는 '다정'만`);
      setTimeout(() => setToast(null), 2400);
      return;
    }
    setTone(t);
  }

  function handleReset() {
    if (confirm("프로필·컬렉션 초기화? 다시 온보딩 시작.")) {
      clearProfile();
      setProfile(null);
      setCard(null);
      setHoroscopeText("");
      setCollection({});
    }
  }

  async function handleShare() {
    if (!card || !profile) return;
    setToast("카드 이미지 만드는 중…");
    const cleanHoroscope = horoscopeText.replace(/^\[MOCK[^\]]*\]\s*/, "");
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const host = typeof window !== "undefined" ? window.location.host : "";
    const params = new URLSearchParams({
      card: card.id,
      date,
      nickname: profile.nickname ?? "",
      zodiac: chart?.astrology?.korean ?? "",
      mbti: chart?.mbti?.code ?? "",
      tone,
      horoscope: cleanHoroscope,
      host,
    });
    const ogUrl = `/api/og?${params.toString()}`;
    const shareUrl = `${origin}/?ref=share`;
    const shareText = cleanHoroscope
      ? `${cleanHoroscope}\n\n— ${card.name} · 오늘의 별\n나도 오늘 운세 보기 → ${shareUrl}`
      : `★ ${card.name} — ${card.mission}\n\n나도 오늘 운세 보기 → ${shareUrl}`;
    try {
      const res = await fetch(ogUrl);
      if (!res.ok) throw new Error(`og fetch failed (${res.status})`);
      const blob = await res.blob();
      const file = new File([blob], `${card.id}-${date}.png`, { type: "image/png" });
      // Web Share API (iOS·Android · 인스타·카톡 자동 인식)
      if (typeof navigator !== "undefined" && (navigator as any).canShare?.({ files: [file] })) {
        try {
          await (navigator as any).share({ files: [file], text: shareText });
          trackShare("webshare", card.id);
          setToast("공유 완료");
          setTimeout(() => setToast(null), 1600);
          return;
        } catch (e: any) {
          if (e?.name === "AbortError") {
            setToast(null);
            return;
          }
          // share failed → fallback download
        }
      }
      // Fallback: 다운로드 + 텍스트 복사
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${card.id}-${date}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      navigator.clipboard?.writeText(shareText);
      trackShare("download", card.id);
      setToast("PNG 다운로드 + 텍스트 복사됨");
      setTimeout(() => setToast(null), 2400);
    } catch (e) {
      setToast(`공유 실패: ${e instanceof Error ? e.message : String(e)}`);
      setTimeout(() => setToast(null), 3000);
    }
  }

  if (!hydrated) return <main className="min-h-screen" />;
  if (!profile) return <Onboarding onDone={handleOnboardingDone} />;

  const collectedCount = Object.keys(collection).length;

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-6 relative overflow-hidden">
      <div className="absolute inset-0 starfield pointer-events-none" />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(196,163,255,0.18) 0%, transparent 60%)" }}
      />
      <div
        className="absolute bottom-0 right-0 w-[400px] h-[400px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(110,231,255,0.08) 0%, transparent 60%)" }}
      />

      <header className="relative z-10 w-full max-w-md flex items-center justify-between mb-5 pt-1">
        <div>
          <h1 className="text-[22px] font-black tracking-tight gradient-text-accent leading-tight">오늘의 별</h1>
          <p className="text-[10px] text-white/35 mt-0.5 tracking-wider uppercase">코드명 TBD · 카드 v0.6</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowCollection(true)}
            className="text-[11px] text-white/55 hover:text-white transition border border-white/15 rounded-full px-3 py-1.5 hover:border-accent/50 font-bold"
            title="컬렉션"
          >
            ✦ {collectedCount}/22
          </button>
          <button
            onClick={handleReset}
            className="text-[11px] text-white/35 hover:text-white/70 transition border border-white/10 rounded-full px-3 py-1.5 hover:border-white/30"
          >
            초기화
          </button>
        </div>
      </header>

      {error && (
        <div className="relative z-10 w-full max-w-md mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="relative z-10 w-full">
        <CardDraw
          card={card}
          horoscopeText={horoscopeText}
          astrology={chart?.astrology ?? null}
          mbti={chart?.mbti?.code ?? null}
          date={date}
          nickname={profile.nickname}
          tone={tone}
          loading={loading}
        />
      </div>

      <div className="relative z-10 w-full max-w-md mt-7 space-y-4">
        <div>
          <div className="text-[10px] text-white/35 mb-2.5 tracking-[0.2em] uppercase font-black">톤 선택</div>
          <ToneSelector current={tone} onSelect={handleToneSelect} />
        </div>

        <button
          onClick={() => setShowCompat(true)}
          className="w-full bg-gradient-to-r from-accent to-accent-pink text-bg-0 font-black py-4 rounded-2xl hover:scale-[1.01] active:scale-[0.99] transition text-base shadow-[0_8px_24px_-8px_rgba(196,163,255,0.6)]"
        >
          ♡ 친구랑 궁합 보기
        </button>

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => setShowCollection(true)}
            className="flex-1 bg-bg-1 border border-white/10 text-white/80 font-bold py-3.5 rounded-2xl hover:border-accent/50 transition text-sm"
          >
            컬렉션 보기
          </button>
          <button
            onClick={handleShare}
            disabled={!card}
            className="flex-1 bg-bg-1 border border-white/10 text-white/80 font-bold py-3.5 rounded-2xl disabled:opacity-30 hover:border-accent/50 transition text-sm"
          >
            카드 공유 →
          </button>
        </div>

        <p className="text-[10.5px] text-white/30 leading-relaxed pt-2 px-1 text-center">
          ☾ 운세·궁합은 재미와 참고를 위한 콘텐츠예요. 의료·법률·재무 등 중요한 결정의 근거로 삼지 마세요.
        </p>
      </div>

      {showCollection && (
        <CollectionGrid collection={collection} onClose={() => setShowCollection(false)} />
      )}

      {showCompat && (
        <CompatView profile={profile} tone={tone} onClose={() => setShowCompat(false)} />
      )}

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-bg-2 border border-accent/40 text-white text-sm px-5 py-3 rounded-full shadow-2xl backdrop-blur z-50 font-bold">
          {toast}
        </div>
      )}
    </main>
  );
}
