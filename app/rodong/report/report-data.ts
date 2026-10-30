import reports from "../../data/rodong-reports.json";
import { DAYS, sourceTopicOf, type FieldId } from "../data";
import { FOCUS } from "../focus/trend";

type Note = { head: string; body: string };
export type Report = {
  slug: string;
  kind: string;
  field: FieldId;
  focus: string;
  aliases?: string[];
  from: string; // 집계 시작일. 끝은 가장 최근 브리핑 날짜로, 새 브리핑이 올라오면 자동으로 늘어난다
  title: string;
  short: string;
  lead: string;
  keys: Note[];
  phases: { from: string; to: string; title: string; text: string }[];
  issues: { theme: string; body: string; evidence: string }[];
  synthesis: Note[];
  watch: string[];
  caveats: string;
};
export const REPORTS = reports as Report[];

const tally = <K,>(keys: K[]) => {
  const m = new Map<K, number>();
  keys.forEach((k) => m.set(k, (m.get(k) ?? 0) + 1));
  return m;
};

export const reportEnd = () => DAYS.map((d) => d.date).sort().at(-1) ?? "";

// 시작일부터 가장 최근 브리핑까지 센다
export function reportStats(r: Report) {
  const to = reportEnd();
  const days = DAYS.filter((d) => d.date >= r.from && d.date <= to).sort((a, b) => a.date.localeCompare(b.date));
  const months = [...new Set(days.map((d) => d.date.slice(0, 7)))].sort();
  const items = days.flatMap((d) => d.items.filter((i) => i.field === r.field).map((i) => ({ ...i, date: d.date })));
  const sources = items.flatMap((i) => i.sources.map((s) => ({ ...s, date: i.date, topic: sourceTopicOf(i, s) })));
  const focus = FOCUS.find((f) => f.slug === r.focus);
  const perMonth = months.map((m) => {
    const mDays = days.filter((d) => d.date.startsWith(m));
    const mItems = items.filter((i) => i.date.startsWith(m));
    const mSources = sources.filter((s) => s.date.startsWith(m));
    const all = mDays.reduce((n, d) => n + d.items.length, 0);
    const byField = [...tally(mDays.flatMap((d) => d.items.map((i) => i.field)))].sort((a, b) => b[1] - a[1]);
    return {
      month: m,
      briefed: mDays.length,
      items: mItems.length,
      articles: mSources.length,
      days: new Set(mItems.map((i) => i.date)).size,
      all,
      share: all ? Math.round((mItems.length / all) * 1000) / 10 : 0,
      rank: byField.findIndex(([f]) => f === r.field) + 1,
      topics: tally(mSources.map((s) => s.topic)),
      pages: tally(mSources.flatMap((s) => (s.page ? [s.page] : []))),
    };
  });
  const byDate = tally(sources.map((s) => s.date));
  const themes = (focus?.themes ?? []).map((t) => ({ title: t.title, perMonth: months.map((m) => t.timeline.filter((e) => e.date.startsWith(m)).length) }));
  const all = days.reduce((n, d) => n + d.items.length, 0);
  return { from: r.from, to, days, months, items, sources, perMonth, byDate, themes, focus, all };
}

export type Stats = ReturnType<typeof reportStats>;

// 글 속 {period}·{briefed}·{items}·{articles}·{share:월}·{days:월}·{topic:월:주제}·{page:월:면}·{theme:월:쟁점} 을 집계값으로 채운다
export function fillReport(text: string, s: Stats) {
  return text.replace(/\{([a-z]+)(?::([0-9-]+))?(?::([^}]+))?\}/g, (token, key: string, month?: string, arg?: string) => {
    const pm = month ? s.perMonth.find((p) => p.month === month) : undefined;
    if (month && !pm) throw new Error(`종합 리포트: ${token} 의 달이 기간 밖입니다`);
    const v =
      key === "period" ? period(s.from, s.to)
      : key === "briefed" ? s.days.length
      : key === "items" ? s.items.length
      : key === "articles" ? s.sources.length
      : key === "share" ? `${pm!.share}%`
      : key === "days" ? pm!.days
      : key === "topic" ? pm!.topics.get(arg!)
      : key === "page" ? pm!.pages.get(Number(arg))
      : key === "theme" ? s.themes.find((t) => t.title === arg)?.perMonth[s.months.indexOf(month!)]
      : undefined;
    if (v === undefined) throw new Error(`종합 리포트: ${token} 을 채울 수 없습니다`);
    return String(v);
  });
}

const md = (d: string) => `${Number(d.slice(5, 7))}월 ${Number(d.slice(8))}일`;
export const period = (from: string, to: string) => `${from.slice(0, 4)}년 ${md(from)}~${to.slice(0, 4) !== from.slice(0, 4) ? `${to.slice(0, 4)}년 ` : ""}${md(to)}`;
