import Link from "next/link";

export const metadata = {
  title: "이용약관",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen px-5 py-12" style={{ background: "#0a0814", color: "rgba(255,255,255,0.82)" }}>
      <div className="mx-auto w-full max-w-2xl">
        <Link href="/" className="text-sm text-white/45 hover:text-white transition">← 돌아가기</Link>

        <h1 className="text-[26px] font-black mt-6 mb-2 text-white">이용약관</h1>
        <p className="text-xs text-white/40 mb-6">시행일: 2026-06-20</p>

        <div
          className="text-[12.5px] leading-relaxed mb-8 p-4 rounded-xl"
          style={{ background: "rgba(196,163,255,0.08)", border: "1px solid rgba(196,163,255,0.2)", color: "rgba(255,255,255,0.65)" }}
        >
          ⚠️ 본 문서는 서비스 준비 단계의 초안입니다. 정식 출시 전 법률 전문가 검토를 거쳐 확정됩니다.
        </div>

        <Section n="1" title="목적">
          본 약관은 서비스 이용과 관련하여 이용자와 운영자 간의 권리·의무 및 책임사항을 규정합니다.
        </Section>

        <Section n="2" title="콘텐츠의 성격">
          본 서비스가 제공하는 운세·궁합은 사주·점성·MBTI를 바탕으로 한 <b className="text-white/90">AI 생성 오락·참고용 콘텐츠</b>입니다. 그 내용의 사실성·정확성·미래 예측을 보장하지 않습니다.
        </Section>

        <Section n="3" title="면책 및 책임의 한계">
          운세·궁합 콘텐츠는 <b className="text-white/90">의료·법률·재무·심리 등 전문적 판단의 근거로 사용할 수 없습니다.</b> 이용자가 콘텐츠를 참고하여 내린 결정과 그 결과에 대한 책임은 이용자 본인에게 있으며, 운영자는 이에 대해 법적 책임을 지지 않습니다.
        </Section>

        <Section n="4" title="이용자의 의무">
          <ul className="list-disc pl-5 space-y-1">
            <li>타인의 개인정보를 동의 없이 입력하지 않습니다.</li>
            <li>자동화 수단을 이용한 비정상적 대량 요청 등 서비스 운영을 방해하는 행위를 하지 않습니다.</li>
            <li>닉네임·이름 등에 욕설·타인 비방·불법 정보를 입력하지 않습니다.</li>
          </ul>
        </Section>

        <Section n="5" title="콘텐츠 이용">
          이용자는 생성된 운세·궁합 카드를 개인적·비상업적 목적으로 공유할 수 있습니다.
        </Section>

        <Section n="6" title="서비스의 변경·중단">
          운영자는 서비스의 내용을 변경하거나, 운영상·기술상 필요에 따라 서비스의 전부 또는 일부를 중단할 수 있습니다.
        </Section>

        <Section n="7" title="준거법">
          본 약관은 대한민국 법률에 따라 해석·적용됩니다.
        </Section>

        <p className="text-xs text-white/35 mt-10">
          본 약관은 서비스 정책 변경 시 사전 공지 후 개정될 수 있습니다.
        </p>
      </div>
    </main>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="text-[15px] font-black text-white mb-2">
        <span style={{ color: "#c4a3ff" }}>{n}.</span> {title}
      </h2>
      <div className="text-[13.5px] leading-relaxed text-white/70">{children}</div>
    </section>
  );
}
