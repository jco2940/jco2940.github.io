import collected from "../data/library.json";
import manual from "../data/library-manual.json";

// 북한인권 라이브러리: scripts/collect-library.mjs 가 모으는 유엔·국제기구 문서와, 직접 적는 법령 등(library-manual.json)
export const DOC_CATEGORIES = [
  { id: "law", label: "법령" },
  { id: "resolution", label: "결의" },
  { id: "report", label: "보고서" },
  { id: "policy", label: "정책문서" },
  { id: "document", label: "기타 문서" },
] as const;

export type Doc = {
  id: string;
  title: string;
  url: string;
  date: string; // YYYY-MM-DD, 날짜를 확인하지 못한 문서는 YYYY-MM
  category: string;
  publisher: string;
  note?: string;
};

const ids = new Set(manual.map((d) => d.id));
export const DOCS: Doc[] = [...(manual as Doc[]), ...(collected.items as Doc[]).filter((d) => !ids.has(d.id))].sort((a, b) =>
  b.date.localeCompare(a.date),
);
export const DOCS_UPDATED = collected.updated;
