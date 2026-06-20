import { NextRequest, NextResponse } from "next/server";
import { getZodiac } from "@/lib/astrology";
import { getBaZi } from "@/lib/saju";
import { getMBTI } from "@/lib/mbti";

export const runtime = "nodejs";

type ChartRequest = {
  birthDate: string; // "1996-10-05"
  birthTime: string; // "12:00"
  timezone?: string; // "Asia/Seoul"
  mbti?: string; // "INFP"
};

export async function POST(req: NextRequest) {
  let body: ChartRequest;
  try {
    body = (await req.json()) as ChartRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { birthDate, birthTime, timezone, mbti } = body;

  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return NextResponse.json({ error: "birthDate (yyyy-mm-dd) required" }, { status: 400 });
  }
  if (!birthTime || !/^\d{2}:\d{2}$/.test(birthTime)) {
    return NextResponse.json({ error: "birthTime (HH:MM) required" }, { status: 400 });
  }

  try {
    const astrology = getZodiac(birthDate);
    const saju = getBaZi(birthDate, birthTime);
    const mbtiInfo = getMBTI(mbti);

    return NextResponse.json({
      input: {
        birthDate,
        birthTime,
        timezone: timezone ?? "Asia/Seoul",
        mbti: mbti ?? null,
      },
      astrology,
      saju,
      mbti: mbtiInfo,
      generatedAt: new Date().toISOString(),
      version: "v1.day1",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Chart calculation failed: ${msg}` }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: "horoscope-kr · POST /api/chart",
    expects: {
      birthDate: "yyyy-mm-dd",
      birthTime: "HH:MM",
      timezone: "IANA tz (default Asia/Seoul)",
      mbti: "4-letter (optional)",
    },
    sample: {
      birthDate: "1996-10-05",
      birthTime: "12:00",
      timezone: "Asia/Seoul",
      mbti: "INFP",
    },
  });
}
