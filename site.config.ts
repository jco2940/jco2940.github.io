// 사이트 전체에서 쓰는 기본 정보. 이 파일만 고쳐도 이름·소개·연락처가 바뀐다.
export const SITE_URL = "https://jco2940.github.io";

export const PROFILE = {
  name: "조현정",
  nameEn: "Hyun Jung Jo",
  role: "교육학 박사 · 북한 인권·교육 연구",
  tagline: ["교육학 박사", "북한 교육, 사회, 인권을 연구합니다."],
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
];

// 공개 아카이브. 홈 화면 타일과 각 아카이브 상단의 탭으로 쓴다. sub 는 아카이브 안의 하위 탭
export const ARCHIVES = [
  {
    href: "/trends",
    title: "북한 이슈 동향",
    text: "한국·미국·영국·중국·러시아·일본 언론의 북한 관련 보도와 『로동신문』을 매일 모아 정리합니다.",
    tone: "tile-indigo",
    sub: [
      { href: "/trends", label: "언론 동향" },
      { href: "/rodong", label: "노동신문 브리핑" },
    ],
  },
  {
    href: "/library",
    title: "북한 라이브러리",
    text: "유엔과 국제사회, 각국 정부가 발간한 북한 인권 관련 법·보고서·정책문서를 모았습니다.",
    tone: "tile-slate",
    sub: [],
  },
  {
    href: "/studies",
    title: "북한 사회 연구",
    text: "세계 각국에서 게재되는 북한의 교육·디아스포라·여성·청(소)년·장애인·노인·경제·정치 관련 논문을 모읍니다.",
    tone: "tile-green",
    sub: [],
  },
];
