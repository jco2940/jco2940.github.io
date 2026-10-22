import type { Metadata } from "next";
import { PageIntro } from "../components";
import { PROFILE } from "../../site.config";
import { ArchiveNav } from "../archive/nav";
import { ArchiveBrowser, type Entry } from "../archive/browser";
import { countryName } from "../archive/countries";
import { STUDIES, STUDY_TOPICS } from "./data";

export const metadata: Metadata = { title: `북한 사회 연구 | ${PROFILE.name}` };

const label = (id: string) => STUDY_TOPICS.find((t) => t.id === id)?.label ?? id;

export default function StudiesPage() {
  const entries: Entry[] = STUDIES.items.map((p) => ({
    id: p.id,
    title: p.titleKo ?? p.title,
    search: p.title, // 원제로도 찾을 수 있게
    url: p.url,
    date: p.date,
    tags: STUDY_TOPICS.filter((t) => p.topics.includes(t.id)).map((t) => t.label),
    facets: p.countries.map(countryName),
    meta: [p.authors.join(", "), p.venue].filter(Boolean).join(" · "),
  }));
  return (
    <main className="inner-page">
      <ArchiveNav />
      <PageIntro
        eyebrow="NORTH KOREA STUDIES"
        title="북한 사회 연구"
        lead={`한국을 비롯한 세계 각국에서 게재되는 북한의 ${STUDY_TOPICS.map((t) => t.label).join("·")} 관련 논문을 매일 모읍니다. OpenAlex와 KCI의 서지정보를 바탕으로 하며, 제목을 누르면 원문 페이지로 이동합니다.${
          STUDIES.updated ? ` (최근 갱신 ${STUDIES.updated.replaceAll("-", ".")})` : ""
        }`}
      />
      {entries.length === 0 ? (
        <p className="rodong-empty">첫 수집을 기다리고 있습니다.</p>
      ) : (
        <ArchiveBrowser items={entries} tags={STUDY_TOPICS.map((t) => t.id).map(label)} facetLabel="모든 국가(저자 소속)" unit="편" />
      )}
    </main>
  );
}
