import Link from "next/link";
import MyeongsikForm from "@/components/MyeongsikForm";
import { getMyeongsik, OHAENG_KO, type Ohaeng, type Myeongsik } from "@/lib/myeongsik";

export const runtime = "nodejs";

const OHAENG_COLOR: Record<Ohaeng, string> = {
  木: "text-emerald-300", 火: "text-rose-300", 土: "text-amber-300",
  金: "text-slate-200", 水: "text-sky-300",
};
const OHAENG_BAR: Record<Ohaeng, string> = {
  木: "bg-emerald-400", 火: "bg-rose-400", 土: "bg-amber-400",
  金: "bg-slate-300", 水: "bg-sky-400",
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <div className="border-t border-white/5 px-2 py-1.5 text-[10px] text-white/30">{label}</div>
      {children}
    </>
  );
}

function Chart({ m }: { m: Myeongsik }) {
  // 만세력 표기 순서: 시주 · 일주 · 월주 · 년주
  const cols = [...m.pillars].reverse();
  const cell = "border-t border-white/5 px-2 py-1.5 text-center text-[11px] text-white/70";
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[340px] grid-cols-[56px_repeat(4,1fr)] rounded-2xl bg-bg-1 ring-1 ring-white/10">
        <div className="px-2 py-2" />
        {cols.map((p) => (
          <div key={p.position} className="px-2 py-2 text-center text-[11px] font-semibold text-white/50">{p.position}</div>
        ))}

        <Row label="십성">
          {cols.map((p) => <div key={p.position} className={cell}>{p.unknown ? "—" : p.ganSipseong}</div>)}
        </Row>

        <div className="border-t border-white/5" />
        {cols.map((p) => (
          <div key={p.position} className="border-t border-white/5 py-2 text-center">
            <span className={`text-3xl font-bold ${p.ganElement ? OHAENG_COLOR[p.ganElement] : "text-white/20"}`}>
              {p.gan || "?"}
            </span>
            <span className="mt-0.5 block text-[10px] text-white/35">{p.ganKo}</span>
          </div>
        ))}

        <div className="border-t border-white/5" />
        {cols.map((p) => (
          <div key={p.position} className="border-t border-white/5 py-2 text-center">
            <span className={`text-3xl font-bold ${p.zhiElement ? OHAENG_COLOR[p.zhiElement] : "text-white/20"}`}>
              {p.zhi || "?"}
            </span>
            <span className="mt-0.5 block text-[10px] text-white/35">{p.zhiKo}</span>
          </div>
        ))}

        <Row label="십성">
          {cols.map((p) => <div key={p.position} className={cell}>{p.unknown ? "—" : p.zhiSipseong}</div>)}
        </Row>
        <Row label="지장간">
          {cols.map((p) => <div key={p.position} className={cell}>{p.hideGan.join("") || "—"}</div>)}
        </Row>
        <Row label="12운성">
          {cols.map((p) => <div key={p.position} className={cell}>{p.diShi || "—"}</div>)}
        </Row>
        <Row label="납음">
          {cols.map((p) => <div key={p.position} className={cell}>{p.naYin || "—"}</div>)}
        </Row>
      </div>
    </div>
  );
}

