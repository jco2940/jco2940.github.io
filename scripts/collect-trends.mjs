// 북한 사회 동향 수집기. 나라별 Google 뉴스(RSS)에서 지난 하루 동안의 북한 관련 기사 제목·언론사·링크를 모아
// 한국 시간 날짜별로 app/data/trends/YYYY-MM-DD.json 에 더한다. 기사 본문은 저장하지 않는다.
//
//   node scripts/collect-trends.mjs

import { mkdir, readFile, writeFile } from "node:fs/promises";

const DIR = new URL("../app/data/trends/", import.meta.url);
const PER_COUNTRY_PER_DAY = 60;

const EDITIONS = [
  { country: "KR", q: "북한", hl: "ko", gl: "KR", ceid: "KR:ko" },
  { country: "US", q: '"North Korea"', hl: "en-US", gl: "US", ceid: "US:en" },
  { country: "GB", q: '"North Korea"', hl: "en-GB", gl: "GB", ceid: "GB:en" },
  { country: "CN", q: "朝鲜", hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans" },
  { country: "RU", q: "КНДР", hl: "ru", gl: "RU", ceid: "RU:ru" },
  { country: "JP", q: "北朝鮮", hl: "ja", gl: "JP", ceid: "JP:ja" },
];

// 제목에 이 말이 들어 있으면 그 분야로 분류한다(여러 분야 가능). 언어마다 따로 적는다
const FIELDS = {
  politics: ["김정은", "노동당", "당중앙", "최고인민회의", "정치국", "정권", "외교", "정상회담", "Kim Jong", "Workers' Party", "regime", "summit", "diplomat", "foreign minister", "金正恩", "劳动党", "労働党", "外交", "首脳", "Ким Чен Ын", "ТПК", "переговор", "визит", "МИД"],
  security: ["미사일", "핵무기", "핵실험", "핵개발", "핵위협", "비핵화", "핵잠", "군사", "도발", "무기", "파병", "탄도", "missile", "nuclear", "military", "troops", "weapon", "launch", "导弹", "核", "军", "ミサイル", "軍", "ракет", "ядер", "войск", "военн", "оруж"],
  economy: ["경제", "무역", "제재", "관광", "시장", "식량", "공장", "농업", "economy", "economic", "trade", "sanction", "tourism", "tourist", "food", "crypto", "IT worker", "经济", "贸易", "制裁", "旅游", "経済", "貿易", "観光", "экономик", "торгов", "санкц", "туризм", "турист"],
  society: ["주민", "생활", "사회", "문화", "보건", "의료", "재난", "홍수", "residents", "society", "culture", "health", "flood", "社会", "文化", "生活", "общество", "культур", "здравоохран", "наводнен"],
  humanRights: ["인권", "탈북", "억류", "납북", "북송", "수용소", "이산가족", "human rights", "defector", "refugee", "abduct", "detain", "prison camp", "人权", "脱北", "人権", "拉致", "прав человека", "перебежчик", "беженц"],
  women: ["여성", "여맹", "women", "woman", "妇女", "女性", "женщин"],
  education: ["교육", "학교", "대학", "학생", "교원", "education", "school", "university", "student", "教育", "学校", "大学", "学生", "образован", "школ", "университет", "студент"],
  youth: ["청년", "청소년", "아동", "어린이", "소년단", "youth", "children", "young", "青年", "儿童", "子ども", "молодеж", "детей", "дети", "детск"],
};

const decode = (s) =>
  s
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
const tag = (xml, name) => decode(xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))?.[1] ?? "");
const kstDate = (d) => new Date(d.getTime() + 9 * 3600e3).toISOString().slice(0, 10);
const norm = (t) => t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

async function fetchEdition(e) {
  const url = new URL("https://news.google.com/rss/search");
  url.searchParams.set("q", `${e.q} when:1d`);
  url.searchParams.set("hl", e.hl);
  url.searchParams.set("gl", e.gl);
  url.searchParams.set("ceid", e.ceid);
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (jco2940.github.io north korea trends)" } });
  if (!res.ok) throw new Error(`${e.country} ${res.status}`);
  const xml = await res.text();
  return xml
    .split("<item>")
    .slice(1)
    .map((item) => {
      const source = tag(item, "source");
      let title = tag(item, "title");
      if (source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3));
      const published = new Date(tag(item, "pubDate"));
      const lower = title.toLowerCase();
      return {
        id: norm(title).slice(0, 80),
        title,
        url: tag(item, "link"),
        source,
        country: e.country,
        published: published.toISOString(),
        fields: Object.entries(FIELDS)
          .filter(([, words]) => words.some((w) => lower.includes(w.toLowerCase())))
          .map(([f]) => f),
      };
    })
    .filter((a) => a.title && a.url && !Number.isNaN(Date.parse(a.published)));
}

const report = (msg) => console.log(process.env.GITHUB_ACTIONS ? `::notice::${msg}` : msg);
const warn = (msg) => console.log(process.env.GITHUB_ACTIONS ? `::warning::${msg}` : msg);

await mkdir(DIR, { recursive: true });
const byDay = new Map();
for (const e of EDITIONS) {
  try {
    const items = await fetchEdition(e);
    report(`${e.country}: ${items.length}건`);
    for (const a of items) {
      const day = kstDate(new Date(a.published));
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day).push(a);
    }
  } catch (err) {
    warn(`${e.country} 수집 실패: ${err.message}`);
  }
}

for (const [day, found] of byDay) {
  const file = new URL(`${day}.json`, DIR);
  const prev = await readFile(file, "utf8").then(JSON.parse, () => ({ date: day, items: [] }));
  const seen = new Set(prev.items.map((a) => `${a.country}:${a.id}`));
  const items = [...prev.items];
  for (const a of found.sort((x, y) => y.published.localeCompare(x.published))) {
    const key = `${a.country}:${a.id}`;
    if (seen.has(key) || items.filter((x) => x.country === a.country).length >= PER_COUNTRY_PER_DAY) continue;
    seen.add(key);
    items.push(a);
  }
  if (items.length === prev.items.length) continue;
  items.sort((x, y) => y.published.localeCompare(x.published));
  await writeFile(file, JSON.stringify({ date: day, items }, null, 1) + "\n");
  report(`${day}: ${items.length - prev.items.length}건 추가 (모두 ${items.length}건)`);
}
