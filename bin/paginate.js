// 측정 기반 페이지네이션 — 브라우저에 맡기지 않고 페이지를 직접 구성한다.
// 규약 정본 = prompts/layout_rules.md (R1~R7)
// 실행: pack.mjs가 1차 HTML에 삽입 → Chrome --dump-dom 으로 결과 DOM 회수
//
// ⚠️ 모든 측정은 DOM에 붙인 상태에서 한다. 페이지나 블록이 문서에 없으면
//    offsetHeight가 0이라 계산이 통째로 무효가 된다.
(function () {
  const PAGE_H = 676;              // 활자면 높이 = 794 - 56(상) - 62(하)
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
        // 줄지 않았으면 압축을 되돌린다 (촘촘하게 만들 이유가 없다)
        for (const b of chap) b.classList.remove("tight");
      }
    }
  }

  for (const pg of pages.slice()) {
    if (!pg.children.length) { pg.remove(); pages.splice(pages.indexOf(pg), 1); }
  }
  body.setAttribute("data-paginated", String(pages.length));
})();
