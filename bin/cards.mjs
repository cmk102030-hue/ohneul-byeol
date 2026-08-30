#!/usr/bin/env node
/**
 * 인스타 카드뉴스 생성 — 1080×1350(4:5) · 리포트와 같은 팔레트.
 * 서사: 결핍 하나(土 0)를 끝까지 밀어 "당신에게도 빈 자리가 있다"로 착지.
 * 사용: node bin/cards.mjs  →  out/_cards/*.png
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const OUT = "out/_cards";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// ── 카드 정의 (kind: cover | bazi | big | body | quote | cta)
const CARDS = [
  { kind: "cover", crest: "命",
    kicker: "여섯 글자로 읽는 사람",
    title: "학교를 일찍 떠난 사람의\n사주에는\n무엇이 없었을까",
    sub: "1915년 11월 25일생 · 강원 통천" },

  { kind: "bazi", label: "기록에 남은 여섯 글자",
    cols: [["乙","卯","mok","mok"],["丁","亥","hwa","su"],["庚","申","geum","geum"]],
    names: ["년주","월주","일주"],
    note: "태어난 해·달·날이 정한 여섯 글자입니다." },

  { kind: "big", pre: "다섯 기운을 세어 봅니다",
    big: "土 0",
    post: "나무 둘 · 불 하나 · 흙 <b>없음</b> · 쇠 둘 · 물 하나" },

  { kind: "body", h: "흙이 뜻하는 것",
    p: "명리에서 흙은 <b>배움·자격·문서</b>의 자리입니다.\n나를 채워주고 뒤에서 받쳐주는 힘이기도 합니다.\n\n그 자리가 하나도 없다는 것은,\n<b>배워서 얻는 길이 구조적으로 좁다</b>는 뜻입니다." },

  { kind: "quote", q: "학력으로 얻는 길은 닫혀 있고\n만들어서 얻는 길만 열려 있다" },

  { kind: "body", h: "그래서 어떻게 살았나",
    p: "그는 소학교를 마치고 학교를 떠났습니다.\n자격도 간판도 없이 시작했고,\n<b>맨손으로 회사를 세웠습니다.</b>\n\n여섯 글자가 가리킨 방향 그대로입니다." },

  { kind: "quote", q: "만약 흙이 있었다면\n훨씬 안정적인 인생을 살았을 것입니다.\n\n그리고 아마\n아무것도 새로 만들지 않았을 것입니다." },

  { kind: "big", pre: "이 사주가 남기는 한 줄",
    big: "결핍이 없었다면\n동력도 없었다",
    post: "없는 것이 곧 미는 힘이 됩니다." },

  { kind: "body", h: "그럼 당신은",
    p: "여덟 글자를 다 채운 사람은 없습니다.\n<b>누구에게나 비어 있는 자리가 하나는 있습니다.</b>\n\n그것이 무엇인지,\n그리고 그 결핍이 당신을 어디로 밀고 있는지 —\n거기서부터 사주가 쓸모를 갖습니다." },

  { kind: "cta", title: "당신의 여덟 글자로\n쓰는 책 한 권",
    lines: ["12장 · 104쪽 · A5 판형",
            "이름이 새겨진 표지와 차례",
            "지나온 해들을 먼저 짚어드립니다"],
    foot: "프로필 링크에서 신청" },
];

// ── 렌더
const card = (c, i, n) => {
  const inner = {
    cover: () => `
      <div class="crest">${c.crest}</div>
      <p class="kicker">${c.kicker}</p>
      <h1>${c.title.replace(/\n/g, "<br>")}</h1>
      <p class="sub">${c.sub}</p>`,
    bazi: () => `
      <p class="kicker">${c.label}</p>
      <div class="bz">
        ${c.cols.map(([g, z, ge, ze], k) => `
          <div class="bzcol">
            <span class="el-${ge}">${g}</span>
            <span class="el-${ze}">${z}</span>
            <i>${c.names[k]}</i>
          </div>`).join("")}
      </div>
      <p class="note">${c.note}</p>`,
    big: () => `
      <p class="kicker">${c.pre}</p>
      <div class="bignum">${c.big.replace(/\n/g, "<br>")}</div>
      <p class="note">${c.post}</p>`,
    body: () => `
      <h2>${c.h}</h2>
      <p class="para">${c.p.replace(/\n/g, "<br>")}</p>`,
    quote: () => `
      <div class="qmark">&ldquo;</div>
      <p class="quote">${c.q.replace(/\n/g, "<br>")}</p>`,
    cta: () => `
      <div class="crest">命</div>
      <h1 class="ctat">${c.title.replace(/\n/g, "<br>")}</h1>
      <ul class="clist">${c.lines.map((l) => `<li>${l}</li>`).join("")}</ul>
      <p class="cfoot">${c.foot}</p>`,
  }[c.kind]();
  return `<section class="card ${c.kind}">
    ${inner}
    <b class="pg">${String(i + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}</b>
  </section>`;
};

const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>
:root{--paper:#faf8f4;--ink:#1a1613;--ink2:#5a5148;--ink3:#8b8177;--line:#e0d9cd;
--gold:#8b6f3e;--gold-bg:#f3ede1;--mok:#2d6a4f;--hwa:#b3261e;--to:#a67c22;--geum:#5f6672;--su:#1e4a72;}
*{margin:0;padding:0;box-sizing:border-box}
body{background:#888;font:400 34px/1.75 "Apple SD Gothic Neo","Noto Sans KR",sans-serif;letter-spacing:-.4px}
.card{width:1080px;height:1350px;background:var(--paper);color:var(--ink);
 padding:110px 96px;display:flex;flex-direction:column;justify-content:center;position:relative;overflow:hidden}
.el-mok{color:var(--mok)}.el-hwa{color:var(--hwa)}.el-to{color:var(--to)}.el-geum{color:var(--geum)}.el-su{color:var(--su)}
.crest{font:400 62px/1 "AppleMyungjo",serif;color:var(--gold);border:1px solid var(--gold);
 width:112px;height:112px;display:flex;align-items:center;justify-content:center;margin-bottom:56px}
.kicker{font-size:27px;color:var(--ink3);letter-spacing:2px;margin-bottom:34px}
h1{font:400 74px/1.42 "AppleMyungjo",serif;letter-spacing:-1px}
.sub{margin-top:44px;font-size:27px;color:var(--ink2);letter-spacing:.5px}
h2{font:400 54px/1.4 "AppleMyungjo",serif;color:var(--gold);margin-bottom:44px}
.para{font-size:37px;line-height:1.92;color:var(--ink2)}
.para b{color:var(--ink);font-weight:600}
.bz{display:grid;grid-template-columns:repeat(3,1fr);gap:34px;margin:20px 0 52px}
.bzcol{display:flex;flex-direction:column;align-items:center;gap:12px;
 background:#fff;border:1px solid var(--line);border-radius:10px;padding:44px 0 28px}
.bzcol span{font:400 104px/1.16 "AppleMyungjo",serif}
.bzcol i{font-style:normal;font-size:24px;color:var(--ink3);letter-spacing:2px;margin-top:10px}
.note{font-size:29px;color:var(--ink3);line-height:1.7}
.note b{color:var(--hwa)}
.bignum{font:400 132px/1.3 "AppleMyungjo",serif;color:var(--ink);margin:24px 0 44px;letter-spacing:-2px}
.big .bignum{color:var(--gold)}
.qmark{font:400 130px/0.8 "AppleMyungjo",serif;color:var(--gold);opacity:.4;margin-bottom:24px}
.quote{font:400 56px/1.66 "AppleMyungjo",serif;color:var(--ink)}
.cta{background:var(--gold-bg)}
.ctat{font-size:66px}
.clist{list-style:none;margin:56px 0 0}
.clist li{font-size:31px;color:var(--ink2);padding:18px 0;border-bottom:1px solid var(--line)}
.clist li::before{content:"·";color:var(--gold);margin-right:16px}
.cfoot{margin-top:52px;font-size:29px;color:var(--gold);letter-spacing:1px}
.pg{position:absolute;right:96px;bottom:76px;font-size:23px;font-weight:400;color:var(--ink3);letter-spacing:2px}
.cover .pg,.cta .pg{display:none}
</style></head><body>
${CARDS.map((c, i) => card(c, i, CARDS.length)).join("\n")}
</body></html>`;

fs.mkdirSync(OUT, { recursive: true });
const page = path.join(OUT, "cards.html");
fs.writeFileSync(page, html);

// 카드별 PNG — 한 장씩 단독 페이지로 렌더한다(크롭 좌표계 의존 제거)
const HEAD = html.slice(0, html.indexOf("</head>") + 7);
CARDS.forEach((c, i) => {
  const one = `${HEAD}<body style="background:var(--paper)">${card(c, i, CARDS.length)}</body></html>`;
  const tmp = path.join(OUT, ".one.html");
  fs.writeFileSync(tmp, one);
  const f = path.join(OUT, `card${String(i + 1).padStart(2, "0")}_${c.kind}.png`);
  execFileSync(CHROME, ["--headless", "--disable-gpu", `--screenshot=${f}`,
    "--window-size=1080,1350", "--hide-scrollbars", "--virtual-time-budget=2500",
    `file://${path.resolve(tmp)}`], { stdio: "ignore" });
  fs.unlinkSync(tmp);
});

console.log(`✅ ${OUT}/  카드 ${CARDS.length}장 (1080×1350)`);
