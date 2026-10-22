"use client";

import { useMemo, useState } from "react";
import { LIBRARY_TOPICS, countryName, type Paper } from "./data";

const PAGE = 50;

export function LibraryBrowser({ items }: { items: Paper[] }) {
  const [topic, setTopic] = useState("");
  const [country, setCountry] = useState("");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);

  // 국가 목록은 논문 수가 많은 순으로
  const countries = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((p) => p.countries.forEach((c) => counts.set(c, (counts.get(c) ?? 0) + 1)));
    return [...counts].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (p) =>
        (!topic || p.topics.includes(topic)) &&
        (!country || p.countries.includes(country)) &&
        (!q || `${p.title} ${p.authors.join(" ")} ${p.venue}`.toLowerCase().includes(q)),
    );
  }, [items, topic, country, query]);

  const reset = (fn: () => void) => {
    fn();
    setShown(PAGE);
  };

  return (
    <>
      <div className="library-filters">
        <nav className="field-nav" aria-label="분야">
          {[{ id: "", label: "전체" }, ...LIBRARY_TOPICS].map((t) => (
            <button key={t.id} type="button" aria-pressed={topic === t.id} onClick={() => reset(() => setTopic(t.id))}>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="library-search">
          <select value={country} onChange={(e) => reset(() => setCountry(e.target.value))} aria-label="저자 소속 국가">
            <option value="">모든 국가</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {countryName(c)}
              </option>
            ))}
          </select>
          <input type="search" value={query} onChange={(e) => reset(() => setQuery(e.target.value))} placeholder="제목·저자·학술지 검색" aria-label="검색" />
        </div>
      </div>
      <p className="library-count">{filtered.length.toLocaleString()}편</p>
      <ul className="library-list">
        {filtered.slice(0, shown).map((p) => (
          <li key={p.id}>
            <time>{p.date.slice(0, 7).replace("-", ".")}</time>
            <span>
              <span className="kind">
                {p.topics.map((t) => LIBRARY_TOPICS.find((x) => x.id === t)?.label ?? t).join(" · ")}
                {p.countries.length > 0 && <em> · {p.countries.map(countryName).join(", ")}</em>}
              </span>
              <a href={p.url} className="library-title">
                {p.title}
              </a>
              <p>
                {p.authors.join(", ")}
                {p.venue && ` · ${p.venue}`}
              </p>
            </span>
          </li>
        ))}
      </ul>
      {shown < filtered.length && (
        <button type="button" className="library-more" onClick={() => setShown(shown + PAGE)}>
          더 보기 ({(filtered.length - shown).toLocaleString()}편 남음)
        </button>
      )}
    </>
  );
}
