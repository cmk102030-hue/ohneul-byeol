/* 조판 오버플로 게이트 — 실제 렌더 높이로 검사한다(텍스트량 추정 아님).
   ① 하단 침범: 마지막 요소가 활자면 아래를 넘는가
   ② 상단 여백: 첫 요소가 맨 위에서 시작하는가
   ③ 고아 제목: 절 제목만 페이지 끝에 남았는가
   브라우저 콘솔에서 실행되어 결과를 document.title로 돌려준다. */
(() => {
  const PAGE = 794, PAD_T = 38, PAD_B = 40;
  const LIMIT = PAGE - PAD_B;                 // 콘텐츠가 넘으면 안 되는 하한
  const P = [...document.querySelectorAll(".page")];
  const over = [], top = [], orphan = [];

  for (let i = 0; i < P.length; i++) {
    const pg = P[i], box = pg.getBoundingClientRect().top;
    let last = pg.lastElementChild;
    while (last && last.classList.contains("pgnum")) last = last.previousElementSibling;
    if (!last) continue;

    const used = Math.round(last.getBoundingClientRect().bottom - box);
    if (used > LIMIT) over.push(`${i + 1}:${used}`);

    const first = pg.firstElementChild;
    if (first) {
      const m = parseFloat(getComputedStyle(first).marginTop);
      if (m > 2) top.push(`${i + 1}:${Math.round(m)}`);
    }

    const isH3 = last.tagName === "H3" ||
      (last.classList.contains("keep") && last.children.length === 1 &&
       last.firstElementChild && last.firstElementChild.tagName === "H3");
    if (isH3) orphan.push(i + 1);
  }
  document.title = `PAGES=${P.length}|OVER=${over.join(",")}|TOP=${top.join(",")}|ORPHAN=${orphan.join(",")}`;
})();
