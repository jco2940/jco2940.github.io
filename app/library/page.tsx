import type { Metadata } from "next";
import { PageIntro } from "../components";
import { PROFILE } from "../../site.config";
import { ArchiveNav } from "../archive/nav";
import { ArchiveBrowser, type Entry } from "../archive/browser";
import { DOCS, DOCS_UPDATED, DOC_CATEGORIES } from "./data";

export const metadata: Metadata = { title: `북한인권 라이브러리 | ${PROFILE.name}` };

export default function LibraryPage() {
  const entries: Entry[] = DOCS.map((d) => ({
    id: d.id,
    title: d.title,
    url: d.url,
    date: d.date,
    tags: DOC_CATEGORIES.filter((c) => c.id === d.category).map((c) => c.label),
    facets: d.publisher ? [d.publisher] : [],
    meta: [d.date.replaceAll("-", "."), d.note].filter(Boolean).join(" · "),
  }));
  return (
    <main className="inner-page">
      <ArchiveNav />
      <PageIntro
        eyebrow="NORTH KOREA HUMAN RIGHTS LIBRARY"
        title="북한인권 라이브러리"
        lead={`유엔과 국제사회, 각국 정부가 발간한 북한 인권 관련 법·결의·보고서·정책문서를 모았습니다. ReliefWeb(유엔 인도주의업무조정국 문서 저장소)에서 매일 새 문서를 찾아 더하고, 법령과 주요 유엔 문서는 직접 정리합니다.${
          DOCS_UPDATED ? ` (최근 갱신 ${DOCS_UPDATED.replaceAll("-", ".")})` : ""
        }`}
      />
      <ArchiveBrowser items={entries} tags={DOC_CATEGORIES.map((c) => c.label)} facetLabel="모든 발간 기관" unit="건" />
    </main>
  );
}
