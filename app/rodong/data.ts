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

// topic: 기사 하나가 속한 항목과 다른 세부 주제일 때만 적는다 (월별 리포트의 기사 기준 집계)
export type Source = { headline: string; page?: number; url?: string; topic?: string };

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

// 세부 주제가 달리지 않은 새 브리핑 항목을 위한 자동 분류. 위에서부터 처음 맞는 규칙을 쓴다
const TOPIC_RULES: Partial<Record<FieldId, [string, RegExp][]>> = {
  education: [
    ["국제·총련 교류", /로씨야|중국|총련|유엔|대표단|국제학술|외국|파키스탄|유네스코/],
    ["교육정책·교육강령", /강령|궐기|교육혁명|교육정책|의무교육|학교지원월간|국사중의 국사/],
    ["교원·교원양성", /교원|교사|사범|교육자|교수방법|재교육/],
    ["학교시설·학생물자", /교복|가방|신발|학용품|교구|학교건설|개건|기숙사/],
    ["지역 교육·격차 해소", /농촌|지역의 교육|격차|수준차이|원격|산골|섬/],
    ["고등교육·대학", /대학|박사|학위|연구사/],
    ["과학기술 연계", /과학기술|기술|발명|설계/],
    ["학생 교양", /학생|소년단|교양|원아|학원/],
  ],
  women: [
    ["여성 체육", /녀자|월드컵|선수|경기대회|력기|축구/],
    ["노동 진출·탄원", /진출|탄원/],
    ["녀맹 조직·행사", /녀맹|공연|무도회|상봉/],
    ["모범·미담", /./],
  ],
  youth: [
    ["탄원·진출", /탄원|진출/],
    ["사상·기념 행사", /웅변|공연|야회|기념|참관|ㅌ\.ㄷ/],
    ["학생·소년단·아동", /소년|학생|아동|야영|원아/],
    ["국제·총련 교류", /국제|총련|대표단/],
    ["청년 체육", /축구|선수|경기대회/],
    ["모범·수기", /수기|모범|선구자/],
    ["청년동맹·청년중시 사업", /./],
  ],
  disability: [
    ["장애인 체육", /경기|선수|메달|탁구/],
    ["영예군인 복지·일터", /영예군인|보양소/],
  ],
  health: [
    ["해외 보건·전염병", /에볼라|콜레라|홍역|뎅구|조류독감|전염병|코로나|페스트|여러 나라/],
    ["의학교육·보건과학", /의학대학|의학교육|인재|과학기술|연구|전람회|전시회/],
    ["제약·고려약·의료기구", /고려약|약초|의료기구|소모품|제약|의약품/],
    ["의료일군 미담", /미담|정성|수기|편지/],
    ["영양·육아", /젖제품|육아|영양/],
    ["위생·방역·건강관리", /위생|방역|상식|건강관리|체력|체육/],
    ["병원·의료봉사", /./],
  ],
};

export function inferTopic(field: FieldId, text: string) {
  return TOPIC_RULES[field]?.find(([, re]) => re.test(text))?.[0] ?? "기타";
}

// 항목의 세부 주제: 직접 단 topic이 우선이고, 없으면 제목·요약으로 추정한다
export function topicOf(issue: Issue) {
  return issue.topic ?? inferTopic(issue.field, `${issue.title} ${issue.summary}`);
}

// 기사 하나의 세부 주제: 기사에 단 topic → 항목의 topic → 기사 제목으로 추정 → 항목 추정
export function sourceTopicOf(issue: Issue, source: Source) {
  if (source.topic) return source.topic;
  if (issue.topic) return issue.topic;
  const t = inferTopic(issue.field, source.headline);
  return t === "기타" ? topicOf(issue) : t;
}
