import { NextRequest, NextResponse } from "next/server";
import { getZodiac } from "@/lib/astrology";
import { getBaZi } from "@/lib/saju";
import { getMBTI } from "@/lib/mbti";
import { generateHoroscope } from "@/lib/horoscope";
import { VALID_TONES, type Tone } from "@/lib/tones";
import { guardRequest } from "@/lib/edge-guard";

export const runtime = "nodejs";
export const maxDuration = 30;

type Req = {
  birthDate: string;
  birthTime: string;
  timezone?: string;
  mbti?: string;
  tone?: Tone;
  date?: string;
};

function todayKST(): string {
  // YYYY-MM-DD in Asia/Seoul
  const now = new Date();
  const kst = new Date(now.getTime() + (9 * 60 - now.getTimezoneOffset()) * 60000);
  return kst.toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  const blocked = await guardRequest(req, "horoscope", { perMin: 10, perDay: 200 });
  if (blocked) return blocked;

  let body: Req;
  try {
    body = (await req.json()) as Req;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { birthDate, birthTime, timezone, mbti, tone, date } = body;

  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return NextResponse.json({ error: "birthDate (yyyy-mm-dd) required" }, { status: 400 });
  }
  if (!birthTime || !/^\d{2}:\d{2}$/.test(birthTime)) {
    return NextResponse.json({ error: "birthTime (HH:MM) required" }, { status: 400 });
  }

  const useTone: Tone = tone && (VALID_TONES as string[]).includes(tone) ? tone : "warm";
  const targetDate = date ?? todayKST();

  try {
    const astrology = getZodiac(birthDate);
    const saju = getBaZi(birthDate, birthTime);
    const mbtiInfo = getMBTI(mbti);

    const horoscope = await generateHoroscope(
      {
        date: targetDate,
        astrology,
        saju,
        mbti: mbtiInfo,
      },
      useTone,
    );

    return NextResponse.json({
      input: {
        birthDate,
        birthTime,
        timezone: timezone ?? "Asia/Seoul",
        mbti: mbti ?? null,
        tone: useTone,
        date: targetDate,
      },
      chart: { astrology, saju, mbti: mbtiInfo },
      horoscope,
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[horoscope] error:", msg);
    return NextResponse.json(
      { error: "운세를 불러오지 못했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: "horoscope-kr · POST /api/horoscope",
    expects: {
      birthDate: "yyyy-mm-dd",
      birthTime: "HH:MM",
      timezone: "IANA tz (default Asia/Seoul)",
      mbti: "4-letter MBTI (optional)",
      tone: "warm | cynical | darkComedy | tsundere | traditional (default warm)",
      date: "yyyy-mm-dd (default 오늘 KST)",
    },
    sample: {
      birthDate: "1996-10-05",
      birthTime: "12:00",
      mbti: "INFP",
      tone: "cynical",
    },
    notes: "ANTHROPIC_API_KEY 미설정 시 mock 응답 반환.",
  });
}
