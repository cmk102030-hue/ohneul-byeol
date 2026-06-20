import "./globals.css";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "오늘의 별 — 오늘의 운세·친구 궁합",
  description: "점성·사주·MBTI를 융합한 AI 운세와 친구 궁합. 오늘의 별에서 매일 한 줄.",
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
