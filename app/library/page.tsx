import type { Metadata } from "next";
import Link from "next/link";
import { PROFILE } from "../../site.config";
import type { Entry } from "../archive/browser";
import { PublicHeader } from "../archive/public-header";
import { DOCS, DOCS_UPDATED, DOC_CATEGORIES } from "./data";
import { ISSUERS, issuerOf, LIB_TOPICS, topicsOf } from "./topics";
import { LibraryView } from "./LibraryView";

export const metadata: Metadata = { title: `북한인권 라이브러리 | ${PROFILE.name}` };

const COLORS: Record<string, string> = {
  law: "#3d3a6b",
  resolution: "#3f6fd6",
  report: "#2f8fb0",
  treaty: "#c2364f",
  upr: "#1f7a63",
  policy: "#c4521a",
  document: "#8a8a8a",
};

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
  const used = DOC_CATEGORIES.filter((c) => DOCS.some((d) => d.category === c.id));
  return (
    <main className="digest">
      <PublicHeader current="/library" title="북한인권 라이브러리" badge="UN · Treaty Bodies · UPR" tone="steel">
        북한 인권 법·결의·보고서·조약기구·UPR 문서 라이브러리 (총 {DOCS.length.toLocaleString()}건) by 통일연구원 <Link href="/">{PROFILE.name}</Link>
        {DOCS_UPDATED ? ` · 최근 갱신 ${DOCS_UPDATED.replaceAll("-", ".")}` : ""}
      </PublicHeader>
      <div className="digest-wide">
        <LibraryView
          rows={LIB_TOPICS.map(({ id, label, icon }) => ({ id, label, icon }))}
          cols={used.map((c) => ({ id: c.id, label: c.label, color: COLORS[c.id] ?? "#888" }))}
          issuers={ISSUERS.map(({ id, label }) => ({ id, label }))}
          docs={DOCS.map((d) => ({ id: d.id, topics: topicsOf(d), category: d.category, issuer: issuerOf(d), publisher: d.publisher }))}
          entries={entries}
          tags={DOC_CATEGORIES.map((c) => c.label)}
        />
      </div>
    </main>
  );
}
