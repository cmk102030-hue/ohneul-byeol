export type MBTICode =
  | "INTJ" | "INTP" | "ENTJ" | "ENTP"
  | "INFJ" | "INFP" | "ENFJ" | "ENFP"
  | "ISTJ" | "ISFJ" | "ESTJ" | "ESFJ"
  | "ISTP" | "ISFP" | "ESTP" | "ESFP";

export type Temperament = "Analyst" | "Diplomat" | "Sentinel" | "Explorer";

export type MBTIInfo = {
  code: MBTICode;
  korean: string;
  nickname: string;
  temperament: Temperament;
  keywords: string[];
};

export const MBTI_TABLE: Record<MBTICode, MBTIInfo> = {
  INTJ: { code: "INTJ", korean: "용의주도한 전략가", nickname: "건축가", temperament: "Analyst", keywords: ["전략", "독립", "비전"] },
  INTP: { code: "INTP", korean: "논리적인 사색가", nickname: "사상가", temperament: "Analyst", keywords: ["논리", "탐구", "독창"] },
  ENTJ: { code: "ENTJ", korean: "대담한 통솔자", nickname: "통솔자", temperament: "Analyst", keywords: ["리더십", "결단", "효율"] },
  ENTP: { code: "ENTP", korean: "뜨거운 토론가", nickname: "변론가", temperament: "Analyst", keywords: ["혁신", "토론", "유연"] },
  INFJ: { code: "INFJ", korean: "선의의 옹호자", nickname: "옹호자", temperament: "Diplomat", keywords: ["통찰", "이상", "신념"] },
  INFP: { code: "INFP", korean: "열정적인 중재자", nickname: "중재자", temperament: "Diplomat", keywords: ["감성", "이상", "내면"] },
  ENFJ: { code: "ENFJ", korean: "정의로운 사회운동가", nickname: "선도자", temperament: "Diplomat", keywords: ["공감", "리더", "사명"] },
  ENFP: { code: "ENFP", korean: "재기발랄한 활동가", nickname: "활동가", temperament: "Diplomat", keywords: ["열정", "자유", "창의"] },
  ISTJ: { code: "ISTJ", korean: "청렴결백한 논리주의자", nickname: "현실주의자", temperament: "Sentinel", keywords: ["책임", "사실", "전통"] },
  ISFJ: { code: "ISFJ", korean: "용감한 수호자", nickname: "수호자", temperament: "Sentinel", keywords: ["헌신", "보호", "성실"] },
  ESTJ: { code: "ESTJ", korean: "엄격한 관리자", nickname: "경영자", temperament: "Sentinel", keywords: ["체계", "원칙", "결단"] },
  ESFJ: { code: "ESFJ", korean: "사교적인 외교관", nickname: "집정관", temperament: "Sentinel", keywords: ["조화", "배려", "공동체"] },
  ISTP: { code: "ISTP", korean: "만능 재주꾼", nickname: "장인", temperament: "Explorer", keywords: ["실용", "관찰", "독립"] },
  ISFP: { code: "ISFP", korean: "호기심 많은 예술가", nickname: "모험가", temperament: "Explorer", keywords: ["감각", "조용", "자유"] },
  ESTP: { code: "ESTP", korean: "모험을 즐기는 사업가", nickname: "사업가", temperament: "Explorer", keywords: ["행동", "사교", "현실"] },
  ESFP: { code: "ESFP", korean: "자유로운 영혼의 연예인", nickname: "연예인", temperament: "Explorer", keywords: ["흥", "공감", "현재"] },
};

export function getMBTI(code: string | null | undefined): MBTIInfo | null {
  if (!code) return null;
  const k = code.toUpperCase() as MBTICode;
  return MBTI_TABLE[k] ?? null;
}
