import type { Metadata } from "next";
import Link from "next/link";
import { PROFILE } from "../../site.config";
import type { Entry } from "../archive/browser";
import { countryName } from "../archive/countries";
import { PublicHeader } from "../archive/public-header";
import { STUDIES, STUDY_TOPICS } from "./data";
import { buildMap, TOPIC_COLORS } from "./map";
import { Explorer } from "./Explorer";

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
  const topicOf = new Map(map.stars.map((st) => [st.id, st.topic]));
  const meta = papers.map((p) => ({
    id: p.id,
    countries: p.countries,
    year: p.date.slice(0, 4),
    ko: p.lang === "ko" || p.countries.includes("KR"),
    topic: topicOf.get(p.id) ?? "",
  }));

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
          <Explorer
            width={map.width}
            height={map.height}
            stars={map.stars}
            clusters={map.clusters}
            lines={map.lines}
            topics={topicStats}
            keywords={map.keywords}
            meta={meta}
            entries={entries}
            tags={STUDY_TOPICS.map((t) => t.id).map(label)}
          />
        </div>
      )}
    </main>
  );
}
