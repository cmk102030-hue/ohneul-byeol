#!/usr/bin/env node
// ③ pack — 리포트 마크다운 + 명식 JSON → 모바일 세로 HTML → PDF
// 조판 규약 정본 = prompts/layout_rules.md (R1~R7 + 채움률 70%)
// 사용: node bin/pack.mjs <slug> [--no-pdf]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const PAGINATE = fs.readFileSync(new URL("./" + (process.env.PAGINATE || "paginate.js"), import.meta.url), "utf8");
const slug = process.argv[2];
if (!slug) { console.error("사용: pack.mjs <slug> [--no-pdf]"); process.exit(1); }
const dir = path.join("out", slug);
const md = fs.readFileSync(path.join(dir, "report.md"), "utf8");
const m = JSON.parse(fs.readFileSync(path.join(dir, "myeongsik.json"), "utf8"));

// ── 최소 마크다운 렌더러 (리포트 포맷은 우리 통제 하) ────────────────────
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inlineRaw = (s) =>
  esc(s)
    .replace(/==(.+?)==/g, '<mark>$1</mark>')
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[(확정|높음|중간|낮음)\]/g, '<span class="lv lv-$1">$1</span>')
    .replace(/\[근거:\s*([^\]]+)\]/g, '<span class="src">근거 · $1</span>');

// 본문 = 라벨 제거(어미가 확신도를 말한다) / 표 = inlineRaw로 배지 유지
const inline = (s) => inlineRaw(s.replace(/\s*\*{0,2}(?<!`)\[(확정|높음|중간|낮음)\](?!`)\*{0,2}/g, ""));

function render(src) {
  const out = [];
  const lines = src.split("\n");
  let i = 0, list = null;
  const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };
  // R2·R5 — 제목이 페이지 끝에 혼자 남지 않도록 뒤따르는 첫 블록과 묶는다.
  let keepOpen = false;
  const openKeep = () => { if (!keepOpen) { out.push('<div class="keep">'); keepOpen = true; } };
  const closeKeep = () => { if (keepOpen) { out.push("</div>"); keepOpen = false; } };
  while (i < lines.length) {
    const ln = lines[i];
    if (/^\s*$/.test(ln)) { closeList(); i++; continue; }
    if (/^---+\s*$/.test(ln)) {
      closeList();
      // 다음이 장 표제(새 페이지 시작)면 hr을 그리지 않는다 — 빈 페이지가 생긴다
      let j = i + 1;
      while (j < lines.length && /^\s*$/.test(lines[j])) j++;
      if (!(j < lines.length && /^##\s/.test(lines[j]))) out.push("<hr>");
      i++; continue;
    }
    const h = ln.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      closeList();
      const lv = h[1].length;
      if (lv === 1) { i++; continue; }   // 문서 제목 = 표지가 대신한다
      if (lv === 2) {
        const m2 = h[2].match(/^(★|\d{1,2})[.\s]*(.*)$/);
        out.push(`<h2 class="brk chap"><i>${m2 ? m2[1] : ""}</i><span>${inline(m2 ? m2[2] : h[2])}</span></h2>`);
        if (m2 && m2[1] === "1") { out.push(chartBlock); if (warnBlock.trim()) out.push(warnBlock); }  // 1장 = 명식 도판 + 경계 경고
        if (m2 && m2[1] === "3") out.push(daeunBlock);     // 3장 = 대운 도판
      } else {
        closeKeep();
        if (lv === 3) openKeep();          // R2 — 제목 + 첫 문단
        out.push(`<h${lv}>${inline(h[2])}</h${lv}>`);
      }
      i++; continue;
    }
    if (/^>\s?/.test(ln)) {
      closeList();
      const q = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, ""));
      out.push(`<blockquote>${q.map((x) => inline(x)).join("<br>")}</blockquote>`);
      continue;
    }
    if (/^\|/.test(ln)) {
      closeList(); closeKeep();   // R4 우선 — 표는 행 단위로 나뉘어야 하므로 묶지 않는다
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
      const cells = (r) => r.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const head = cells(rows[0]);
      const body = rows.slice(rows[1] && /^[\s|:-]+$/.test(rows[1]) ? 2 : 1);
      out.push(`<table><thead><tr>${head.map((c) => `<th>${inlineRaw(c)}</th>`).join("")}</tr></thead><tbody>`);
      for (const r of body) out.push(`<tr>${cells(r).map((c) => `<td>${inlineRaw(c)}</td>`).join("")}</tr>`);
      out.push("</tbody></table>");
      closeKeep();
      continue;
    }
    const li = ln.match(/^\s*([-*]|\d+\.)\s+(.*)$/);
    if (li) {
      closeKeep();               // R6 우선 — 리스트는 항목 단위로 나뉜다
      const want = /^\d/.test(li[1]) ? "ol" : "ul";
      if (list !== want) { closeList(); out.push(`<${want}>`); list = want; }
      out.push(`<li>${inline(li[2])}</li>`);
      i++;
      if (!(i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i]))) { closeList(); closeKeep(); }
      continue;
    }
    closeList();
    const hi = /\*{0,2}(?<!`)\[(확정|높음)\](?!`)\*{0,2}/.test(ln);   // 확신도 높은 문단 = 시각 강조
    out.push(`<p${hi ? ' class="hi"' : ""}>${inline(ln)}</p>`);
    closeKeep();
    i++;
  }
  closeList();
  closeKeep();
  return out.join("\n");
}

