import type { Article, TrendDay } from "./data";

// 하루치 기사에서 여러 언론이 함께 다룬 이야기를 찾아, 많이 다뤄진 순서로 돌려준다.
// 같은 언어의 제목끼리 핵심 낱말이 두 개 이상 겹치면 같은 이야기로 묶는다(언어를 넘나드는 묶음은 하지 않는다)

export type Story = {
  date: string;
  lang: "ko" | "en";
  headline: Article;
  keywords: string[];
  articles: Article[];
  sources: number;
  countries: string[];
};

const KO_STOP = new Set(["북한", "북한의", "북한이", "북한은", "북한군", "단독", "속보", "종합", "뉴스", "기자", "오늘", "대한", "관련", "위해", "있다", "한다", "했다", "밝혀", "에서", "으로", "이번", "지난", "정부", "사진", "영상", "포토"]);
const EN_STOP = new Set(["north", "korea", "korean", "koreas", "korea's", "says", "said", "with", "from", "after", "over", "that", "this", "will", "have", "amid", "news", "report", "reports", "what", "into", "about", "their", "they", "than", "could", "would", "more", "against", "pyongyang's"]);
const KO_PARTICLE = /(에서|으로|에게|까지|부터|이다|은|는|이|가|을|를|의|에|도|로|과|와)$/;
// 조사를 떼면 안 되는 이름
const KO_NAMES = ["김정은", "김여정", "김주애", "최선희", "조선중앙통신", "로동신문"];

function tokens(title: string, lang: "ko" | "en") {
  const words = title.toLowerCase().split(/[^\p{L}\p{N}']+/u).filter(Boolean);
  const out = new Set<string>();
  for (let w of words) {
    if (lang === "ko") {
      const name = KO_NAMES.find((n) => w.startsWith(n));
      if (name) w = name;
      else if (w.length >= 3) w = w.replace(KO_PARTICLE, "");
      if (w.length >= 2 && !KO_STOP.has(w) && /[가-힣]/.test(w)) out.add(w);
    } else {
      w = w.replace(/'s$/, "");
      if (w.length >= 4 && !EN_STOP.has(w)) out.add(w);
    }
  }
  return out;
}

function langOf(a: Article): "ko" | "en" | null {
  if (a.country === "KR") return "ko";
  if (a.country === "US" || a.country === "GB") return "en";
  return null;
}

// 한국어·영어 기사에서 같은 이야기를 두 번 고르지 않도록, 자주 나오는 주제를 두 언어로 적어 둔다
const TOPICS: RegExp[] = [
  /확성기|대북방송|대남방송|loudspeaker|propaganda broadcast/i,
  /지뢰|landmine|\bmines?\b/i,
  /미사일|탄도|missile|ballistic/i,
  /핵실험|핵무기|핵개발|비핵화|nuclear/i,
  /파병|러시아|russia|troops/i,
  /제재|sanction/i,
  /탈북|defector|refugee/i,
  /김여정|kim yo[- ]?jong/i,
  /김정은|kim jong[- ]?un/i,
  /트럼프|trump/i,
  /푸틴|putin/i,
  /시진핑|중국|xi jinping|china/i,
  /위성|satellite/i,
  /무인기|드론|drone/i,
  /풍선|balloon/i,
  /유엔|안보리|united nations|security council|\bun\b/i,
  /해킹|가상자산|암호화폐|hack|crypto|it workers?/i,
];

const topicsOf = (story: Story) => {
  const text = [story.headline.title, ...story.keywords].join(" ");
  return TOPICS.filter((re) => re.test(text));
};

// 여러 언론이 다룬 순서대로 고르되, 이미 고른 이야기와 주제가 겹치면 건너뛴다
export function featuredStories(day: TrendDay, limit = 3): Story[] {
  const picked: Story[] = [];
  const used = new Set<RegExp>();
  for (const story of topStories(day, 20)) {
    const topics = topicsOf(story);
    if (topics.some((t) => used.has(t))) continue;
    picked.push(story);
    topics.forEach((t) => used.add(t));
    if (picked.length === limit) break;
  }
  return picked;
}

export function topStories(day: TrendDay, limit = 3): Story[] {
  const groups: { lang: "ko" | "en"; counts: Map<string, number>; items: { a: Article; t: Set<string> }[] }[] = [];
  for (const a of day.items) {
    const lang = langOf(a);
    if (!lang) continue;
    const t = tokens(a.title, lang);
    if (t.size < 2) continue;
    let best: (typeof groups)[number] | undefined;
    let bestShared = 1;
    for (const g of groups) {
      if (g.lang !== lang) continue;
      // 묶음에서 두 번 이상 나온 낱말(또는 첫 기사의 낱말)과 겹치는 수
      const shared = [...t].filter((w) => (g.counts.get(w) ?? 0) >= Math.min(2, g.items.length)).length;
      if (shared > bestShared) {
        best = g;
        bestShared = shared;
      }
    }
    if (!best) {
      best = { lang, counts: new Map(), items: [] };
      groups.push(best);
    }
    best.items.push({ a, t });
    t.forEach((w) => best!.counts.set(w, (best!.counts.get(w) ?? 0) + 1));
  }

  return groups
    .map((g) => {
      const keywords = [...g.counts].filter(([, n]) => n >= 2).sort((x, y) => y[1] - x[1]).slice(0, 4).map(([w]) => w);
      // 핵심 낱말을 가장 많이 담은 제목을 대표로
      const headline = [...g.items].sort((x, y) => keywords.filter((w) => y.t.has(w)).length - keywords.filter((w) => x.t.has(w)).length)[0].a;
      const articles = g.items.map((i) => i.a);
      return {
        date: day.date,
        lang: g.lang,
        headline,
        keywords,
        articles,
        sources: new Set(articles.map((a) => a.source)).size,
        countries: [...new Set(articles.map((a) => a.country))],
      };
    })
    .filter((s) => s.sources >= 2)
    .sort((a, b) => b.sources - a.sources || b.articles.length - a.articles.length)
    .slice(0, limit);
}