function Result({ m }: { m: Myeongsik }) {
  const total = Object.values(m.ohaeng).reduce((a, b) => a + b, 0);
  const c = m.correction;
  const tight = c.hourBoundaryMin !== null && c.hourBoundaryMin <= 20;
  const cur = m.daeun.list.find((d) => d.isCurrent);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-white/35">일간</p>
        <p className="mt-1 text-lg">
          <span className={`text-2xl font-bold ${m.ilganElement ? OHAENG_COLOR[m.ilganElement] : ""}`}>{m.ilgan}</span>
          <span className="ml-2 text-white/70">{m.ilganKo}{m.ilganElement ? ` · ${OHAENG_KO[m.ilganElement]}` : ""}</span>
          <span className="ml-2 text-white/35">{m.bazi.zodiacAnimal}띠</span>
        </p>
      </div>

      <Chart m={m} />

      {/* 오행 분포 */}
      <section>
        <h2 className="mb-2 text-xs font-semibold text-white/50">오행 분포</h2>
        <div className="flex gap-1.5">
          {(Object.keys(m.ohaeng) as Ohaeng[]).map((k) => (
            <div key={k} className="flex-1 rounded-lg bg-bg-1 px-2 py-2 text-center ring-1 ring-white/5">
              <div className={`text-sm font-bold ${OHAENG_COLOR[k]}`}>{k}</div>
              <div className="text-[10px] text-white/35">{OHAENG_KO[k]}</div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                <div className={`h-full ${OHAENG_BAR[k]}`} style={{ width: `${(m.ohaeng[k] / Math.max(total, 1)) * 100}%` }} />
              </div>
              <div className={`mt-1 text-sm font-semibold ${m.ohaeng[k] === 0 ? "text-white/25" : "text-white/80"}`}>{m.ohaeng[k]}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 합충 */}
      <section>
        <h2 className="mb-2 text-xs font-semibold text-white/50">합·충·형·파·해</h2>
        {m.relations.length === 0 ? (
          <p className="text-xs text-white/35">없음</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {m.relations.map((r, i) => (
              <span key={i} className="rounded-full bg-bg-2 px-2.5 py-1 text-[11px] text-white/70 ring-1 ring-white/10">
                <b className="text-accent">{r.kind}</b> {r.chars}
                <span className="ml-1 text-white/35">{r.note ?? r.between}</span>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* 대운 */}
      <section>
        <h2 className="mb-2 text-xs font-semibold text-white/50">
          대운 <span className="font-normal text-white/30">{m.daeun.forward ? "순행" : "역행"} · 대운수 {m.daeun.startAge}</span>
        </h2>
        <div className="overflow-x-auto">
          <div className="flex min-w-max gap-1.5">
            {m.daeun.list.slice(0, 10).map((d) => (
              <div
                key={d.startYear}
                className={`w-[68px] shrink-0 rounded-lg px-1.5 py-2 text-center ring-1 ${
                  d.isCurrent ? "bg-accent/15 ring-accent/50" : "bg-bg-1 ring-white/5"
                }`}
              >
                <div className="text-[10px] text-white/35">{d.startAge}세</div>
                <div className="my-0.5 text-base font-bold text-white/85">{d.ganzhi}</div>
                <div className="text-[10px] text-white/50">{d.sipseong}</div>
                <div className="mt-0.5 text-[9px] text-white/25">{d.startYear}~</div>
              </div>
            ))}
          </div>
        </div>
        {cur && (
          <p className="mt-2 text-[11px] text-white/45">
            현재 <b className="text-accent">{cur.startAge}세 {cur.ganzhiKo}({cur.sipseong})</b> 대운 · {cur.startYear}~{cur.endYear}
          </p>
        )}
      </section>

      {/* 명식 확정 근거 — 정확도 공개 */}
      <section className="rounded-2xl bg-bg-1 p-4 ring-1 ring-white/10">
        <h2 className="mb-2.5 text-xs font-semibold text-white/50">명식 확정 근거</h2>
        <dl className="space-y-1.5 text-[11px] text-white/60">
          <div className="flex justify-between gap-3">
            <dt className="text-white/35">진태양시 보정</dt>
            <dd className="text-right">
              {c.placeName} 경도 {c.solarOffsetMin}분 {c.eotMin >= 0 ? "+" : "−"} 균시차 {Math.abs(c.eotMin)}분
              {" = "}<b className="text-white/85">{c.totalOffsetMin}분</b>
              {c.correctedTime && <> → {c.correctedTime}</>}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-white/35">절입</dt>
            <dd className="text-right">
              {m.jeolip.prev.name} +{m.jeolip.daysFromPrev}일 / {m.jeolip.next.name} −{m.jeolip.daysToNext}일
            </dd>
          </div>
          {m.bazi.timeUnknown && (
            <div className="flex justify-between gap-3">
              <dt className="text-white/35">시주</dt>
              <dd className="text-right text-amber-300">미상 — 산출하지 않음</dd>
            </div>
          )}
        </dl>

        {(tight || m.jeolip.boundary) && (
          <div className="mt-3 space-y-2 rounded-xl bg-amber-400/10 p-3 text-[11px] leading-relaxed text-amber-100/90 ring-1 ring-amber-400/25">
            {tight && (
              <p>
                <b>시주 경계에 있습니다.</b> 보정 후 시각이 시진 경계에서 {c.hourBoundaryMin}분 거리입니다.
                본 앱은 진태양시 보정을 적용하고 시진 경계는 정시법(11:00~13:00 = 午時)을 씁니다.
                보정을 쓰지 않거나 30분법을 쓰는 만세력과는 시주가 다르게 나올 수 있습니다.
              </p>
            )}
            {m.jeolip.boundary && (
              <p>
                <b>절입 경계에 있습니다.</b> {m.jeolip.daysFromPrev <= 3 ? `${m.jeolip.prev.name} 직후` : `${m.jeolip.next.name} 직전`}이라
                출생 시각이 조금만 달라도 월주가 바뀝니다. 월지에 기대는 해석(월령·격국·용신)은 그만큼 여지를 두고 보세요.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: { d?: string; t?: string; g?: string; p?: string; u?: string };
}) {
  const { d, t, g, p, u } = searchParams;
  const valid = !!d && /^\d{4}-\d{2}-\d{2}$/.test(d) && (g === "M" || g === "F");
  let m: Myeongsik | null = null;
  let error: string | null = null;
  if (valid) {
    try {
      m = getMyeongsik(d!, t ?? "12:00", g as "M" | "F", { placeId: p, timeUnknown: u === "1" });
    } catch {
      error = "명식을 세우지 못했습니다. 입력을 확인해 주세요.";
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-lg px-5 py-10">
      <header className="mb-7">
        <h1 className="text-xl font-bold text-white/90">명식</h1>
        <p className="mt-1 text-xs text-white/40">
          생년월일시로 사주 여덟 글자를 세웁니다. 계산 근거를 전부 공개합니다.
        </p>
      </header>

      {m ? (
        <>
          <p className="mb-5 text-[11px] text-white/35">
            {d} {m.bazi.timeUnknown ? "(시각 미상)" : t} · {g === "M" ? "남" : "여"} · {m.correction.placeName}
            {" · 음력 "}{m.bazi.lunar.year}-{m.bazi.lunar.month}-{m.bazi.lunar.day}
            {m.bazi.lunar.isLeapMonth && " (윤달)"}
          </p>
          <Result m={m} />
          <Link href="/myeongsik" className="mt-8 block text-center text-xs text-white/40 underline underline-offset-4">
            다시 입력하기
          </Link>
        </>
      ) : (
        <>
          {error && <p className="mb-4 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-200 ring-1 ring-rose-400/25">{error}</p>}
          <MyeongsikForm initial={{ d, t, g, p, u }} />
        </>
      )}
    </main>
  );
}
