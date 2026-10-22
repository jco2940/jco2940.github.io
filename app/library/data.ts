import raw from "../data/library.json";

// 연구 라이브러리: scripts/collect-library.mjs 가 매일 모으는 북한 관련 논문 서지정보
export const LIBRARY_TOPICS = [
  { id: "education", label: "교육" },
  { id: "diaspora", label: "디아스포라" },
  { id: "economy", label: "경제" },
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

export const LIBRARY = raw as { updated: string; items: Paper[] };

const COUNTRY_NAMES: Record<string, string> = {
  KR: "한국", US: "미국", JP: "일본", CN: "중국", GB: "영국", DE: "독일", FR: "프랑스", CA: "캐나다",
  AU: "호주", RU: "러시아", NL: "네덜란드", SE: "스웨덴", IT: "이탈리아", ES: "스페인", CH: "스위스",
  SG: "싱가포르", TW: "대만", HK: "홍콩", IN: "인도", NZ: "뉴질랜드", BE: "벨기에", AT: "오스트리아",
  NO: "노르웨이", DK: "덴마크", FI: "핀란드", PL: "폴란드", IL: "이스라엘", MN: "몽골", VN: "베트남",
};

export function countryName(code: string) {
  return COUNTRY_NAMES[code] ?? code;
}
