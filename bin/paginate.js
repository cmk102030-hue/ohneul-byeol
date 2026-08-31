/* 조판 v2 — 페널티 기반. 규칙은 하나: "끊어도 되는 자리의 값"을 매기고,
   페이지가 넘치면 이 쪽 안의 후보 중 비용(페널티 + 버리는 줄 수)이 가장 낮은 자리에서 끊는다.

   페널티 표
     절 경계(다음이 절 머리/장)     0
     문단 경계                      10
     표 뒤                           5
     절 머리(keep) 직후             40
     문단 중간(양쪽 3줄 보장)       50
     표 행 사이(양쪽 2행 보장)      60
     장 제목·장 리드·h3 직후        금지
     표 앞 리드 직후                금지
   장(H2)은 항상 새 쪽에서 시작한다. */
(() => {
  const PAGE_H = 716;
  const body = document.querySelector(".body");
  if (!body) return;

  const mb = (el) => {
    const s = getComputedStyle(el);
    return (parseFloat(s.marginTop) || 0) + (parseFloat(s.marginBottom) || 0);
  };
  const lineHOf = (el) => parseFloat(getComputedStyle(el).lineHeight) || 29;

  body.style.padding = "0";           // 조판 중에도 최종과 같은 폭 — .page 패딩과 이중이 되면 안 된다
  const blocks = [...body.children];
  const pages = [];
  let cur = null;
  const newPage = () => {
    cur = document.createElement("div");
    cur.className = "page";
    body.appendChild(cur);
    pages.push(cur);
  };
  const usedOf = () => {
    let last = cur.lastElementChild;
    if (!last) return 0;
    const padTop = parseFloat(getComputedStyle(cur).paddingTop) || 0;
    const top = cur.getBoundingClientRect().top + padTop;
    return Math.round(last.getBoundingClientRect().bottom - top);
  };

  const isChapter = (el) => el.tagName === "H2";
  const isLead = (el) => el.tagName === "BLOCKQUOTE";
  const isHead = (el) => el.tagName === "H3" ||
    (el.tagName === "DIV" && el.classList.contains("keep") && el.querySelector("h3"));

  // keep이 제목만 담고 있으면(문단 없이) 사실상 h3 — 직후에서 끊으면 고아가 된다
  const isBareHead = (el) =>
    el.tagName === "H3" || el.tagName === "H4" ||
    (el.tagName === "DIV" && el.classList.contains("keep") &&
     el.children.length === 1 && el.firstElementChild.tagName === "H3");
  const isAnyHead = (el) => isHead(el) || el.tagName === "H4";

  // 절은 시작하는 쪽에 최소 200px(머리+본문 5줄가량)을 데려간다.
  // j까지 놓았을 때 마지막 머리부터의 누적이 그에 못 미치면 그 자리는 끊을 수 없다.
  const SECTION_MIN = 200;
  const sectionTooShort = (arr, j) => {
    for (let k = j; k >= 0 && k >= j - 6; k--) {
      if (isAnyHead(arr[k].el)) {
        const base = k > 0 ? arr[k - 1].cum : 0;
        return arr[j].cum - base < SECTION_MIN;
      }
    }
    return false;
  };

  // el 뒤에서 끊는 페널티 (nx = 다음 블록)
  const breakPenalty = (el, nx) => {
    if (isChapter(el) || isLead(el) || isBareHead(el)) return Infinity;
    let pen;
    if (!nx || isChapter(nx) || isHead(nx)) pen = 0;        // 절·장 경계
    // 짧은 도입문 직후 — 절이 이어지는 중이면 뒤 내용과 붙어야 한다
    else if (el.tagName === "P" && (el.textContent || "").trim().length < 42) return Infinity;
    else if (nx.tagName === "TABLE") {
      if (el.tagName === "TABLE") pen = 5;                  // 표 연속 사이는 끊어도 된다
      else return Infinity;                                 // 표 앞 리드를 홀로 두지 않는다
    }
    else if (el.tagName === "TABLE") pen = 5;
    else if (isHead(el)) pen = 40;                          // 절 머리+첫 문단 직후
    else pen = 10;                                          // 문단 경계
    // 다음 블록이 두 줄짜리 문단이면 그게 다음 쪽 머리에 위도우로 남는다
    if (nx && nx.tagName === "P" && nx.offsetHeight < 76) pen += 60;
    return pen;
  };

  // ── 문단 분할: avail 안에 head(≥3줄), 나머지 tail(≥3줄). 실패 시 원상복구 후 null.
  function splitPara(el, avail) {
    if (el.tagName !== "P") return null;
    const lh = lineHOf(el);
    if (avail < lh * 3.2 || el.offsetHeight < lh * 5.4) return null;

    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = []; let n;
    while ((n = walker.nextNode())) nodes.push(n);
    if (!nodes.length) return null;
    const total = nodes.reduce((a, x) => a + x.data.length, 0);
    if (total < 80) return null;

    const at = (k) => {
      let acc = 0;
      for (const t of nodes) {
        if (acc + t.data.length >= k) return [t, k - acc];
        acc += t.data.length;
      }
      const last = nodes[nodes.length - 1];
      return [last, last.data.length];
    };

    const probe = document.createElement("p");
    probe.className = el.className;
    probe.style.visibility = "hidden";
    el.parentNode.insertBefore(probe, el);
    const rng = document.createRange();
    let lo = 40, hi = total, best = 0;
    for (let i = 0; i < 12 && lo <= hi; i++) {
      const mid = (lo + hi) >> 1;
      const [tn, off] = at(mid);
      rng.setStart(nodes[0], 0); rng.setEnd(tn, off);
      probe.innerHTML = "";
      probe.appendChild(rng.cloneContents());
      if (probe.offsetHeight <= avail) { best = mid; lo = mid + 1; } else hi = mid - 1;
    }
    const headH = (() => {                                  // head 실제 높이
      const [tn, off] = at(best);
      rng.setStart(nodes[0], 0); rng.setEnd(tn, off);
      probe.innerHTML = ""; probe.appendChild(rng.cloneContents());
      return probe.offsetHeight;
    })();
    probe.remove();
    if (!best || best >= total - 30) return null;
    if (headH < lh * 2.6) return null;                      // head 3줄 미만

    let cut = best;                                          // 단어 경계로
    for (let z = 0; z < 40; z++) {
      const [t, o] = at(cut);
      if (o <= 0 || /[\s·,.]/.test(t.data[o - 1] || " ")) break;
      cut--;
    }
    if (cut < 40) return null;

    const [tn, off] = at(cut);
    const tr = document.createRange();
    tr.setStart(tn, off);
    tr.setEndAfter(nodes[nodes.length - 1]);
    const tail = document.createElement("p");
    tail.className = el.className;
    tail.appendChild(tr.extractContents());
    cur.appendChild(tail);                                   // tail 높이 실측
    const tailH = tail.offsetHeight;
    cur.removeChild(tail);
    if (tailH < lh * 2.6) {                                  // tail 3줄 미만 → 복구
      while (tail.firstChild) el.appendChild(tail.firstChild);
      return null;
    }
    return [el, tail];
  }

  // ── 표 분할: 머리행 반복, 양쪽 본문 2행 이상
  function splitTable(tbl, avail) {
    const tb = tbl.tBodies[0];
    if (!tb || tb.rows.length < 4) return null;
    const rows = [...tb.rows];
    const headH = tbl.tHead ? tbl.tHead.offsetHeight : 0;
    const rowH = Math.max(1, (tbl.offsetHeight - headH) / rows.length);
    const fit = Math.floor((avail - headH) / rowH);
    if (fit < 2 || rows.length - fit < 2) return null;
    const head = tbl.tHead ? tbl.tHead.outerHTML : "";
    const mk = (rs) => {
      const t = document.createElement("table");
      t.innerHTML = head + "<tbody>" + rs.map((r) => r.outerHTML).join("") + "</tbody>";
      return t;
    };
    return [mk(rows.slice(0, fit)), mk(rows.slice(fit))];
  }

  // ── 본 루프
  const pending = blocks.slice();
  for (const b of pending) body.removeChild(b);
  newPage();
  let placed = [];                                           // {el, cum}

  while (pending.length) {
    const el = pending.shift();

    if (isChapter(el) && placed.length) { newPage(); placed = []; }

    cur.appendChild(el);
    const h = usedOf();
    if (h <= PAGE_H) { placed.push({ el, cum: h }); continue; }

    // ── 넘쳤다. 후보 비용 비교 (비용 = 페널티 + 버리는 줄 수 × 4)
    const room = PAGE_H - (placed.length ? placed[placed.length - 1].cum : 0);
    const options = [];

    for (let j = placed.length - 1; j >= 0; j--) {
      const nx = j + 1 < placed.length ? placed[j + 1].el : el;
      const pen = breakPenalty(placed[j].el, nx);
      if (pen === Infinity) continue;
      if (sectionTooShort(placed, j)) continue;             // 절 머리만 조금 남는 자리
      const waste = (PAGE_H - placed[j].cum) / 29;
      options.push({ kind: "back", j, cost: pen + waste * 8 });
    }
    const secShort = placed.length && sectionTooShort(placed, placed.length - 1);
    if (!secShort && el.tagName === "P") options.push({ kind: "splitP", cost: 50 });
    if (!secShort && el.tagName === "TABLE") options.push({ kind: "splitT", cost: 60 });

    options.sort((a, b2) => a.cost - b2.cost);
    let done = false;

    for (const op of options) {
      if (op.kind === "splitP") {
        const parts = splitPara(el, room - mb(el));
        if (!parts) continue;
        placed.push({ el, cum: usedOf() });
        newPage(); placed = [];
        pending.unshift(parts[1]);
        done = true; break;
      }
      if (op.kind === "splitT") {
        const parts = splitTable(el, room - mb(el));
        if (!parts) continue;
        cur.replaceChild(parts[0], el);
        placed.push({ el: parts[0], cum: usedOf() });
        newPage(); placed = [];
        pending.unshift(parts[1]);
        done = true; break;
      }
      // back: op.j 뒤에서 끊는다
      cur.removeChild(el);
      const moved = placed.splice(op.j + 1).map((x) => x.el);
      for (const m of moved) cur.removeChild(m);
      pending.unshift(el);
      for (let k = moved.length - 1; k >= 0; k--) pending.unshift(moved[k]);
      newPage(); placed = [];
      done = true; break;
    }

    if (!done) {                                             // 후보 전멸 — 강제 배치
      if (placed.length) {
        // 페이지 끝의 "끊으면 안 되는 사슬"(제목·리드·표 앞 리드)을 el과 함께 통째로 넘긴다
        cur.removeChild(el);
        let j = placed.length - 1;
        while (j >= 0) {
          const nx = j + 1 < placed.length ? placed[j + 1].el : el;
          if (breakPenalty(placed[j].el, nx) !== Infinity) break;
          j--;
        }
        const moved = placed.splice(j + 1).map((x) => x.el);
        for (const m of moved) cur.removeChild(m);
        pending.unshift(el);
        for (let k = moved.length - 1; k >= 0; k--) pending.unshift(moved[k]);
        newPage(); placed = [];
      } else {
        placed.push({ el, cum: usedOf() });                  // 한 쪽보다 큰 원자 블록
      }
    }
  }

  for (const pg of pages.slice()) {
    if (!pg.children.length) { pg.remove(); pages.splice(pages.indexOf(pg), 1); }
  }

  // ── 쪽번호 + 차례 쪽수 (PDF 물리 쪽수 기준)
  const FRONT = document.querySelectorAll("section.cover, section.toc").length;
  const chapPage = {};
  pages.forEach((pg, i) => {
    const num = document.createElement("i");
    num.className = "pgnum";
    num.textContent = i + 1 + FRONT;
    pg.appendChild(num);
    const h = pg.querySelector("h2.chap > i");
    if (h) { const k = h.textContent.trim(); if (!(k in chapPage)) chapPage[k] = i + 1 + FRONT; }
  });
  document.querySelectorAll(".toc ol li").forEach((li) => {
    const k = li.querySelector("i")?.textContent?.trim();
    if (k in chapPage) {
      const b = document.createElement("b");
      b.className = "tpg";
      b.textContent = chapPage[k];
      li.appendChild(b);
    }
  });

  body.setAttribute("data-paginated", String(pages.length));
})();
