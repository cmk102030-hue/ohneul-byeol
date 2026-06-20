/**
 * 22장 메이저 아르카나 한국화 카드 데이터.
 * V1: 메이저만. V2: 계절 4종(봄·여름·가을·겨울) 확장 = 88장.
 */

export type Card = {
  id: string; // slug
  number: number; // 0~21
  name: string; // 한국어 이름
  english: string;
  symbol: string; // emoji 또는 상징 (V2 일러스트로 교체)
  gradient: string; // tailwind from-X to-Y
  keywords: [string, string, string];
  light: string; // 긍정 의미 1줄
  shadow: string; // 그림자 의미 1줄
  mission: string; // 오늘의 미션 (실생활 액션)
};

export const CARDS: Card[] = [
  { id: "fool",        number: 0,  name: "바보",       english: "The Fool",        symbol: "🌱", gradient: "from-emerald-300 to-cyan-400", keywords: ["새 시작", "순수", "도약"], light: "두려움 없이 새 길을 걸을 때.", shadow: "준비 없이 뛰어드는 무모함.", mission: "오늘 처음 해보는 일 1개 시도해봐." },
  { id: "magician",    number: 1,  name: "마법사",     english: "The Magician",    symbol: "✦",  gradient: "from-purple-400 to-fuchsia-500", keywords: ["의지", "창조", "기술"], light: "원하는 걸 만들어낼 힘이 너에게 있다.", shadow: "재능을 잘못된 방향에 쓰는 위험.", mission: "오늘 너의 스킬 1개를 누군가에게 자랑해봐." },
  { id: "priestess",   number: 2,  name: "여사제",     english: "The High Priestess", symbol: "☾", gradient: "from-indigo-400 to-violet-600", keywords: ["직관", "신비", "내면"], light: "직감이 답을 알고 있다.", shadow: "남이 너 대신 결정하게 두는 수동성.", mission: "오늘 결정 1개는 머리 말고 직감으로." },
  { id: "empress",     number: 3,  name: "여황제",     english: "The Empress",     symbol: "♀",  gradient: "from-pink-400 to-rose-500", keywords: ["풍요", "사랑", "감각"], light: "베푸는 만큼 돌아오는 날.", shadow: "과보호로 상대를 숨막히게 함.", mission: "좋아하는 사람한테 작은 선물 1개." },
  { id: "emperor",     number: 4,  name: "황제",       english: "The Emperor",     symbol: "♚",  gradient: "from-red-500 to-orange-600", keywords: ["권위", "구조", "안정"], light: "규칙을 세워 혼란을 정리할 시간.", shadow: "고집으로 변화를 막는 위험.", mission: "어지러운 공간 1곳 정리해봐." },
  { id: "hierophant",  number: 5,  name: "교황",       english: "The Hierophant",  symbol: "✟",  gradient: "from-amber-400 to-yellow-600", keywords: ["전통", "배움", "조언"], light: "선배·멘토에게 한 수 배울 때.", shadow: "관습에 갇혀 너의 색을 잃음.", mission: "존경하는 사람한테 조언 1개 물어봐." },
  { id: "lovers",      number: 6,  name: "연인",       english: "The Lovers",      symbol: "♥",  gradient: "from-rose-400 to-pink-600", keywords: ["선택", "관계", "조화"], light: "두 가지 사이 진심으로 한쪽을 골라.", shadow: "쉬운 길을 진실이라 착각.", mission: "미루던 고백·표현 1개 오늘 해버려." },
  { id: "chariot",     number: 7,  name: "전차",       english: "The Chariot",     symbol: "⚔",  gradient: "from-sky-400 to-blue-600", keywords: ["의지", "돌파", "속도"], light: "방향만 정하면 거기까지 갈 수 있다.", shadow: "통제 없이 질주하다 폭주.", mission: "미루던 1순위 일에 30분 몰입." },
  { id: "strength",    number: 8,  name: "힘",         english: "Strength",        symbol: "🦁", gradient: "from-yellow-400 to-orange-500", keywords: ["용기", "인내", "온화"], light: "부드러움이 가장 강한 힘.", shadow: "참기만 하다 폭발.", mission: "화났던 상대한테 먼저 가볍게 말 걸어봐." },
  { id: "hermit",      number: 9,  name: "은둔자",     english: "The Hermit",      symbol: "🕯", gradient: "from-slate-400 to-zinc-700", keywords: ["성찰", "고독", "지혜"], light: "혼자 있는 시간이 답을 준다.", shadow: "고립이 길어져 단절.", mission: "오늘 30분 폰 꺼두고 생각만." },
  { id: "wheel",       number: 10, name: "운명의 수레", english: "Wheel of Fortune", symbol: "☸", gradient: "from-teal-400 to-emerald-600", keywords: ["전환", "흐름", "운"], light: "흐름이 바뀐다. 잡아라.", shadow: "변화를 거부해 기회를 놓침.", mission: "오늘 하나는 평소와 정반대로 해봐." },
  { id: "justice",     number: 11, name: "정의",       english: "Justice",         symbol: "⚖",  gradient: "from-cyan-400 to-blue-500", keywords: ["균형", "결과", "진실"], light: "뿌린 대로 거두는 정직한 날.", shadow: "냉정해서 인간미를 잃음.", mission: "미뤘던 정산·정리·계산 1건 끝내." },
  { id: "hanged",      number: 12, name: "매달린 사람", english: "The Hanged Man",  symbol: "⥢",  gradient: "from-blue-400 to-indigo-600", keywords: ["보류", "관점", "희생"], light: "잠시 멈춰서 다르게 봐.", shadow: "변명하며 미루는 정체.", mission: "오늘은 의도적으로 1시간 아무것도 하지 마." },
  { id: "death",       number: 13, name: "죽음",       english: "Death",           symbol: "✘",  gradient: "from-zinc-600 to-slate-900", keywords: ["끝", "재탄생", "변화"], light: "끝나야 시작된다. 정리할 것은 정리.", shadow: "끝을 두려워해 매달림.", mission: "오늘 더 이상 안 쓰는 것 5개 버리거나 정리해." },
  { id: "temperance",  number: 14, name: "절제",       english: "Temperance",      symbol: "⚗",  gradient: "from-emerald-400 to-teal-600", keywords: ["조화", "중용", "치유"], light: "양 끝의 가운데가 답.", shadow: "타협만 하다 색을 잃음.", mission: "오늘 한 끼는 평소보다 천천히 먹어봐." },
  { id: "devil",       number: 15, name: "악마",       english: "The Devil",       symbol: "⛧",  gradient: "from-rose-600 to-red-900", keywords: ["집착", "유혹", "사슬"], light: "벗어나야 할 습관을 똑바로 봐.", shadow: "스스로 만든 감옥에 머묾.", mission: "오늘 SNS·과식·과음 중 1개 24시간 끊어봐." },
  { id: "tower",       number: 16, name: "탑",         english: "The Tower",       symbol: "⚡",  gradient: "from-orange-500 to-red-700", keywords: ["붕괴", "충격", "각성"], light: "낡은 것이 무너져야 새것이 선다.", shadow: "지키려다 더 크게 무너짐.", mission: "오랫동안 미루던 어려운 진실 1개 인정해봐." },
  { id: "star",        number: 17, name: "별",         english: "The Star",        symbol: "★",  gradient: "from-sky-300 to-violet-500", keywords: ["희망", "치유", "영감"], light: "어둠 속 작은 빛이 보일 때.", shadow: "환상에 매달리는 도피.", mission: "오늘 너만 아는 작은 소원 1개를 적어두기." },
  { id: "moon",        number: 18, name: "달",         english: "The Moon",        symbol: "☽",  gradient: "from-indigo-500 to-purple-800", keywords: ["환상", "불안", "꿈"], light: "보이지 않는 것을 느낄 때.", shadow: "오해와 두려움이 진실처럼 보임.", mission: "오늘 본 꿈·환상·기분 1줄로 기록." },
  { id: "sun",         number: 19, name: "태양",       english: "The Sun",         symbol: "☀",  gradient: "from-yellow-300 to-orange-500", keywords: ["기쁨", "성공", "활력"], light: "내보일수록 빛난다.", shadow: "자만으로 주변을 가림.", mission: "오늘 SNS에 행복한 순간 1장 올려봐." },
  { id: "judgement",   number: 20, name: "심판",       english: "Judgement",       symbol: "⚐",  gradient: "from-violet-400 to-fuchsia-600", keywords: ["부름", "각성", "재평가"], light: "후회 없이 결정해. 너 자신이 심판이다.", shadow: "남의 평가에 휘둘림.", mission: "1년간 마음에 걸렸던 1건 오늘 끝내거나 시작해." },
  { id: "world",       number: 21, name: "세계",       english: "The World",       symbol: "🌐", gradient: "from-emerald-500 to-cyan-700", keywords: ["완성", "성취", "여정"], light: "한 챕터의 마침표. 자축할 시간.", shadow: "완벽주의로 끝맺음 미룸.", mission: "최근에 끝낸 일 1개를 친구한테 자랑해봐." },
];

export function getCardById(id: string): Card | null {
  return CARDS.find((c) => c.id === id) ?? null;
}
