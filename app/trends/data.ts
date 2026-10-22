import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// 북한 사회 동향: scripts/collect-trends.mjs 가 날짜별로 쌓는 app/data/trends/YYYY-MM-DD.json
export type Article = {
  id: string;
  title: string;
  url: string;
  source: string;
  country: string;
  via?: "broadcast" | "program"; // 방송사·북한 전문 프로그램 검색으로 모인 기사
  published: string;
  fields: string[];
};

export type TrendDay = { date: string; items: Article[] };

export const TREND_FIELDS = [
  { id: "politics", label: "정치" },
  { id: "security", label: "군사·안보" },
  { id: "economy", label: "경제" },
  { id: "society", label: "사회" },
  { id: "humanRights", label: "인권" },
  { id: "women", label: "여성" },
  { id: "education", label: "교육" },
  { id: "youth", label: "청(소)년" },
] as const;

// 언론 동향을 모으는 나라(Google 뉴스 국가판)
export const TREND_COUNTRIES = ["KR", "US", "GB", "CN", "RU", "JP"];

const DIR = join(process.cwd(), "app/data/trends");

export function trendDays(): TrendDay[] {
  return readdirSync(DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort()
    .reverse()
    .map((f) => JSON.parse(readFileSync(join(DIR, f), "utf8")) as TrendDay);
}

export const fieldLabel = (id: string) => TREND_FIELDS.find((f) => f.id === id)?.label ?? id;
