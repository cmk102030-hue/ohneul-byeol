import "./globals.css";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "horoscope-kr (TBD)",
  description: "AI 별점 한국형 — 점성 + 사주 + MBTI 융합",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-bg-0 text-white antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