// ── 명식 표지 페이지 ─────────────────────────────────────────────────────
const EL = { 木: "mok", 火: "hwa", 土: "to", 金: "geum", 水: "su" };
const cols = [...m.pillars].reverse();                       // 시 일 월 년
const coverCols = cols.filter((p) => !p.unknown);            // 아예 모르는 기둥만 뺀다(추정은 표시)
const coverLabels = ["시", "일", "월", "년"].filter((_, i) => !cols[i].unknown);
const hasEst = cols.some((p) => p.estimated);
const total = Object.values(m.ohaeng).reduce((a, b) => a + b, 0);
const cur = m.daeun.list.find((d) => d.isCurrent);
const c = m.correction;
const b = m.bazi;
const tight = c.hourBoundaryMin !== null && c.hourBoundaryMin <= 20;

const chartRow = (label, pick) =>
  `<tr><th>${label}</th>${cols.map((p) => `<td${p.estimated ? ' class="est-col"' : ""}>${pick(p) || "—"}</td>`).join("")}</tr>`;

const coverPage = `
<section class="cover">
  <div class="crest">命</div>
  <h1 class="ctitle">사주 명식 정밀 분석</h1>
  <p class="csub"><b>${slug}</b> 님 · ${b.lunar.year}년생 ${b.zodiacAnimal}띠 · ${m.gender === "M" ? "남명" : "여명"}</p>
  <p class="cissue">발급 ${new Date().toISOString().slice(0,10)}</p>
  <div class="cbazi" style="--n:${coverCols.length}">
    <div class="crow">${coverCols.map((p) => `<span class="el-${EL[p.ganElement] ?? "x"}">${p.gan}</span>`).join("")}</div>
    <div class="crow">${coverCols.map((p) => `<span class="el-${EL[p.zhiElement] ?? "x"}">${p.zhi}</span>`).join("")}</div>
    <div class="clabel">${coverLabels.map((l) => `<span>${l}</span>`).join("")}</div>
  </div>
  <p class="cmeta">${b.timeUnknown && !hasEst ? "출생 시각 미상" : ""}</p>
</section>`;

// 명식 도판 — 1장 본문 안으로 삽입된다(별도 페이지를 쓰지 않는다)
const chartBlock = `
<div class="chart-block">
  <table class="chart">
    <tr><th></th>${cols.map((p, i) => `<th${p.estimated ? ' class="est-col"' : ""}>${["시주","일주","월주","년주"][i]}</th>`).join("")}</tr>
    ${chartRow("십성", (p) => p.ganSipseong)}
    <tr><th></th>${cols.map((p) => `<td class="big el-${EL[p.ganElement] ?? "x"}${p.estimated ? " est-col" : ""}">${p.gan || "—"}<em>${p.ganKo}</em></td>`).join("")}</tr>
    <tr><th></th>${cols.map((p) => `<td class="big el-${EL[p.zhiElement] ?? "x"}${p.estimated ? " est-col" : ""}">${p.zhi || "—"}<em>${p.zhiKo}</em></td>`).join("")}</tr>
    ${chartRow("십성", (p) => p.zhiSipseong)}
    ${chartRow("지장간", (p) => p.hideGan.join(""))}
    ${chartRow("12운성", (p) => p.diShi)}
    ${chartRow("납음", (p) => p.naYin)}
  </table>

  <h3>오행 분포 <small>${m.hourEstimated ? "확정 여섯 글자 기준" : ""}</small></h3>
  <div class="ohaeng">
    ${Object.entries(m.ohaeng).map(([k, v]) => `
      <div class="oh">
        <span class="ol el-${EL[k]}">${k}</span>
        <div class="bar"><i class="el-bg-${EL[k]}" style="height:${(v / Math.max(...Object.values(m.ohaeng), 1)) * 100}%"></i></div>
        <span class="on${v === 0 ? " zero" : ""}">${v}</span>
      </div>`).join("")}
  </div>


  <h3>합·충·형·파·해 <small>글자끼리 부딪치거나 손잡는 관계</small></h3>
  <p class="rel">${m.relations.length ? m.relations.map((r) => `<span><b>${r.kind}</b> ${r.chars}</span>`).join("") : "없음"}</p>

</div>`;

