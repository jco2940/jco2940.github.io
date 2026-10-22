"use client";

import { useMemo, useState } from "react";

// 아카이브 목록 한 줄. 서버 쪽 페이지가 각 데이터(논문·문서·기사)를 이 모양으로 바꿔 넘긴다
export type Entry = {
  id: string;
  title: string;
  url: string;
  date: string; // YYYY-MM-DD
  tags: string[]; // 분야 (버튼으로 거른다)
  facets: string[]; // 국가·기관 (선택 상자로 거른다)
  meta: string; // 제목 아래 회색 줄
  search?: string; // 화면에 보이지 않지만 검색에 쓰는 글 (예: 논문 원제)
};

const PAGE = 50;

export function ArchiveBrowser({
  items,
  tags,
  facetLabel,
  unit,
  byDay = false,
}: {
  items: Entry[];
  tags: string[];
  facetLabel: string;
  unit: string;
  byDay?: boolean;
}) {
  const [tag, setTag] = useState("");
  const [facet, setFacet] = useState("");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);

  // 선택 상자는 항목이 많은 순으로
  const facets = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((e) => e.facets.forEach((f) => counts.set(f, (counts.get(f) ?? 0) + 1)));
    return [...counts].sort((a, b) => b[1] - a[1]);
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (e) => (!tag || e.tags.includes(tag)) && (!facet || e.facets.includes(facet)) && (!q || `${e.title} ${e.meta} ${e.search ?? ""}`.toLowerCase().includes(q)),
    );
  }, [items, tag, facet, query]);

  const reset = (fn: () => void) => {
    fn();
    setShown(PAGE);
  };

  return (
    <>
      <div className="archive-filters">
        <nav className="field-nav" aria-label="분야">
          {["", ...tags].map((t) => (
            <button key={t} type="button" aria-pressed={tag === t} onClick={() => reset(() => setTag(t))}>
              {t || "전체"}
            </button>
          ))}
        </nav>
        <div className="archive-search">
          <select value={facet} onChange={(e) => reset(() => setFacet(e.target.value))} aria-label={facetLabel}>
            <option value="">{facetLabel}</option>
            {facets.map(([f, n]) => (
              <option key={f} value={f}>
                {f} ({n})
              </option>
            ))}
          </select>
          <input type="search" value={query} onChange={(e) => reset(() => setQuery(e.target.value))} placeholder="검색" aria-label="검색" />
        </div>
      </div>
      <p className="archive-count">
        {filtered.length.toLocaleString()}
        {unit}
      </p>
      <ul className="archive-list">
        {filtered.slice(0, shown).map((e) => (
          <li key={e.id}>
            <time>{byDay ? e.date.slice(5).replace("-", ".") : e.date.slice(0, 7).replace("-", ".")}</time>
            <span>
              <span className="kind">
                {e.tags.join(" · ")}
                {e.facets.length > 0 && <em>{e.tags.length > 0 && " · "}{e.facets.join(", ")}</em>}
              </span>
              <a href={e.url} className="archive-title">
                {e.title}
              </a>
              {e.meta && <p>{e.meta}</p>}
            </span>
          </li>
        ))}
      </ul>
      {shown < filtered.length && (
        <button type="button" className="archive-more" onClick={() => setShown(shown + PAGE)}>
          더 보기 ({(filtered.length - shown).toLocaleString()}
          {unit} 남음)
        </button>
      )}
    </>
  );
}
