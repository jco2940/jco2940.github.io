import type { Metadata } from "next";
import Link from "next/link";
import { PROFILE } from "../../site.config";
import { ArchiveBrowser, type Entry } from "../archive/browser";
import { countryName } from "../archive/countries";
import { PublicHeader } from "../archive/public-header";
import { STUDIES, STUDY_TOPICS } from "./data";
import { buildMap, TOPIC_COLORS } from "./map";
import { StarMap } from "./StarMap";

export const metadata: Metadata = { title: `북한 사회 연구 | ${PROFILE.name}` };

const label = (id: string) => STUDY_TOPICS.find((t) => t.id === id)?.label ?? id;

export default function StudiesPage() {
  const papers = STUDIES.items;
  const entries: Entry[] = papers.map((p) => ({
    id: p.id,
    title: p.titleKo ?? p.title,
    search: p.title, // 원제로도 찾을 수 있게
    url: p.url,
    date: p.date,
    tags: STUDY_TOPICS.filter((t) => p.topics.includes(t.id)).map((t) => t.label),
    facets: p.countries.map(countryName),
    meta: [p.authors.join(", "), p.venue].filter(Boolean).join(" · "),
  }));
  const map = buildMap();
  const topicStats = map.topics.map((id) => ({
    id,
    label: label(id),
    color: TOPIC_COLORS[id] ?? "#ccc",
    count: map.stars.filter((s) => s.topic === id).length,
  }));
  const countries = new Map<string, number>();
  papers.forEach((p) => p.countries.forEach((c) => countries.set(c, (countries.get(c) ?? 0) + 1)));
  const topCountries = [...countries].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const years = new Map<string, number>();
  papers.forEach((p) => p.date && years.set(p.date.slice(0, 4), (years.get(p.date.slice(0, 4)) ?? 0) + 1));
  const ko = papers.filter((p) => p.lang === "ko" || p.countries.includes("KR")).length;
  const total = papers.length || 1;

  return (
    <main className="digest">
      <PublicHeader current="/studies" title="북한 사회 연구" badge="세계의 북한 연구 논문" tone="plum">
        북한의 {STUDY_TOPICS.map((t) => t.label).join("·")} 연구 논문 아카이브 (총 {papers.length.toLocaleString()}편) by 통일연구원{" "}
        <Link href="/">{PROFILE.name}</Link>
      </PublicHeader>

      {papers.length === 0 ? (
        <p className="rodong-empty digest-inner">첫 수집을 기다리고 있습니다.</p>
      ) : (
        <div className="digest-wide">
          <div className="starmap-grid">
            <StarMap width={map.width} height={map.height} stars={map.stars} clusters={map.clusters} lines={map.lines} topics={topicStats} />
            <aside className="starmap-panel">
              <h2>전체</h2>
              <p className="muted">분야 단추를 누르면 그 분야만 밝게 봅니다. 별을 누르면 논문 원문으로 갑니다.</p>
              <p className="big">
                <b>{papers.length.toLocaleString()}</b> 논문 <b>{countries.size}</b> 개국
              </p>
              <p className="big">
                <b>{ko}</b> 한국 논문
              </p>
              <h3>분야 구성</h3>
              <div className="bar">
                {topicStats.map((t) => (
                  <span key={t.id} style={{ width: `${(t.count / total) * 100}%`, background: t.color }} title={`${t.label} ${t.count}`} />
                ))}
              </div>
              <p className="muted small">{topicStats.map((t) => `${t.label} ${Math.round((t.count / total) * 100)}%`).join(" · ")}</p>
              <h3>저자 소속 국가</h3>
              {topCountries.map(([c, n]) => (
                <div key={c} className="meter">
                  <span>{countryName(c)}</span>
                  <i>
                    <i style={{ width: `${(n / topCountries[0][1]) * 100}%` }} />
                  </i>
                  <em>{n}</em>
                </div>
              ))}
              <h3>출판 연도</h3>
              {[...years].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 4).map(([y, n]) => (
                <div key={y} className="meter">
                  <span>{y}</span>
                  <i>
                    <i style={{ width: `${(n / total) * 100}%` }} />
                  </i>
                  <em>{n}</em>
                </div>
              ))}
            </aside>
          </div>

          <section className="starmap-keywords">
            <h2>
              연구주제 핵심 키워드 <small>논문 제목(한국어)에 자주 나오는 말 · 누르면 그 말로 검색</small>
            </h2>
            <div className="digest-chips">
              {map.keywords.map(([w, n]) => (
                <a key={w} href={`?q=${encodeURIComponent(w)}#papers`} className="digest-chip">
                  {w} <b>{n}</b>
                </a>
              ))}
            </div>
          </section>

          <section id="papers" className="starmap-list">
            <h2>논문 목록</h2>
            <ArchiveBrowser items={entries} tags={STUDY_TOPICS.map((t) => t.id).map(label)} facetLabel="모든 국가(저자 소속)" unit="편" />
          </section>
        </div>
      )}
    </main>
  );
}