// 경계 경고 — 도판과 분리해야 도판이 장 첫 페이지에 들어간다
const warnBlock = `${(tight || m.jeolip.boundary) ? `<div class="warn">
    ${tight ? `<p><b>시주 경계에 있습니다.</b> 보정 후 시각이 시진 경계에서 ${c.hourBoundaryMin}분 거리입니다. 본 분석은 진태양시 보정을 적용하고 시진 경계는 정시법을 씁니다 — 보정을 쓰지 않거나 30분법을 쓰는 만세력과는 시주가 다를 수 있습니다.</p>` : ""}
    ${m.jeolip.boundary ? `<p><b>절입 경계에 있습니다.</b> 출생 시각이 조금만 달라도 월주가 바뀌므로 월지에 기대는 해석(월령·격국·용신)은 그만큼 여지를 두고 보십시오.</p>` : ""}
  </div>` : ""}
`;


// 대운 도판 — 3장(평생 총운) 본문 안으로 삽입된다
const daeunBlock = `
<div class="chart-block">
  <h3>대운 <small>${m.daeun.forward ? "순행" : "역행"} · 대운수 ${m.daeun.startAge}</small></h3>
  <div class="daeun">
    ${m.daeun.list.slice(0, 8).map((d) => `<div class="du${d.isCurrent ? " now" : ""}"><i>${d.startAge}</i><b>${d.ganzhi}</b><em>${d.sipseong}</em><i>${d.startYear}</i></div>`).join("")}
  </div>
  ${cur ? `<p class="note">현재 <b>${cur.startAge}세 ${cur.ganzhiKo}(${cur.sipseong})</b> 대운 · ${cur.startYear}~${cur.endYear}</p>` : ""}
</div>`;

