import raw from "../../data/rodong-monthly.json";
import { DAYS, fieldLabel, type Day, type FieldId, type Issue } from "../data";

// 월별 리포트에서 다루는 사회 분야
export const REPORT_FIELDS = ["education", "women", "youth", "disability", "health"] as const satisfies readonly FieldId[];

type Analysis = { summary: string; findings: string[] };
type MonthNote = { lead: string; fields: Partial<Record<FieldId, Analysis>> };
const NOTES = raw as Record<string, MonthNote>;

export type FieldStat = {
  id: FieldId;
  label: string;
  issues: (Issue & { date: string })[];
  articles: number;
  days: number;
  topics: [string, number][];
  byDay: Map<number, number>;
  byPage: [number, number][];
  analysis?: Analysis;
};

// 브리핑이 있는 달 (최근 달이 먼저)
export const MONTHS = [...new Set(DAYS.map((d) => d.date.slice(0, 7)))].sort().reverse();

export function monthLabel(month: string) {
  const [y, m] = month.split("-");
  return `${y}년 ${Number(m)}월`;
}

export function monthDays(month: string): Day[] {
  return DAYS.filter((d) => d.date.startsWith(month)).sort((a, b) => a.date.localeCompare(b.date));
}

export function daysInMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

const tally = <K>(keys: K[]) => {
  const m = new Map<K, number>();
  keys.forEach((k) => m.set(k, (m.get(k) ?? 0) + 1));
  return m;
};

export function fieldStat(month: string, id: FieldId): FieldStat {
  const issues = monthDays(month).flatMap((d) => d.items.filter((i) => i.field === id).map((i) => ({ ...i, date: d.date })));
  const sources = issues.flatMap((i) => i.sources);
  return {
    id,
    label: fieldLabel(id),
    issues,
    articles: sources.length,
    days: new Set(issues.map((i) => i.date)).size,
    topics: [...tally(issues.map((i) => i.topic ?? "기타"))].sort((a, b) => b[1] - a[1]),
    byDay: tally(issues.map((i) => Number(i.date.slice(8)))),
    byPage: [...tally(sources.flatMap((s) => (s.page ? [s.page] : [])))].sort((a, b) => a[0] - b[0]),
    analysis: NOTES[month]?.fields[id],
  };
}

export function monthLead(month: string) {
  return NOTES[month]?.lead;
}
