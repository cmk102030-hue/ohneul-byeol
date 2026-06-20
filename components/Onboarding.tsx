"use client";

import { useMemo, useState } from "react";
import type { BirthProfile } from "@/lib/storage";

const MBTI_LIST = [
  "INTJ","INTP","ENTJ","ENTP",
  "INFJ","INFP","ENFJ","ENFP",
  "ISTJ","ISFJ","ESTJ","ESFJ",
  "ISTP","ISFP","ESTP","ESFP",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 80 }, (_, i) => CURRENT_YEAR - 5 - i); // 작년부터 80년 전까지 (대부분 성인)
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 10, 20, 30, 40, 50];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function pad(n: number | string, len = 2): string {
  return String(n).padStart(len, "0");
}

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  width?: string;
};

function SelectField({ label, value, onChange, options, placeholder, width = "auto" }: SelectFieldProps) {
  return (
    <label className="block flex-1" style={{ minWidth: width }}>
      <span className="text-[10px] text-white/40 mb-1.5 block tracking-wider uppercase font-semibold">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-bg-1 border border-white/10 rounded-xl px-4 py-3.5 text-white font-bold focus:border-accent outline-none cursor-pointer hover:border-white/30 transition pr-9"
        >
          <option value="" disabled className="bg-bg-1">{placeholder ?? "선택"}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-bg-1">{o.label}</option>
          ))}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 text-xs">▼</span>
      </div>
    </label>
  );
}

