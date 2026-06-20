import Anthropic from "@anthropic-ai/sdk";
import { TONE_PROMPTS, type Tone } from "./tones";
import { checkOutput, type GuardrailHit } from "./guardrail";
import { cached, cacheKey } from "./llm-cache";
import type { ZodiacInfo } from "./astrology";
import type { MBTIInfo } from "./mbti";

// ── 친구 궁합 (Phase 3) ──────────────────────────────────────────
// 점수 = 결정적(같은 두 사람 = 항상 같은 점수, 순서 무관 대칭) → 공유 일관성 보장.
// 텍스트만 LLM(해석). 점수는 코드 계산(별자리 원소 + MBTI 축 + 사주 천간합).

export type CompatPerson = {
  name: string;
  zodiac: ZodiacInfo;
  ilgan: string; // 사주 일간 천간(甲乙丙丁戊己庚辛壬癸)
  zodiacAnimal: string;
  mbti: MBTIInfo | null;
};

export type CompatBreakdown = { element: number; mbti: number; saju: number };

export type CompatResult = {
  score: number;
  level: string;
  text: string;
  breakdown: CompatBreakdown;
  tone: Tone;
  model: string;
  mock: boolean;
  guardrail: { triggered: boolean; hits: GuardrailHit[] };
  generatedAt: string;
};

type Element = "불" | "흙" | "공기" | "물";

// 별자리 원소 호환 (0~40) — 상생 최고, 동질 안정, 상충 도전
const ELEMENT_PAIR: Record<string, number> = {
  "불-공기": 40, "흙-물": 40, // 상생(서로 키움)
  "불-불": 33, "공기-공기": 33, "흙-흙": 32, "물-물": 32, // 동질(편안)
  "불-흙": 22, "공기-물": 22, // 중립
  "공기-흙": 19, "불-물": 16, // 도전(끌림이자 마찰)
};

function elementScore(a: Element, b: Element): number {
  return ELEMENT_PAIR[`${a}-${b}`] ?? ELEMENT_PAIR[`${b}-${a}`] ?? 24;
}

// MBTI 축 호환 (0~30). 한쪽이라도 없으면 중립값.
// N/S 같음=세계관 소통(가중↑), E/I·T/F 다름=보완 매력, J/P 같음=생활 리듬.
function mbtiScore(a: string | null, b: string | null): number {
  if (!a || !b || a.length !== 4 || b.length !== 4) return 17;
  let s = 4;
  s += a[0] !== b[0] ? 6 : 3; // E/I 보완
  s += a[1] === b[1] ? 9 : 3; // N/S 소통 (핵심)
  s += a[2] !== b[2] ? 6 : 4; // T/F 보완
  s += a[3] === b[3] ? 5 : 3; // J/P 리듬
  return Math.min(30, s);
}

// 사주 천간합 (0~15) — 갑기·을경·병신·정임·무계 = 인연의 합
const STEM_HAP: Record<string, string> = {
  "甲": "己", "己": "甲", "乙": "庚", "庚": "乙",
  "丙": "辛", "辛": "丙", "丁": "壬", "壬": "丁", "戊": "癸", "癸": "戊",
};

function sajuScore(a: string | null, b: string | null): number {
  if (!a || !b) return 6;
  if (STEM_HAP[a] === b) return 15; // 천간합 = 강한 인연
  if (a === b) return 10; // 동일 일간 = 동질감
  return 7;
}

export function computeScore(me: CompatPerson, friend: CompatPerson): { score: number; breakdown: CompatBreakdown } {
  const element = elementScore(me.zodiac.element, friend.zodiac.element);
  const mbti = mbtiScore(me.mbti?.code ?? null, friend.mbti?.code ?? null);
  const saju = sajuScore(me.ilgan || null, friend.ilgan || null);
  const raw = element + mbti + saju + 5; // base 5
  const score = Math.max(40, Math.min(99, Math.round(raw)));
  return { score, breakdown: { element, mbti, saju } };
}

