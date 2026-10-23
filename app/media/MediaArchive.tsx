"use client";

import { useState } from "react";
import type { RecordGroup } from "../records";

// 송경호 홈페이지의 미디어 화면처럼: 분류 탭 + 썸네일 카드
function youtubeId(url = "") {
  return url.match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/)([\w-]{11})/)?.[1] ?? null;
}

export function MediaArchive({ groups }: { groups: RecordGroup[] }) {
  const items = groups
    .flatMap((g) => g.items.map((item) => ({ ...item, format: g.title })))
    .sort((a, b) => b.date.localeCompare(a.date));
  const [filter, setFilter] = useState("전체");
  const tabs = ["전체", ...groups.filter((g) => g.items.length).map((g) => g.title)];
  const count = (t: string) => (t === "전체" ? items.length : items.filter((i) => i.format === t).length);
  const shown = items.filter((i) => filter === "전체" || i.format === filter);

  return (
    <section className="media-block">
      <div className="media-tools">
        <h2>미디어({items.length})</h2>
        <div className="media-filters" aria-label="미디어 분류">
          {tabs.map((t) => (
            <button key={t} type="button" className={filter === t ? "active" : ""} onClick={() => setFilter(t)}>
              {t}({count(t)})
            </button>
          ))}
        </div>
      </div>
      <div className="video-grid">
        {shown.map((item) => {
          const id = youtubeId(item.url);
          const thumb = item.image ?? (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null);
          const Card = item.url ? "a" : "div";
          return (
            <Card key={item.date + item.title} className="video-card" {...(item.url ? { href: item.url, target: "_blank", rel: "noopener noreferrer" } : {})}>
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumb} alt="" loading="lazy" />
              ) : (
                <span className="placeholder-thumb">
                  <span>{item.venue}</span>
                  <em>{item.format}</em>
                </span>
              )}
              <span className="video-meta">
                <time>{item.date}</time>
                <span>{item.venue}</span>
              </span>
              <h3>{item.title}</h3>
              {item.description && <p>{item.description}</p>}
            </Card>
          );
        })}
      </div>
    </section>
  );
}
