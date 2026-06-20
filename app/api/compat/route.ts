import { NextRequest, NextResponse } from "next/server";
import { getZodiac } from "@/lib/astrology";
import { getBaZi } from "@/lib/saju";
import { getMBTI } from "@/lib/mbti";
import { generateCompat, type CompatPerson } from "@/lib/compat";
import { VALID_TONES, type Tone } from "@/lib/tones";
import { guardRequest } from "@/lib/edge-guard";
import { sanitizeName } from "@/lib/guardrail";

export const runtime = "nodejs";
export const maxDuration = 30;

type PersonReq = { birthDate: string; birthTime?: string; mbti?: string; name?: string };
type Req = { me: PersonReq; friend: PersonReq; tone?: Tone };

function validPerson(p: unknown): p is PersonReq {
  return (
    !!p &&
    typeof (p as PersonReq).birthDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test((p as PersonReq).birthDate)
  );
}

function buildPerson(p: PersonReq, fallbackName: string): CompatPerson {
  const zodiac = getZodiac(p.birthDate);
  const saju = getBaZi(p.birthDate, p.birthTime && /^\d{2}:\d{2}$/.test(p.birthTime) ? p.birthTime : "12:00");
  const mbti = getMBTI(p.mbti);
  return {
    name: sanitizeName(p.name) || fallbackName,
    zodiac,
    ilgan: saju.ilgan,
    zodiacAnimal: saju.zodiacAnimal,
    mbti,
  };
}

export async function POST(req: NextRequest) {
  const blocked = await guardRequest(req, "compat", { perMin: 8, perDay: 100 });
  if (blocked) return blocked;

  let body: Req;
  try {
    body = (await req.json()) as Req;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!validPerson(body.me) || !validPerson(body.friend)) {
    return NextResponse.json({ error: "me·friend birthDate (yyyy-mm-dd) required" }, { status: 400 });
  }

  const tone: Tone = body.tone && (VALID_TONES as string[]).includes(body.tone) ? body.tone : "warm";

  try {
    const me = buildPerson(body.me, "나");
    const friend = buildPerson(body.friend, "상대");
    const result = await generateCompat(me, friend, tone);

    return NextResponse.json({
      ...result,
      me: { name: me.name, zodiac: me.zodiac.korean, symbol: me.zodiac.symbol, mbti: me.mbti?.code ?? null },
      friend: { name: friend.name, zodiac: friend.zodiac.korean, symbol: friend.zodiac.symbol, mbti: friend.mbti?.code ?? null },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[compat] error:", msg);
    return NextResponse.json(
      { error: "궁합을 보지 못했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: "horoscope-kr · POST /api/compat (친구 궁합)",
    expects: {
      me: { birthDate: "yyyy-mm-dd", birthTime: "HH:MM (optional)", mbti: "4-letter (optional)" },
      friend: { birthDate: "yyyy-mm-dd", birthTime: "HH:MM (optional)", mbti: "optional", name: "optional" },
      tone: "warm | cynical | darkComedy | tsundere | traditional",
    },
    returns: ["score (40~99 결정적)", "level", "text (LLM 관계 해석)", "breakdown (element/mbti/saju)"],
  });
}
