// 측정 기반 페이지네이션 — 브라우저에 맡기지 않고 페이지를 직접 구성한다.
// 규약 정본 = prompts/layout_rules.md (R1~R7)
// 실행: pack.mjs가 1차 HTML에 삽입 → Chrome --dump-dom 으로 결과 DOM 회수
//
// ⚠️ 모든 측정은 DOM에 붙인 상태에서 한다. 페이지나 블록이 문서에 없으면
//    offsetHeight가 0이라 계산이 통째로 무효가 된다.
(function () {
  const PAGE_H = 716;              // 활자면 높이 = 794 - 38(상) - 40(하)
  const TIGHT_TRY = 0.30;          // 장 마지막 페이지가 이보다 얇으면 압축 재배치
  const body = document.querySelector(".body");
  if (!body) return;

  const blocks = Array.from(body.children);
  for (const b of blocks) b.remove();
  body.innerHTML = "";

  const pages = [];
  let cur = null, used = 0;
  const newPage = () => {
    cur = document.createElement("div"); cur.className = "page";
    body.appendChild(cur); pages.push(cur); used = 0;
  };
  const mb = (el) => parseFloat(getComputedStyle(el).marginBottom) || 0;

  // ── 표 분할 (R4) — 반드시 DOM에 붙은 상태로 호출한다
  function splitTable(tbl, avail) {
    const tb = tbl.tBodies[0];
    if (!tb || tb.rows.length < 2) return null;
    const rows = Array.from(tb.rows);
    const headH = tbl.tHead ? tbl.tHead.offsetHeight : 0;
    const rowH = Math.max(1, (tbl.offsetHeight - headH) / rows.length);
    const fit = Math.floor((avail - headH) / rowH);
    if (fit < 1 || fit >= rows.length) return null;
    const head = tbl.tHead ? tbl.tHead.outerHTML : "";
    const mk = (rs) => {
      const t = document.createElement("table");
      t.innerHTML = head + "<tbody>" + rs.map((r) => r.outerHTML).join("") + "</tbody>";
      return t;
    };
    return [mk(rows.slice(0, fit)), mk(rows.slice(fit))];
  }

  // ── 블록 하나 배치
  function place(el) {
    // R1 — 장은 항상 새 페이지에서
    if (el.tagName === "H2") {
      if (used > 0) newPage();
      cur.appendChild(el); used += el.offsetHeight + mb(el); return;
    }

    if (el.tagName === "TABLE") {
      const leadCand = cur.lastElementChild;
      let rest = el;
      for (let guard = 0; guard < 60; guard++) {
        const room = PAGE_H - used;
        if (room < 90) { newPage(); continue; }
        cur.appendChild(rest);
        const th = rest.offsetHeight + mb(rest);
        if (th <= room) { used += th; return; }
        const parts = splitTable(rest, room);
        cur.removeChild(rest);
        if (!parts) {
          if (used > 0) {
            // R5 — 표 앞 도입부(문단·절 제목)가 홀로 남지 않게 함께 옮긴다
            const carry = [];
            for (let k = 0; k < 2; k++) {
              const t = cur.lastElementChild;
              if (!t) break;
              const isKeep = t.classList && t.classList.contains("keep");
              if (t.tagName === "P" && t.offsetHeight < 220 && carry.length === 0) { carry.unshift(t); cur.removeChild(t); }
              else if ((t.tagName === "H3" || isKeep) && t.offsetHeight < 330) { carry.unshift(t); cur.removeChild(t); break; }
              else break;
            }
            newPage();
            for (const t of carry) { cur.appendChild(t); used += t.offsetHeight + mb(t); }
          }
          cur.appendChild(rest); used += rest.offsetHeight + mb(rest); return;
        }
        cur.appendChild(parts[0]);
        newPage();
        rest = parts[1];
      }
      return;
    }

    cur.appendChild(el);
    const h = el.offsetHeight + mb(el);
    if (used + h <= PAGE_H) { used += h; return; }
    cur.removeChild(el);

    // R2 — 직전이 절 제목이고 그것만 남으면 제목도 함께 넘긴다
    const prev = cur.lastElementChild;
    if (prev && prev.tagName === "H3") {
      cur.removeChild(prev);
      newPage();
      cur.appendChild(prev); used = prev.offsetHeight + mb(prev);
    } else newPage();

    cur.appendChild(el);
    used += el.offsetHeight + mb(el);
  }

  // ── 장 단위로 나눠 배치. 마지막 페이지가 얇으면 그 장만 압축해 다시 넣는다.
  const chapters = [];
  let group = [];
  for (const b of blocks) {
    if (b.tagName === "H2" && group.length) { chapters.push(group); group = []; }
    group.push(b);
  }
  if (group.length) chapters.push(group);

  const fillOf = (pg) => {
    let h = 0;
    for (const c of pg.children) h += c.offsetHeight + mb(c);
    return h / PAGE_H;
  };

  newPage();
  for (const chap of chapters) {
    const mark = pages.length - 1;          // 이 장이 시작되기 직전 페이지 인덱스
    const layout = () => { for (const b of chap) place(b); };
    layout();
    const usedPages = pages.length - mark;

    if (usedPages >= 2 && fillOf(pages[pages.length - 1]) < TIGHT_TRY) {
      // 되돌리고, 이 장만 촘촘하게 다시 배치한다
      const rollback = pages.splice(mark + 1);
      for (const pg of rollback) pg.remove();
      for (const b of chap) b.remove();
      cur = pages[mark]; used = fillOf(cur) * PAGE_H;
      for (const b of chap) b.classList.add("tight");
      const before = usedPages;
      const mark2 = pages.length - 1;
      layout();
      if (pages.length - mark2 >= before) {
        // 줄지 않았으면 압축을 되돌린다 — 클래스만 떼면 배치가 어긋나므로 재배치까지 한다
        const rb2 = pages.splice(mark + 1);
        for (const pg of rb2) pg.remove();
        for (const b of chap) { b.remove(); b.classList.remove("tight"); }
        cur = pages[mark]; used = fillOf(cur) * PAGE_H;
        layout();
      }
    }
  }

  // R9 — 장 마지막 자투리 쪽: 앞 쪽에 자리가 있으면 끌어올린다(빈 쪽 방지)
  // 마진 겹침(collapse) 때문에 단순 합산은 과대평가된다 — 실제 렌더 높이로 잰다
  const fill = (pg) => {
    const kids = [...pg.children].filter((c) => !(c.classList && c.classList.contains("pgnum")));
    if (!kids.length) return 0;
    const padTop = parseFloat(getComputedStyle(pg).paddingTop) || 0;   // 활자면 시작점 기준
    const top = pg.getBoundingClientRect().top + padTop;
    return Math.round(kids[kids.length - 1].getBoundingClientRect().bottom - top);
  };
  const bodyOf = (pg) => [...pg.children].filter((c) => !(c.classList && c.classList.contains("pgnum")));
  for (let k = pages.length - 1; k > 0; k--) {
    const pg = pages[k], prev = pages[k - 1];
    if (pg.querySelector("h2.chap")) continue;   // 장은 새 쪽에서 연다

    // ① 앞 쪽에 자리가 남으면 끌어올린다
    let guard = 0;
    while (bodyOf(pg).length && guard++ < 20) {
      const first = pg.firstElementChild;
      if (!first || (first.classList && first.classList.contains("pgnum"))) break;
      const need = first.offsetHeight + mb(first);
      if (fill(prev) + need > PAGE_H) break;
      prev.appendChild(first);
      if (fill(prev) > PAGE_H) { pg.insertBefore(first, pg.firstChild); break; }   // 실측이 넘치면 되돌린다
    }

  }
  for (const pg of pages.slice()) {
    if (!pg.children.length) { pg.remove(); pages.splice(pages.indexOf(pg), 1); }
  }

  // R10 — 마지막 안전판: 모든 조정이 끝난 뒤 넘치는 쪽의 꼬리를 다음 쪽으로 내린다
  for (let k = 0; k < pages.length; k++) {
    let g = 0;
    while (fill(pages[k]) > PAGE_H && g++ < 40) {
      const kids = [...pages[k].children].filter((c) => !(c.classList && c.classList.contains("pgnum")));
      if (kids.length <= 1) break;
      const tail = kids[kids.length - 1];
      if (k + 1 >= pages.length) {
        const np = document.createElement("div"); np.className = "page";
        body.appendChild(np); pages.push(np);
      }
      // 표 하나가 통째로 넘칠 때는 행 단위로 쪼갠다
      if (tail.tagName === "TABLE") {
        const room = PAGE_H - (fill(pages[k]) - (tail.offsetHeight + mb(tail)));
        const parts = splitTable(tail, room);
        if (parts) {
          pages[k].replaceChild(parts[0], tail);
          pages[k + 1].insertBefore(parts[1], pages[k + 1].firstChild);
          if (fill(pages[k]) > PAGE_H) continue;   // 아직 넘치면 다음 꼬리로
          break;
        }
        // 쪼갤 수 없는 표(본문 1행)는 통째로 내린다 — 아래로 흐름

      }
      pages[k + 1].insertBefore(tail, pages[k + 1].firstChild);
    }
  }

  // R8 — 절 제목이 페이지 끝에 홀로 남으면 다음 쪽으로 내린다(고아 제목)
  for (let k = 0; k < pages.length - 1; k++) {
    const pg = pages[k];
    let last = pg.lastElementChild;
    while (last && last.classList && last.classList.contains("pgnum")) last = last.previousElementSibling;
    // 고아 = 절 제목, keep 안의 제목, 그리고 짧은 도입 문단("약점 둘." 같은 것)
    const shortLead = last && last.tagName === "P" &&
      (last.textContent || "").trim().length < 42;
    const isOrphan = last && (last.tagName === "H3" || shortLead ||
      (last.classList && last.classList.contains("keep") &&
       last.children.length === 1 && last.firstElementChild.tagName === "H3"));
    if (isOrphan) {
      const nxt = pages[k + 1];
      pg.removeChild(last);
      nxt.insertBefore(last, nxt.firstChild);
      // 옮긴 만큼 다음 쪽이 넘치면 꼬리를 그 다음 쪽으로 연쇄 이동
      let cur2 = k + 1;
      while (cur2 < pages.length) {
        const pgx = pages[cur2];
        let h = 0;
        for (const c of pgx.children) {
          if (c.classList && c.classList.contains("pgnum")) continue;
          h += c.offsetHeight + mb(c);
        }
        if (h <= PAGE_H) break;
        let tail = pgx.lastElementChild;
        while (tail && tail.classList && tail.classList.contains("pgnum")) tail = tail.previousElementSibling;
        if (!tail || pgx.children.length <= 1) break;
        if (cur2 + 1 >= pages.length) { const np = document.createElement("div"); np.className = "page"; body.appendChild(np); pages.push(np); }
        pgx.removeChild(tail);
        pages[cur2 + 1].insertBefore(tail, pages[cur2 + 1].firstChild);
        cur2++;
      }
    }
  }

  for (const pg of pages.slice()) {
    if (!pg.children.length) { pg.remove(); pages.splice(pages.indexOf(pg), 1); }
  }
  // 쪽번호 + 차례 쪽수 — 본문 기준(표지·차례 제외), 책 관례
  const FRONT = document.querySelectorAll("section.cover, section.toc").length;   // 표지·차례 = 앞장
  const chapPage = {};
  pages.forEach((pg, i) => {
    const num = document.createElement("i");
    num.className = "pgnum"; num.textContent = i + 1 + FRONT;   // PDF 물리 쪽수와 일치
    pg.appendChild(num);
    const h = pg.querySelector("h2.chap > i");
    if (h) { const k = h.textContent.trim(); if (!(k in chapPage)) chapPage[k] = i + 1 + FRONT; }
  });
  document.querySelectorAll(".toc ol li").forEach((li) => {
    const k = li.querySelector("i")?.textContent?.trim();
    if (k in chapPage) {
      const b = document.createElement("b");
      b.className = "tpg"; b.textContent = chapPage[k];
      li.appendChild(b);
    }
  });

  body.setAttribute("data-paginated", String(pages.length));
})();
