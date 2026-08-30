"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BIRTH_PLACES, DEFAULT_PLACE_ID } from "@/lib/solar-time";

const YEARS = Array.from({ length: 106 }, (_, i) => 2025 - i);
const pad = (n: number) => String(n).padStart(2, "0");

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block flex-1 min-w-0">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/40">{label}</span>
      {children}
    </label>
  );
}

const selectCls =
  "w-full appearance-none rounded-lg border border-white/10 bg-bg-2 px-3 py-2.5 text-sm text-white/90 outline-none focus:border-accent/60";

export default function MyeongsikForm({
  initial,
}: {
  initial?: { d?: string; t?: string; g?: string; p?: string; u?: string };
}) {
  const router = useRouter();
  const [y, my, dy] = (initial?.d ?? "").split("-");
  const [ht, mt] = (initial?.t ?? "12:00").split(":");

  const [year, setYear] = useState(y ?? "");
  const [month, setMonth] = useState(my ? String(+my) : "");
  const [day, setDay] = useState(dy ? String(+dy) : "");
  const [hour, setHour] = useState(ht ?? "12");
  const [minute, setMinute] = useState(mt ?? "00");
  const [gender, setGender] = useState(initial?.g ?? "");
  const [place, setPlace] = useState(initial?.p ?? DEFAULT_PLACE_ID);
  const [timeUnknown, setTimeUnknown] = useState(initial?.u === "1");

  const daysInMonth = year && month ? new Date(+year, +month, 0).getDate() : 31;
  const ready = year && month && day && gender && (timeUnknown || (hour && minute));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    const q = new URLSearchParams({
      d: `${year}-${pad(+month)}-${pad(+day)}`,
      g: gender,
      p: place,
    });
    if (timeUnknown) q.set("u", "1");
    else q.set("t", `${pad(+hour)}:${pad(+minute)}`);
    router.push(`/myeongsik?${q.toString()}`);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex gap-2">
        <Field label="년">
          <select className={selectCls} value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="" disabled>년도</option>
            {YEARS.map((v) => <option key={v} value={v} className="bg-bg-1">{v}년</option>)}
          </select>
        </Field>
        <Field label="월">
          <select className={selectCls} value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="" disabled>월</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((v) => <option key={v} value={v} className="bg-bg-1">{v}월</option>)}
          </select>
        </Field>
        <Field label="일">
          <select className={selectCls} value={day} onChange={(e) => setDay(e.target.value)}>
            <option value="" disabled>일</option>
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((v) => <option key={v} value={v} className="bg-bg-1">{v}일</option>)}
          </select>
        </Field>
      </div>

      <div className="flex gap-2">
        <Field label="시">
          <select className={selectCls} value={hour} disabled={timeUnknown} onChange={(e) => setHour(e.target.value)}>
            {Array.from({ length: 24 }, (_, i) => i).map((v) => <option key={v} value={pad(v)} className="bg-bg-1">{pad(v)}시</option>)}
          </select>
        </Field>
        <Field label="분">
          <select className={selectCls} value={minute} disabled={timeUnknown} onChange={(e) => setMinute(e.target.value)}>
            {Array.from({ length: 60 }, (_, i) => i).map((v) => <option key={v} value={pad(v)} className="bg-bg-1">{pad(v)}분</option>)}
          </select>
        </Field>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-xs text-white/60">
        <input
          type="checkbox"
          checked={timeUnknown}
          onChange={(e) => setTimeUnknown(e.target.checked)}
          className="h-4 w-4 accent-accent"
        />
        출생 시각을 모릅니다
        <span className="text-white/35">— 시주를 뺀 6글자로 봅니다</span>
      </label>

      <div className="flex gap-2">
        <Field label="성별">
          <select className={selectCls} value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="" disabled>선택</option>
            <option value="M" className="bg-bg-1">남</option>
            <option value="F" className="bg-bg-1">여</option>
          </select>
        </Field>
        <Field label="출생지">
          <select className={selectCls} value={place} onChange={(e) => setPlace(e.target.value)}>
            {BIRTH_PLACES.map((p) => <option key={p.id} value={p.id} className="bg-bg-1">{p.name}</option>)}
          </select>
        </Field>
      </div>
      <p className="text-[11px] leading-relaxed text-white/35">
        성별은 대운의 방향(순행·역행)을 결정하고, 출생지는 진태양시 보정값을 결정합니다. 둘 다 명식이 바뀌는 값이라 추정하지 않습니다.
      </p>

      <button
        type="submit"
        disabled={!ready}
        className="w-full rounded-xl bg-accent py-3.5 text-sm font-semibold text-bg-0 transition disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
      >
        명식 보기
      </button>
    </form>
  );
}
