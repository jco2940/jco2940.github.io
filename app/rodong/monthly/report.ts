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

// 해석 글의 {items}·{articles}·{days}·{topic:주제}·{prev.items}·{prev.topic:주제}·{f:분야} 자리에 실제 집계를 넣는다.
// 없는 주제를 쓰면 빌드가 멈춰, 글 속 건수가 데이터와 어긋나지 않게 한다
function fill(text: string, month: string, id?: FieldId): string {
  const prev = MONTHS[MONTHS.indexOf(month) + 1];
  return text.replace(/\{(prev\.)?(items|articles|days|topic:[^}]+|f:[a-z]+)\}/g, (token, isPrev: string | undefined, key: string) => {
    const m = isPrev ? prev : month;
    if (!m) throw new Error(`월별 리포트 ${month}: 전월이 없어 ${token} 을 채울 수 없습니다`);
    if (key.startsWith("f:")) return String(baseStat(m, key.slice(2) as FieldId).issues.length);
    if (!id) throw new Error(`월별 리포트 ${month}: 분야 밖에서 ${token} 을 썼습니다`);
    const s = baseStat(m, id);
    if (key === "items") return String(s.issues.length);
    if (key === "articles") return String(s.articles);
    if (key === "days") return String(s.days);
    const n = s.topics.find(([t]) => t === key.slice(6))?.[1];
    if (n === undefined) throw new Error(`월별 리포트 ${m} ${id}: 주제 '${key.slice(6)}' 항목이 없습니다`);
    return String(n);
  });
}

export function fieldStat(month: string, id: FieldId): FieldStat {
  const s = baseStat(month, id);
  const note = NOTES[month]?.fields[id];
  return { ...s, analysis: note && { summary: fill(note.summary, month, id), findings: note.findings.map((f) => fill(f, month, id)) } };
}

function baseStat(month: string, id: FieldId): Omit<FieldStat, "analysis"> {
  const issues = monthDays(month).flatMap((d) => d.items.filter((i) => i.field === id).map((i) => ({ ...i, date: d.date })));
  const sources = issues.flatMap((i) => i.sources);
  return {
    id,
    label: fieldLabel(id),
    issues,
    articles: sources.length,
    days: new Set(issues.map((i) => i.date)).size,
    // 세부 주제는 근거 기사 기준으로 센다. 기사에 topic이 없으면 그 항목의 topic을 따른다
    topics: [...tally(issues.flatMap((i) => i.sources.map((s) => s.topic ?? i.topic ?? "기타")))].sort((a, b) => b[1] - a[1]),
    byDay: tally(issues.map((i) => Number(i.date.slice(8)))),
    byPage: [...tally(sources.flatMap((s) => (s.page ? [s.page] : [])))].sort((a, b) => a[0] - b[0]),
  };
}

export function monthLead(month: string) {
  const lead = NOTES[month]?.lead;
  return lead && fill(lead, month);
}
