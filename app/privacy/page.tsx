import Link from "next/link";

export const metadata = {
  title: "개인정보처리방침",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-5 py-12" style={{ background: "#0a0814", color: "rgba(255,255,255,0.82)" }}>
      <div className="mx-auto w-full max-w-2xl">
        <Link href="/" className="text-sm text-white/45 hover:text-white transition">← 돌아가기</Link>

        <h1 className="text-[26px] font-black mt-6 mb-2 text-white">개인정보처리방침</h1>
        <p className="text-xs text-white/40 mb-6">시행일: 2026-06-20</p>

        <div
          className="text-[12.5px] leading-relaxed mb-8 p-4 rounded-xl"
          style={{ background: "rgba(196,163,255,0.08)", border: "1px solid rgba(196,163,255,0.2)", color: "rgba(255,255,255,0.65)" }}
        >
          ⚠️ 본 문서는 서비스 준비 단계의 초안입니다. 정식 출시 전 법률 전문가 검토를 거쳐 확정됩니다.
        </div>

        <Section n="1" title="수집하는 개인정보 항목">
          서비스는 운세·궁합 콘텐츠 제공을 위해 다음 정보를 수집합니다.
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>필수: 생년월일, 태어난 시간</li>
            <li>선택: MBTI, 닉네임</li>
            <li>친구 궁합 이용 시: 상대방의 생년월일·시간·MBTI·이름(이용자가 직접 입력)</li>
          </ul>
        </Section>

        <Section n="2" title="수집·이용 목적">
          입력한 정보는 사주·점성·MBTI 계산과 AI 기반 운세·궁합 텍스트 생성에만 이용합니다. 마케팅·광고 식별 목적의 별도 수집은 하지 않습니다.
        </Section>

        <Section n="3" title="저장 위치 및 보관">
          프로필(생년월일·시간·MBTI·닉네임)과 카드 컬렉션은 <b className="text-white/90">이용자 본인의 기기(브라우저 저장소)에만</b> 저장되며, 운영자의 별도 서버 데이터베이스에 저장하지 않습니다. 기기에서 &lsquo;초기화&rsquo;를 누르면 즉시 삭제됩니다.
        </Section>

        <Section n="4" title="개인정보의 국외 이전">
          운세·궁합 텍스트 생성을 위해 별자리·사주·MBTI 등 <b className="text-white/90">계산된 파생 정보</b>를 AI 처리 업체 Anthropic, PBC(미국)의 Claude API로 전송합니다.
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>이전 항목: 별자리·사주 천간/지지·MBTI·뽑힌 카드 등 파생 정보 (텍스트 생성 입력값)</li>
            <li>생년월일 원본은 전송하지 않으며, 서버에서 계산에만 사용 후 즉시 폐기합니다.</li>
            <li>이전 목적: AI 운세·궁합 문장 생성. 보유 기간: 생성 즉시 처리 후 미보관.</li>
          </ul>
        </Section>

        <Section n="5" title="제3자(친구) 정보 처리">
          친구 궁합 기능에서 입력한 상대방 정보는 궁합 계산에만 일시적으로 이용하며 서버에 저장하지 않습니다. 상대방의 생년월일 등은 <b className="text-white/90">상대방의 동의를 받아</b> 입력해 주세요.
        </Section>

        <Section n="6" title="만 14세 미만 아동">
          서비스는 만 14세 미만 아동의 개인정보를 법정대리인의 동의 없이 수집하지 않습니다.
        </Section>

        <Section n="7" title="이용자의 권리">
          이용자는 언제든 기기의 &lsquo;초기화&rsquo; 기능으로 저장된 모든 정보를 직접 삭제(파기)할 수 있습니다.
        </Section>

        <Section n="8" title="문의처">
          개인정보 관련 문의: <span className="text-white/80">(운영자 이메일 — 출시 전 기재)</span>
        </Section>

        <p className="text-xs text-white/35 mt-10">
          본 방침은 서비스 정책 변경 시 사전 공지 후 개정될 수 있습니다.
        </p>
      </div>
    </main>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="text-[15px] font-black text-white mb-2">
        <span className="text-accent" style={{ color: "#c4a3ff" }}>{n}.</span> {title}
      </h2>
      <div className="text-[13.5px] leading-relaxed text-white/70">{children}</div>
    </section>
  );
}
