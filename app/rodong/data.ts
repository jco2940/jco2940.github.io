import raw from "../data/rodong.json";

// 노동신문 브리핑의 분야. id는 주소(/rodong/field/<id>)와 rodong.json의 field 값으로 쓴다
export const FIELDS = [
  { id: "politics", label: "정치" },
  { id: "economy", label: "경제" },
  { id: "society", label: "사회" },
  { id: "women", label: "여성" },
  { id: "education", label: "교육" },
  { id: "youth", label: "청(소)년" },
  { id: "health", label: "보건의료" },
  { id: "disability", label: "장애인" },
  { id: "climate", label: "기후환경" },
] as const;

export type FieldId = (typeof FIELDS)[number]["id"];

export type Source = { headline: string; page?: number; url?: string };

export type Issue = {
  field: FieldId;
  topic?: string; // 월별 리포트에서 묶어 세는 세부 주제 (교육·여성·청년·장애인·보건의료)
  title: string;
  summary: string;
  note?: string;
  sources: Source[];
};

export type Day = {
  date: string; // YYYY-MM-DD (노동신문 발행일)
  overview: string;
  items: Issue[];
};

export const DAYS: Day[] = [...(raw.days as Day[])].sort((a, b) => b.date.localeCompare(a.date));

export function fieldLabel(id: string) {
  return FIELDS.find((f) => f.id === id)?.label ?? id;
}

export function formatDate(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  const week = "일월화수목금토"[d.getUTCDay()];
  return `${date.replaceAll("-", ".")} (${week})`;
}
