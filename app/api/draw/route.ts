import { NextRequest, NextResponse } from "next/server";
import { getAstrology } from "@/lib/astrology";
import { getBaZi } from "@/lib/saju";
import { getMBTI } from "@/lib/mbti";
import { generateHoroscope } from "@/lib/horoscope";
import { drawCardFor, buildUserSeed } from "@/lib/draw";
import { VALID_TONES, type Tone } from "@/lib/tones";
import { guardRequest } from "@/lib/edge-guard";

export const runtime = "nodejs";
export const maxDuration = 30;

type Req = {
  birthDate: string;
  birthTime: string;
  mbti?: string;
  tone?: Tone;
  date?: string;
};

function todayKST(): string {
  const d = new Date(Date.now() + 9 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  const blocked = await guardRequest(req, "draw", { perMin: 10, perDay: 200 });
  if (blocked) return blocked;

  let body: Req;
  try {
    body = (await req.json()) as Req;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { birthDate, birthTime, mbti, tone, date } = body;
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return NextResponse.json({ error: "birthDate (yyyy-mm-dd) required" }, { status: 400 });
  }
  if (!birthTime || !/^\d{2}:\d{2}$/.test(birthTime)) {
    return NextResponse.json({ error: "birthTime (HH:MM) required" }, { status: 400 });
  }

  const useTone: Tone = tone && (VALID_TONES as string[]).includes(tone) ? tone : "warm";
  const targetDate = date ?? todayKST();

  try {
    const astro = getAstrology(birthDate, birthTime); // 태양·달·상승궁 3중
    const saju = getBaZi(birthDate, birthTime);
    const mbtiInfo = getMBTI(mbti);

    const seed = buildUserSeed(birthDate, birthTime, mbti);
    const card = drawCardFor(seed, targetDate);

    const horoscope = await generateHoroscope(
      {
        date: targetDate,
        astrology: {
          sun: { korean: astro.sun.korean, element: astro.sun.element, rulingPlanet: astro.sun.rulingPlanet, keywords: astro.sun.keywords },
          moon: astro.moon ? { korean: astro.moon.korean, element: astro.moon.element } : null,
          rising: astro.rising ? { korean: astro.rising.korean } : null,
        },
        saju,
        mbti: mbtiInfo,
        card: {
          number: card.number,
          name: card.name,
          english: card.english,
          keywords: card.keywords,
          light: card.light,
          shadow: card.shadow,
          mission: card.mission,
        },
      },
      useTone,
    );

    return NextResponse.json({
      input: {
        birthDate,
        birthTime,
        mbti: mbti ?? null,
        tone: useTone,
        date: targetDate,
      },
      card,
      // astrology = 태양(하위호환: korean·symbol) · moon/rising = 추가 노출(향후 UI)
      chart: { astrology: astro.sun, moon: astro.moon, rising: astro.rising, saju, mbti: mbtiInfo },
      horoscope,
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[draw] error:", msg);
    return NextResponse.json(
      { error: "운세를 불러오지 못했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: "horoscope-kr · POST /api/draw (오늘의 카드)",
    expects: {
      birthDate: "yyyy-mm-dd",
      birthTime: "HH:MM",
      mbti: "4-letter (optional)",
      tone: "warm | cynical | darkComedy | tsundere | traditional",
      date: "yyyy-mm-dd (default 오늘 KST)",
    },
    returns: ["card (22장 메이저 아르카나 중 1장, 일별 결정적)", "horoscope (LLM 운세)", "chart (점성·사주·MBTI)"],
  });
}