export function scoreLevel(score: number): string {
  if (score >= 85) return "환상의 케미";
  if (score >= 72) return "잘 맞는 사이";
  if (score >= 60) return "끌리는 사이";
  if (score >= 50) return "노력형 궁합";
  return "정반대의 끌림";
}

const MODEL = "claude-sonnet-4-6";

function buildCompatPrompt(me: CompatPerson, friend: CompatPerson, score: number, bd: CompatBreakdown): string {
  const fmt = (p: CompatPerson) =>
    `${p.name} — 별자리 ${p.zodiac.korean}(원소 ${p.zodiac.element}) / 일간 ${p.ilgan || "?"}·${p.zodiacAnimal}띠 / MBTI ${p.mbti?.code ?? "미입력"}`;
  return `[관계 궁합 분석]
[나] ${fmt(me)}
[상대] ${fmt(friend)}
[궁합 점수] ${score}점 (원소 ${bd.element}/40 · MBTI ${bd.mbti}/30 · 사주합 ${bd.saju}/15)

두 사람의 '관계 궁합'을 위 입력을 융합해 작성하라. 연애/우정 모두 포함하는 관계 톤.
- 점수의 근거를 별자리 원소 궁합·MBTI 축·사주 천간합으로 자연스럽게 녹여라.
- 강점 1가지 + 주의할 점 1가지를 반드시 포함.
- 80~120자, 2~3문장. 따옴표·줄바꿈 없이.`;
}

function mockCompat(me: CompatPerson, friend: CompatPerson, score: number): string {
  const lvl = scoreLevel(score);
  return `${me.name}와 ${friend.name}는 ${score}점, ${lvl}. ${me.zodiac.korean}(${me.zodiac.element})와 ${friend.zodiac.korean}(${friend.zodiac.element})의 만남이라 서로 다른 리듬이 매력이자 과제다. 솔직한 대화 1번이 이 관계의 열쇠.`;
}

export async function generateCompat(me: CompatPerson, friend: CompatPerson, tone: Tone): Promise<CompatResult> {
  const { score, breakdown } = computeScore(me, friend);
  const level = scoreLevel(score);
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Mock fallback (키 없음)
  if (!apiKey || apiKey.trim() === "" || apiKey.startsWith("MOCK")) {
    const mockText = mockCompat(me, friend, score);
    const g = checkOutput(mockText);
    return {
      score, level, breakdown,
      text: g.triggered ? g.safeText! : mockText,
      tone, model: "mock", mock: true,
      guardrail: { triggered: g.triggered, hits: g.hits },
      generatedAt: new Date().toISOString(),
    };
  }

  // 두 사람(순서 무관) + 톤 = 같은 궁합 → 7일 캐시. 키는 대칭 정렬(me/friend 순서 불변).
  const pa = `${me.name}:${me.zodiac.korean}:${me.ilgan}:${me.mbti?.code ?? ""}`;
  const pb = `${friend.name}:${friend.zodiac.korean}:${friend.ilgan}:${friend.mbti?.code ?? ""}`;
  const [x, y] = [pa, pb].sort();
  const key = cacheKey(["compat", x, y, tone]);

  const { value } = await cached<CompatResult>(key, 60 * 60 * 24 * 7, async () => {
    const client = new Anthropic({ apiKey });
    const tonePrompt = TONE_PROMPTS[tone];
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      system: [{ type: "text", text: tonePrompt.system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: buildCompatPrompt(me, friend, score, breakdown) }],
    });

    const rawText = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    const g = checkOutput(rawText);
    return {
      score, level, breakdown,
      text: g.triggered ? g.safeText! : rawText,
      tone, model: res.model, mock: false,
      guardrail: { triggered: g.triggered, hits: g.hits },
      generatedAt: new Date().toISOString(),
    };
  });
  return value;
}
