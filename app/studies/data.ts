import raw from "../data/studies.json";

// 북한 사회 연구: scripts/collect-studies.mjs 가 매일 모으는 북한 관련 논문 서지정보
export const STUDY_TOPICS = [
  { id: "education", label: "교육" },
  { id: "diaspora", label: "디아스포라" },
  { id: "women", label: "여성" },
  { id: "youth", label: "청(소)년" },
  { id: "disability", label: "장애인" },
  { id: "elderly", label: "노인" },
  { id: "economy", label: "경제" },
  { id: "politics", label: "정치" },
] as const;

export type Paper = {
  id: string;
  title: string;
  authors: string[];
  date: string; // YYYY-MM-DD
  venue: string;
  countries: string[]; // 저자 소속기관 국가 (ISO 3166-1 alpha-2)
  lang: string;
  topics: string[];
  url: string;
  source: "openalex" | "kci";
  added: string;
};

export const STUDIES = raw as { updated: string; items: Paper[] };
