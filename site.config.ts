// 사이트 전체에서 쓰는 기본 정보. 이 파일만 고쳐도 이름·소개·연락처가 바뀐다.
export const SITE_URL = "https://jco2940.github.io";

export const PROFILE = {
  name: "조현정",
  nameEn: "Hyun Jung Jo",
  role: "교육학 박사 · 북한 인권·교육 연구",
  tagline: "교육학자, 북한 인권·교육 연구자",
  summary:
    "교육학 박사. 북한 인권과 교육·사회를 중심으로 여성, 청(소)년, 정치, 경제, 근로단체, 그리고 국제사회의 북한 인권 조사를 연구합니다.",
  facts: [
    { label: "학위", value: "교육학 박사 (Ph.D. in Education)" },
    { label: "소속", value: "통일연구원 인권연구실 부연구위원" },
  ],
  links: [
    { label: "GitHub", href: "https://github.com/jco2940" },
    { label: "Email", href: "mailto:jco46@kinu.or.kr" },
  ],
};

export const NAV = [
  { href: "/about", label: "CV" },
  { href: "/research", label: "연구" },
  { href: "/talks", label: "발표" },
  { href: "/writing", label: "글" },
  { href: "/media", label: "미디어" },
];

// "연구" 메뉴 아래의 하위 분류. 이 주소들에서는 상단 메뉴의 "연구"가 선택된 것으로 보인다
export const RESEARCH_NAV = [
  { href: "/research", label: "연구·논문" },
  { href: "/interests", label: "연구 관심사" },
  { href: "/rodong", label: "노동신문 브리핑" },
  { href: "/library", label: "연구 라이브러리" },
];
