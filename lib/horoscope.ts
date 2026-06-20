import Anthropic from "@anthropic-ai/sdk";
import { TONE_PROMPTS, type Tone } from "./tones";
import { checkOutput, type GuardrailHit } from "./guardrail";

export type ChartSummary = {
  astrology: { korean: string; element: string; rulingPlanet: string; keywords: string[] };
  saju: { korean: string; ilgan: string; zodiacAnimal: string };
  mbti: { code: string; korean: string; keywords: string[] } | null;
};

export type CardSummary = {
  number: number;
  name: string;
  english: string;
  keywords: readonly string[];
  light: string;
  shadow: string;
  mission: string;
} | null;

export type HoroscopeInput = ChartSummary & {
  date: string; // 운세 대상 날짜 (보통 오늘)
  card?: CardSummary; // V2: 오늘 뽑힌 카드 — 운세에 융합
};

export type HoroscopeResult = {
  tone: Tone;
  text: string;
  model: string;
  cached: boolean;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  mock: boolean;
  guardrail: { triggered: boolean; hits: GuardrailHit[] };
  generatedAt: string;
};

const MOCK_TEXTS: Record<Tone, string> = {
  warm: "오늘은 누가 너한테 작은 친절을 베풀 거야. 받는 거 어색해하지 말기. 그 사람도 너한테 빚 갚는 중일 수도.",
  cynical: "오늘 너는 약속을 어길 운명이다. 사과 문자 미리 써둬라. 어차피 보낼 거다.",
  darkComedy: "천칭자리 INFP가 결정을 내린다고? 별이 웃었다. 동전 던져라. 그게 더 빠르다.",
  tsundere: "별이 너 걱정한대. ...아니 별이 그런 거지 내가 그런 건 아니고. 어쨌든 우산 챙겨가, 알겠어?",
  traditional: "오늘 천간 정화가 일간을 거스르는 형국이라, 결단은 미루고 경청에 머무는 것이 길합니다.",
};

const MODEL = "claude-sonnet-4-6";

function buildUserPrompt(input: HoroscopeInput): string {
  const a = input.astrology;
  const s = input.saju;
  const m = input.mbti;
  const c = input.card;
  const cardBlock = c
    ? `[오늘 뽑힌 카드] #${c.number} ${c.name} (${c.english}) — 키워드: ${c.keywords.join(", ")} / 빛: ${c.light} / 그림자: ${c.shadow}
[카드 미션] ${c.mission}`
    : "[오늘 뽑힌 카드] 없음";
  return `[운세 대상 날짜] ${input.date}
${cardBlock}
[별자리] ${a.korean} (원소: ${a.element}, 지배성: ${a.rulingPlanet}, 키워드: ${a.keywords.join(", ")})
[사주] ${s.korean} / 일간 ${s.ilgan} / 띠 ${s.zodiacAnimal}
[MBTI] ${m ? `${m.code} (${m.korean}, ${m.keywords.join(", ")})` : "미입력"}

위 입력을 융합해 오늘의 운세를 작성하라. **오늘 뽑힌 카드의 의미를 반드시 운세에 녹여라.** 별자리·사주·MBTI는 카드 해석을 뒷받침하는 근거로 활용. 50~80자, 1~2문장, 따옴표·줄바꿈 없이.`;
}

export async function generateHoroscope(input: HoroscopeInput, tone: Tone): Promise<HoroscopeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Mock fallback (키 없거나 placeholder)
  if (!apiKey || apiKey.trim() === "" || apiKey.startsWith("MOCK")) {
    const a = input.astrology.korean;
    const mbti = input.mbti?.code ?? "—";
    const cardLabel = input.card ? `#${input.card.number} ${input.card.name}` : "—";
    const mockText = `[MOCK·${a}·${mbti}·${cardLabel}] ${MOCK_TEXTS[tone]}`;
    const mockGuard = checkOutput(mockText);
    return {
      tone,
      text: mockGuard.triggered ? mockGuard.safeText! : mockText,
      model: "mock",
      cached: false,
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheCreationTokens: 0,
      mock: true,
      guardrail: { triggered: mockGuard.triggered, hits: mockGuard.hits },
      generatedAt: new Date().toISOString(),
    };
  }

  const client = new Anthropic({ apiKey });
  const tonePrompt = TONE_PROMPTS[tone];
  const userPrompt = buildUserPrompt(input);

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    system: [
      { type: "text", text: tonePrompt.system, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: userPrompt }],
  });

  const rawText = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  const guard = checkOutput(rawText);
  const finalText = guard.triggered ? guard.safeText! : rawText;

  const usage = res.usage;
  const cacheRead = usage.cache_read_input_tokens ?? 0;
  const cacheCreate = usage.cache_creation_input_tokens ?? 0;

  return {
    tone,
    text: finalText,
    model: res.model,
    cached: cacheRead > 0,
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    cacheReadTokens: cacheRead,
    cacheCreationTokens: cacheCreate,
    mock: false,
    guardrail: { triggered: guard.triggered, hits: guard.hits },
    generatedAt: new Date().toISOString(),
  };
}
