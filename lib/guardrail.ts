/**
 * 출력 가드레일 — LLM 응답 텍스트에 위험 키워드가 포함되면 안전 fallback 메시지로 교체.
 * V1은 정규식 룩업. V2에서 LLM 분류기 또는 Anthropic moderation API 추가 가능.
 */

export type GuardrailCategory = "self_harm" | "violence" | "medical" | "political" | "religion";

export type GuardrailHit = {
  category: GuardrailCategory;
  matched: string;
};

export type GuardrailResult = {
  triggered: boolean;
  hits: GuardrailHit[];
  safeText: string | null; // triggered면 대체 텍스트, 아니면 null
};

const PATTERNS: Array<{ category: GuardrailCategory; regex: RegExp }> = [
  // 자살·자해 (한국어 + 영어 핵심). 공백·변형·은어 보강.
  { category: "self_harm", regex: /(자\s*살|자\s*해|목\s*매|투신|뛰어\s*내|극단적\s*선택|숨고\s*싶|죽고\s*싶|죽어\s*버리|살기\s*싫|살\s*가치|없어지고\s*싶|사라지고\s*싶|끝내고\s*싶|손목\s*긋|self[- ]?harm|suicide|kill\s+myself|end\s+my\s+life)/i },
  // 폭력 (특정 인물·집단 위해)
  { category: "violence", regex: /(죽여(라|버려)|살해|폭행해|때려죽|총\s*쏴)/i },
  // 의료 단정 (위험할 수 있는 진단·복용 지시)
  { category: "medical", regex: /(약\s*끊|치료\s*받지\s*마|병원\s*가지\s*마|이\s*병이다|확실히\s*걸린)/i },
  // 정치 (특정 정당·인물 비방)
  { category: "political", regex: /(\b(더불어민주당|국민의힘|정의당)\b\s*(은|는|이|가)\s*(망|쓰레기|적폐))/i },
  // 종교 비방
  { category: "religion", regex: /(이단|사이비)\s*(이다|라고|들이)/i },
];

const SAFE_FALLBACK = {
  self_harm: "오늘은 잠시 호흡을 가다듬는 날이에요. 혼자가 아니에요. 마음이 무거우면 보건복지부 자살예방 상담전화 1577-0199에 전화해 보세요.",
  violence: "오늘은 평온함을 우선하는 날. 충돌보단 거리를 두는 것이 길운.",
  medical: "오늘 컨디션이 평소와 다르면 전문가와 상의하는 것이 가장 안전한 선택.",
  political: "오늘은 의견 차이보다 공통점을 먼저 보는 날.",
  religion: "오늘은 다른 가치관을 가진 사람과 거리를 두는 것이 평온의 길.",
} as const;

// 입력 금칙어(욕설·비속어) — 닉네임·친구이름이 OG 공유카드에 박제되는 것 방지.
// 공백·반복 변형을 흡수하기 위해 정규화 후 매칭.
const PROFANITY =
  /(씨발|시발|씨팔|시팔|쌍놈|개새|개색|새끼|병신|븅신|좆|좇|지랄|닥쳐|꺼져|니애미|애미|창녀|보지|자지|걸레|fuck|shit|bitch|asshole|dick)/i;

export function sanitizeName(name: string | undefined | null): string {
  if (!name) return "";
  const trimmed = name.trim().slice(0, 12);
  // 공백·특수문자 제거한 정규화 문자열로 우회(예: "병 신") 매칭
  const normalized = trimmed.replace(/[\s._\-*]/g, "");
  if (PROFANITY.test(trimmed) || PROFANITY.test(normalized)) return "";
  return trimmed;
}

export function checkOutput(text: string): GuardrailResult {
  const hits: GuardrailHit[] = [];
  for (const { category, regex } of PATTERNS) {
    const m = text.match(regex);
    if (m) hits.push({ category, matched: m[0] });
  }
  if (hits.length === 0) {
    return { triggered: false, hits: [], safeText: null };
  }
  // 최우선 카테고리: self_harm > 그 외
  const priority = hits.find((h) => h.category === "self_harm") ?? hits[0];
  return {
    triggered: true,
    hits,
    safeText: SAFE_FALLBACK[priority.category],
  };
}