export default function Onboarding({ onDone }: { onDone: (p: BirthProfile) => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [hour, setHour] = useState("12");
  const [minute, setMinute] = useState("00");
  const [mbti, setMbti] = useState("");
  const [nickname, setNickname] = useState("");
  const [agreed, setAgreed] = useState(false);

  const dayOptions = useMemo(() => {
    const max = year && month ? daysInMonth(Number(year), Number(month)) : 31;
    return Array.from({ length: max }, (_, i) => ({ value: String(i + 1), label: `${i + 1}일` }));
  }, [year, month]);

  const canStep1 = year !== "" && month !== "" && day !== "" && hour !== "" && minute !== "";
  const canStep2 = mbti.length === 4;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Floating stars background */}
      <div className="absolute inset-0 starfield pointer-events-none" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(196,163,255,0.18) 0%, transparent 60%)" }}
      />

      <div className="relative w-full max-w-md z-10">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-10">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                s === step ? "bg-accent w-16 shadow-[0_0_12px_rgba(196,163,255,0.6)]" : s < step ? "bg-accent/50 w-8" : "bg-white/10 w-8"
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-7">
            <div>
              <h2 className="text-[28px] font-black tracking-tight leading-tight">
                <span className="bg-gradient-to-br from-white to-accent bg-clip-text text-transparent">언제 태어났어?</span>
              </h2>
              <p className="text-sm text-white/50 mt-2.5">정확한 사주·점성 계산에 필요해.</p>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-[10px] text-white/40 mb-2 tracking-wider uppercase font-semibold">생년월일</div>
                <div className="flex gap-2">
                  <SelectField
                    label="년"
                    value={year}
                    onChange={(v) => { setYear(v); if (day && Number(day) > daysInMonth(Number(v), Number(month || 1))) setDay(""); }}
                    options={YEARS.map((y) => ({ value: String(y), label: `${y}년` }))}
                    placeholder="년도"
                  />
                  <SelectField
                    label="월"
                    value={month}
                    onChange={(v) => { setMonth(v); if (day && year && Number(day) > daysInMonth(Number(year), Number(v))) setDay(""); }}
                    options={MONTHS.map((m) => ({ value: String(m), label: `${m}월` }))}
                    placeholder="월"
                  />
                  <SelectField
                    label="일"
                    value={day}
                    onChange={setDay}
                    options={dayOptions}
                    placeholder="일"
                  />
                </div>
              </div>
              <div>
                <div className="text-[10px] text-white/40 mb-2 tracking-wider uppercase font-semibold">태어난 시간 <span className="text-white/30 normal-case tracking-normal">(모르면 12:00)</span></div>
                <div className="flex gap-2">
                  <SelectField
                    label="시"
                    value={hour}
                    onChange={setHour}
                    options={HOURS.map((h) => ({ value: pad(h), label: `${pad(h)}시` }))}
                  />
                  <SelectField
                    label="분"
                    value={minute}
                    onChange={setMinute}
                    options={MINUTES.map((m) => ({ value: pad(m), label: `${pad(m)}분` }))}
                  />
                </div>
              </div>
            </div>
            <button
              disabled={!canStep1}
              onClick={() => setStep(2)}
              className="w-full bg-gradient-to-r from-accent to-accent-pink text-bg-0 font-black py-4 rounded-2xl text-base disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_8px_24px_-8px_rgba(196,163,255,0.6)] hover:shadow-[0_12px_32px_-8px_rgba(196,163,255,0.8)] hover:scale-[1.01] active:scale-[0.99] transition"
            >
              다음 →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-7">
            <div>
              <h2 className="text-[28px] font-black tracking-tight leading-tight">
                <span className="bg-gradient-to-br from-white to-accent bg-clip-text text-transparent">MBTI 알려줘</span>
              </h2>
              <p className="text-sm text-white/50 mt-2.5">모르면 건너뛰어도 돼.</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {MBTI_LIST.map((m) => {
                const active = mbti === m;
                return (
                  <button
                    key={m}
                    onClick={() => setMbti(m)}
                    className={`py-3.5 rounded-xl text-sm font-black tracking-tight transition-all ${
                      active
                        ? "bg-gradient-to-br from-accent to-accent-pink text-bg-0 shadow-[0_6px_20px_-6px_rgba(196,163,255,0.7)] scale-[1.03]"
                        : "bg-bg-1 border border-white/10 text-white/60 hover:border-accent/50 hover:text-white"
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-bg-1 border border-white/10 text-white/70 font-bold py-4 rounded-2xl hover:border-white/30 transition"
              >
                ← 뒤로
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-gradient-to-r from-accent to-accent-pink text-bg-0 font-black py-4 rounded-2xl shadow-[0_8px_24px_-8px_rgba(196,163,255,0.6)] hover:scale-[1.01] active:scale-[0.99] transition"
              >
                {canStep2 ? "다음 →" : "건너뛰기 →"}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-7">
            <div>
              <h2 className="text-[28px] font-black tracking-tight leading-tight">
                <span className="bg-gradient-to-br from-white to-accent bg-clip-text text-transparent">뭐라고 부를까?</span>
              </h2>
              <p className="text-sm text-white/50 mt-2.5">운세에 너 이름이 들어가. 선택사항이야.</p>
            </div>
            <input
              type="text"
              placeholder="닉네임 (선택)"
              value={nickname}
              maxLength={20}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-bg-1 border border-white/10 rounded-xl px-4 py-4 text-white text-base font-bold focus:border-accent outline-none placeholder:font-normal placeholder:text-white/30"
            />

            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-accent shrink-0"
              />
              <span className="text-[12px] text-white/55 leading-relaxed">
                <span className="text-accent font-bold">[필수]</span> 생년월일·MBTI 등 입력 정보의 수집·이용과{" "}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline text-white/80 hover:text-white">이용약관</a>
                ·
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline text-white/80 hover:text-white">개인정보처리방침</a>
                에 동의해요.
              </span>
            </label>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-bg-1 border border-white/10 text-white/70 font-bold py-4 rounded-2xl hover:border-white/30 transition"
              >
                ← 뒤로
              </button>
              <button
                disabled={!agreed}
                onClick={() =>
                  onDone({
                    birthDate: `${year}-${pad(month)}-${pad(day)}`,
                    birthTime: `${pad(hour)}:${pad(minute)}`,
                    mbti: canStep2 ? mbti : undefined,
                    nickname: nickname.trim() || undefined,
                  })
                }
                className="flex-1 bg-gradient-to-r from-accent to-accent-pink text-bg-0 font-black py-4 rounded-2xl shadow-[0_8px_24px_-8px_rgba(196,163,255,0.6)] hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                오늘 운세 보기 →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
