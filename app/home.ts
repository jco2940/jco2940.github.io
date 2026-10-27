import research from "./data/research.json";
import writing from "./data/writing.json";
import blog from "./data/blog.json";
import talks from "./data/talks.json";
import media from "./data/media.json";
import studies from "./data/studies.json";
import library from "./data/library.json";
import type { RecordGroup } from "./records";
import { DAYS as RODONG_DAYS } from "./rodong/data";
import { trendDays } from "./trends/data";
import { DOCS } from "./library/data";

// 홈 화면의 "최근 기록" 목록을 사이트 곳곳의 데이터에서 모은다

// "2026.10.22", "2026.10", "2026-10-22", "2023–2024" 처럼 제각각인 날짜를 정렬용 YYYY-MM-DD 로
export function sortKey(date: string) {
  const [y = "0000", m = "00", d = "00"] = date.match(/\d+/g) ?? [];
  return `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

const dotted = (date: string) => date.replaceAll("-", ".");

export type Note = { href: string; external: boolean; kind: string; date: string; title: string; sub?: string };

export function recentNotes(limit = 12): Note[] {
  const notes: Note[] = [];

  // 조현정 박사 본인의 연구·글·발표·미디어
  for (const g of research.groups) {
    for (const item of g.items) notes.push({ href: `/research#${g.id}`, external: false, kind: g.title, date: item.date, title: item.title, sub: item.venue });
  }
  for (const p of blog.items as { url: string; date: string; title: string; summary: string }[])
    notes.push({ href: p.url, external: true, kind: "글 · 네이버 블로그", date: p.date, title: p.title, sub: p.summary });
  for (const post of writing) notes.push({ href: `/writing/${post.slug}`, external: false, kind: `글 · ${post.category}`, date: post.date, title: post.title, sub: post.summary });
  for (const [groups, page] of [[talks.groups, "/talks"], [media.groups, "/media"]] as const) {
    for (const g of groups as RecordGroup[]) {
      for (const item of g.items)
        notes.push({ href: item.url ?? page, external: Boolean(item.url), kind: g.title, date: item.date, title: item.title, sub: item.venue });
    }
  }

  // 공개 아카이브의 새 소식
  for (const day of RODONG_DAYS) notes.push({ href: `/rodong/${day.date}`, external: false, kind: "노동신문 브리핑", date: day.date, title: day.overview });
  for (const day of trendDays().slice(0, 7)) {
    notes.push({ href: `/trends/${day.date}`, external: false, kind: "북한 이슈 동향", date: day.date, title: `${dotted(day.date)} 국내외 언론 동향`, sub: `기사 ${day.items.length}건` });
  }
  const collected = library.items as { id: string; added?: string }[];
  const docIds = new Set(collected.map((d) => d.id));
  for (const doc of DOCS.filter((d) => !docIds.has(d.id)).slice(0, 5)) {
    notes.push({ href: doc.url, external: true, kind: "북한인권 라이브러리", date: doc.date, title: doc.title, sub: doc.publisher });
  }
  // 자동 수집 문서와 논문은 하루치를 한 줄로 묶는다
  for (const [items, kind, href, unit] of [
    [collected, "북한인권 라이브러리", "/library", "건의 문서"],
    [studies.items as { added?: string }[], "북한 사회 연구", "/studies", "편의 논문"],
  ] as const) {
    const byDay = new Map<string, number>();
    items.forEach((i) => i.added && byDay.set(i.added, (byDay.get(i.added) ?? 0) + 1));
    for (const [day, n] of byDay) notes.push({ href, external: false, kind, date: day, title: `새로 모은 ${n.toLocaleString()}${unit}` });
  }

  // 날짜를 모르는 기록은 최근 기록에 넣지 않는다
  return notes.filter((n) => n.date).sort((a, b) => sortKey(b.date).localeCompare(sortKey(a.date))).slice(0, limit);
}