// ── 목차 — 본문 h2에서 추출 ──────────────────────────────────────────────
const toc = md.split("\n").filter((l) => /^##\s/.test(l)).map((l) => l.replace(/^##\s+/, ""))
  .map((t) => { const m2 = t.match(/^(★|\d{1,2})[.\s]*(.*)$/); return { num: m2 ? m2[1] : "", title: m2 ? m2[2] : t }; });
const tocPage = toc.length < 4 ? "" : `
<section class="toc"><h2 class="tt">차례</h2>
<ol>${toc.map((t) => `<li><i>${t.num}</i><span>${t.title}</span></li>`).join("")}</ol>
</section>
`;


const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>사주 명식 정밀 분석 — ${slug}</title>
<style>
@page { size: 148mm 210mm; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --paper:#faf8f4; --ink:#1a1613; --ink2:#5a5148; --ink3:#8b8177;
  --line:#e0d9cd; --gold:#8b6f3e; --gold-bg:#f3ede1;
  --mok:#2d6a4f; --hwa:#b3261e; --to:#a67c22; --geum:#5f6672; --su:#1e4a72;
}
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { width:559px; overflow-x:hidden; background:var(--paper); color:var(--ink); font:15.5px/1.92 "Apple SD Gothic Neo","Noto Sans KR",sans-serif; letter-spacing:-.1px; }
section, .body { padding: 56px 58px 62px; }
.el-mok,.el-mok em{color:var(--mok)} .el-hwa,.el-hwa em{color:var(--hwa)} .el-to,.el-to em{color:var(--to)}
.el-geum,.el-geum em{color:var(--geum)} .el-su,.el-su em{color:var(--su)} .el-x{color:var(--ink3)}
.el-bg-mok{background:var(--mok)} .el-bg-hwa{background:var(--hwa)} .el-bg-to{background:var(--to)}
.el-bg-geum{background:var(--geum)} .el-bg-su{background:var(--su)}

/* 표지 */
.cover .cissue { position:absolute; bottom:44px; left:0; right:0; font-size:10.5px; letter-spacing:1.5px; color:var(--ink3,#9b917f); }
.cover { position:relative; height:792px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding-bottom:70px; text-align:center; }
.crest { font:400 52px/1 "AppleMyungjo",serif; color:var(--gold); border:1px solid var(--gold); width:94px; height:94px; display:flex; align-items:center; justify-content:center; margin-bottom:44px; }
.ctitle { font:400 31px/1.4 "AppleMyungjo",serif; letter-spacing:-.3px; }
.csub { margin-top:12px; color:var(--ink2); font-size:14px; letter-spacing:.2px; }
.cbazi { margin:36px 0 0; }
.crow { display:grid; grid-template-columns:repeat(var(--n,4),58px); gap:14px; font:400 40px/1.35 "AppleMyungjo",serif; }
.crow span { text-align:center; }

.clabel { display:grid; grid-template-columns:repeat(var(--n,4),58px); gap:14px; margin-top:14px; font-size:11px; color:var(--ink3); letter-spacing:1px; }
.clabel span { text-align:center; }
.clabel span.est { color:var(--gold); }
.clabel span.est i { display:block; font-size:8.5px; font-style:normal; letter-spacing:0; margin-top:3px; opacity:.85; }
.cmeta { margin-top:44px; font-size:12px; color:var(--ink3); letter-spacing:1.5px; }

/* 명식 페이지 */
.chart-block { margin:0 0 4px; }
table.chart { width:100%; table-layout:fixed; border-collapse:collapse; margin:2px 0 10px; }
table.chart th, table.chart td { border-bottom:1px solid var(--line); padding:4px 2px; text-align:center; font-size:12px; letter-spacing:-.2px; color:var(--ink2); word-break:keep-all; }
table.chart th:first-child { width:56px; color:var(--ink3); font-weight:400; font-size:11px; text-align:left; }
table.chart tr:first-child th { color:var(--ink); font-size:13px; font-weight:600; border-bottom:1px solid var(--ink); }
td.big { font:400 32px/1.1 "AppleMyungjo",serif; padding:9px 0 6px; }
.est-col { background:#f2ede3; }
table.chart th.est-col em { display:block; font:400 8px/1 "Apple SD Gothic Neo",sans-serif; color:var(--gold); margin-top:2px; letter-spacing:0; font-style:normal; }
td.big.est-col { opacity:.55; }
td.big em { display:block; font:400 11px/1 "Apple SD Gothic Neo",sans-serif; margin-top:5px; opacity:.55; }
h3 { font:600 12.5px/1 "Apple SD Gothic Neo",sans-serif; color:var(--gold); letter-spacing:1.5px; margin:13px 0 8px; }
h3 small { font-weight:400; color:var(--ink3); letter-spacing:0; margin-left:5px; }
.ohaeng { display:grid; grid-template-columns:repeat(5,1fr); gap:5px; }
.oh { text-align:center; min-width:0; }
.ol { font:400 19px/1 "AppleMyungjo",serif; }
.bar { height:40px; margin:7px 0 5px; background:#ece6da; display:flex; align-items:flex-end; }
.bar i { display:block; width:100%; }
.on { font-size:13px; font-weight:600; } .on.zero { color:var(--ink3); font-weight:400; }
.rel span { display:inline-block; background:var(--gold-bg); border:1px solid var(--line); padding:4px 11px; margin:0 6px 6px 0; font-size:12px; border-radius:12px; }
.rel b { color:var(--gold); }
.estnote { margin-top:7px; font-size:11px; line-height:1.6; color:var(--ink3); }
.estnote b { color:var(--ink2); }
h3 small { font-weight:400; font-size:10.5px; color:var(--ink3); letter-spacing:0; margin-left:6px; }
.daeun { display:grid; grid-template-columns:repeat(4,1fr); gap:7px; }
.du { border:1px solid var(--line); padding:7px 2px; text-align:center; min-width:0; }
.du.now { border-color:var(--gold); background:var(--gold-bg); }
.du i { display:block; font-size:10px; color:var(--ink3); font-style:normal; }
.du b { display:block; font:400 20px/1.35 "AppleMyungjo",serif; }
.du em { display:block; font-size:10px; font-style:normal; color:var(--ink2); }
.note { margin-top:12px; font-size:12.5px; color:var(--ink2); }
dl.basis { font-size:12px; line-height:1.7; }
dl.basis dt { color:var(--ink3); margin-top:9px; }
dl.basis dd { color:var(--ink2); }
.warn { margin-top:20px; border-left:3px solid var(--gold); background:var(--gold-bg); padding:16px 18px; font-size:12.5px; line-height:1.8; }
.warn p + p { margin-top:6px; }

/* 본문 */
.body h1 { font:400 20px/1.4 "AppleMyungjo",serif; margin:0 0 14px; padding-bottom:9px; border-bottom:1px solid var(--ink); }
.body h2.chap { margin:0 0 6px; padding:0 0 12px; border-bottom:1px solid var(--ink); display:flex; align-items:baseline; gap:16px; }
.body h2.chap i { font:400 42px/1 "AppleMyungjo",serif; color:var(--gold); font-style:normal; min-width:50px; }
.body h2.chap span { font:400 24px/1.35 "AppleMyungjo",serif; color:var(--ink); }
.body h3 { font:600 15px/1.5 "Apple SD Gothic Neo",sans-serif; color:var(--ink); letter-spacing:-.2px; margin:21px 0 9px; padding-top:2px; }
.brk { page-break-before:always; }
.body > .page:first-child > h2.chap { page-break-before:auto; break-before:auto; }

/* 측정 기반 페이지네이션 — paginate.js가 .page 단위로 재조립한다 */
.body[data-paginated] { padding:0; }
.page { padding:38px 52px 40px; }   /* 측정 단계부터 같은 폭이어야 조판이 맞는다 */
.body[data-paginated] .page { height:794px; page-break-after:always; break-after:page; overflow:hidden; }
.body[data-paginated] .page { position:relative; }
.body[data-paginated] .page > :first-child { margin-top:0; }
.pgnum { position:absolute; bottom:24px; left:0; right:0; text-align:center; font-style:normal; font-size:9.5px; letter-spacing:1.2px; color:#b8ad99; }
.toc ol li { position:relative; }
.tpg { position:absolute; right:0; font-weight:400; font-size:12.5px; color:#9b917f; }
.body[data-paginated] .page:last-child { page-break-after:auto; }
.body[data-paginated] .page > h2.chap { page-break-before:auto; break-before:auto; }

/* 페이지 나눔 제어 (1차 렌더용 폴백) */
.body h3 { page-break-after:avoid; break-after:avoid; }
.keep { break-inside:avoid; page-break-inside:avoid; }
.body p.hi { border-left:2px solid var(--gold); padding-left:15px; margin-left:-17px; }
/* 여백 되돌림 — 장의 마지막 페이지가 얇으면 그 장만 촘촘하게 재배치한다(규약 §5) */
.tight { line-height:1.82; }
.tight.body p, .body .tight { margin-bottom:11px; }
p.tight { margin-bottom:11px; line-height:1.82; }
h3.tight { margin:28px 0 11px; }
table.tight { margin:12px 0 16px; }
ul.tight, ol.tight { margin-bottom:13px; }
.body li, .warn, blockquote, dl.basis { page-break-inside:avoid; break-inside:avoid; }
.body ul, .body ol { break-inside:auto; }   /* R6 — 목록은 항목 단위로 나뉜다 */
.body table { break-inside:auto; }
.body tr { break-inside:avoid; page-break-inside:avoid; }
.body thead { display:table-header-group; }   /* 표가 넘어가면 머리행 반복 */
.body p { orphans:3; widows:3; }

/* 목차 */
.toc { page-break-after:always; padding:52px 58px 56px; }
.guide-page { page-break-before:always; }
.guide-page .rt { margin-top:0; }
.toc .tt { font:400 25px/1.4 "AppleMyungjo",serif; margin-bottom:22px; padding-bottom:12px; border-bottom:1px solid var(--ink); }
.toc ol { list-style:none; margin:0; padding:0; }
.toc li { display:flex; align-items:baseline; gap:18px; padding:7px 0; border-bottom:1px solid var(--line); font-size:13.5px; }
.toc .rt { font:600 12.5px/1 "Apple SD Gothic Neo",sans-serif; color:var(--gold); letter-spacing:1.5px; margin:34px 0 14px; }
dl.guide { font-size:12.5px; line-height:1.85; }
dl.guide dt { font-weight:600; color:var(--ink); margin-top:14px; }
dl.guide dd { color:var(--ink2); }
.toc li i { font:400 18px/1 "AppleMyungjo",serif; color:var(--gold); font-style:normal; min-width:34px; }
.body p { margin:0 0 11px; text-align:left; word-break:keep-all; hanging-punctuation:allow-end; }
.body ul, .body ol { margin:0 0 18px 22px; } .body li { margin-bottom:9px; padding-left:4px; }
.body ul li::marker { color:var(--gold); }
.body ol li::marker { color:var(--gold); font-weight:600; }
.body table { width:100%; table-layout:fixed; border-collapse:collapse; margin:14px 0 20px; font-size:12.5px; line-height:1.7; word-break:keep-all; }
.body th, .body td { padding:8px 12px; text-align:left; vertical-align:top; border:0; border-bottom:1px solid var(--line); }
.body th { background:none; font-weight:600; font-size:11px; letter-spacing:.6px; color:var(--ink3); border-bottom:1px solid var(--ink2); padding-bottom:6px; }
.body tbody tr:last-child td { border-bottom:1px solid var(--ink2); }
.body td:first-child { color:var(--ink); font-weight:600; }
.body td b, .body th b { font-weight:600; }
.body tbody tr:nth-child(even) td { background:#faf7f1; }
.body b { font-weight:700; color:#14100c; }
.body hr { border:0; border-top:1px solid var(--line); margin:30px 0; }
blockquote { margin:14px 0 18px; padding:11px 15px; background:var(--gold-bg); border-left:2px solid var(--gold); font:400 14.5px/1.75 "Apple SD Gothic Neo",sans-serif; color:var(--ink2); letter-spacing:-.2px; }
mark { background:linear-gradient(transparent 58%, #f0e2bd 58%); color:inherit; padding:0 1px; }
mark b { font-weight:700; }
code { font-family:ui-monospace,Menlo,monospace; font-size:12.5px; background:#f0ebe1; padding:2px 6px; }
.lv { font-size:10.5px; padding:2px 8px; border-radius:10px; margin-left:5px; vertical-align:1px; white-space:nowrap; }
.lv-확정{background:#1a1613;color:#faf8f4} .lv-높음{background:var(--gold);color:#fff}
.lv-중간{background:#d9cfbb;color:#4a4238} .lv-낮음{background:#efe9dd;color:#8b8177}
.src { display:block; font-size:11.5px; color:var(--ink3); margin-top:5px; }
.foot { page-break-before:always; padding:90px 58px; font-size:12.5px; line-height:2; color:var(--ink2); }
.foot h2 { font:400 20px/1.4 "AppleMyungjo",serif; color:var(--ink); margin-bottom:20px; }
</style></head><body>
${coverPage}
${tocPage}
<div class="body">
${render(md)}
</div>
<script>${PAGINATE}</script>
</body></html>`;

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const abs = path.resolve(dir);
const draft = path.join(dir, ".report.draft.html");
fs.writeFileSync(draft, html);

// 1단 — 브라우저에서 실측 후 페이지 단위로 재조립한 DOM을 회수한다
let paged = execFileSync(CHROME, [
  "--headless", "--disable-gpu", "--dump-dom", "--virtual-time-budget=4000",
  `file://${path.resolve(draft)}`,
], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });
paged = paged.replace(/<script[\s\S]*?<\/script>/g, "");   // 스크립트 제거
const pgm = paged.match(/data-paginated="(\d+)"/);
if (!process.env.KEEP_DRAFT) fs.unlinkSync(draft);
fs.writeFileSync(path.join(dir, "report.html"), paged);
console.log(`✅ ${dir}/report.html` + (pgm ? `  (페이지 ${pgm[1]}개로 조판)` : "  ⚠️ 페이지네이션 미적용"));

// 2단 — 조판된 HTML을 PDF로
if (!process.argv.includes("--no-pdf")) {
  execFileSync(CHROME, [
    "--headless", "--disable-gpu", "--no-pdf-header-footer",
    `--print-to-pdf=${path.join(abs, "report.pdf")}`,
    `file://${path.join(abs, "report.html")}`,
  ], { stdio: "ignore" });
  const kb = (fs.statSync(path.join(dir, "report.pdf")).size / 1024).toFixed(0);
  console.log(`✅ ${dir}/report.pdf  (${kb}KB)`);
}
