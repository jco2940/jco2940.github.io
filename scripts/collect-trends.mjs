// 북한 이슈 동향 수집기. 나라별 Google 뉴스(RSS)에서 지난 하루 동안의 북한 관련 기사 제목·언론사·링크를 모아
// 한국 시간 날짜별로 app/data/trends/YYYY-MM-DD.json 에 더한다. 기사 본문은 저장하지 않는다.
//
//   node scripts/collect-trends.mjs            새 기사 수집
//   node scripts/collect-trends.mjs --retag    분류 낱말이나 거르는 기준을 고친 뒤, 이미 모은 기사에 다시 적용
//   node scripts/collect-trends.mjs --summarize  한 줄 요약(summary)이 빠진 기사만 채운다
//
// 한 줄 요약은 기사 제목을 한국어로 옮긴 것이다(Google 번역, 키 없이 쓰는 공개 주소). 한국어 제목은 그대로 쓴다.

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";

const DIR = new URL("../app/data/trends/", import.meta.url);
const PER_COUNTRY_PER_DAY = 60;

const EDITIONS = [
  { country: "KR", q: "북한", hl: "ko", gl: "KR", ceid: "KR:ko" },
  { country: "US", q: '"North Korea"', hl: "en-US", gl: "US", ceid: "US:en" },
  { country: "GB", q: '"North Korea"', hl: "en-GB", gl: "GB", ceid: "GB:en" },
  { country: "CN", q: "朝鲜", hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans" },
  { country: "RU", q: "КНДР", hl: "ru", gl: "RU", ceid: "RU:ru" },
  { country: "JP", q: "北朝鮮", hl: "ja", gl: "JP", ceid: "JP:ja" },
  // 홈 화면 MEDIA 용: 국내 방송사 보도와 북한 전문 프로그램. 일반 한국 기사와 따로 세어 한도를 나눠 쓴다
  {
    country: "KR",
    via: "broadcast",
    q: "북한 (site:news.kbs.co.kr OR site:imnews.imbc.com OR site:news.sbs.co.kr OR site:ytn.co.kr OR site:news.jtbc.co.kr OR site:yonhapnewstv.co.kr OR site:mbn.co.kr OR site:ichannela.com OR site:tvchosun.com)",
    hl: "ko",
    gl: "KR",
    ceid: "KR:ko",
  },
  { country: "KR", via: "program", q: '"남북의 창" OR "통일전망대" OR "클로즈업 북한"', when: "7d", hl: "ko", gl: "KR", ceid: "KR:ko" },
];

// 제목에 이 말이 들어 있으면 그 분야로 분류한다(여러 분야 가능). 언어마다 따로 적는다
const FIELDS = {
  politics: [
    "김정은", "김여정", "노동당", "당중앙", "최고인민회의", "정치국", "정권", "외교", "정상회담", "회담", "담화", "대남", "남북", "통일부", "유엔", "대사", "동맹",
    "Kim Jong", "Kim Yo", "Workers' Party", "regime", "summit", "talks", "diplomat", "envoy", "foreign minister", "United Nations", "Security Council", "alliance", "Trump", "Putin", "Xi Jinping",
    "金正恩", "金与正", "金與正", "劳动党", "労働党", "外交", "会谈", "会談", "首脳", "联合国", "国連", "习近平", "外长",
    "Ким Чен Ын", "Ким Ё Чжон", "ТПК", "переговор", "визит", "МИД", "ООН", "Совбез", "Путин", "Си Цзиньпин", "Лавров", "посол", "сотрудничеств",
  ],
  security: [
    "미사일", "핵무기", "핵실험", "핵개발", "핵위협", "비핵화", "핵잠", "군사", "도발", "무기", "파병", "탄도", "지뢰", "확성기", "군사분계선", "MDL", "국경", "전쟁", "훈련", "병력", "무인기", "드론", "포격", "정찰", "위성",
    "missile", "nuclear", "military", "loudspeaker", "troops", "weapon", "launch", "border", "drone", "landmine", "war", "drill", "artillery", "army", "satellite", "soldier",
    "导弹", "核", "军", "武器", "派兵", "安保", "边境", "演习", "卫星", "ミサイル", "軍", "演習", "衛星", "国境", "拡声器", "境界線", "派兵",
    "ракет", "ядер", "войск", "военн", "оруж", "минирован", "мины", "границ", "учени", "спутник", "войн", "арми", "дрон", "солдат",
  ],
  economy: [
    "경제", "무역", "제재", "관광", "시장", "식량", "공장", "농업", "IT인력", "위장 취업", "가상자산", "암호화폐", "해킹", "노동자", "수출", "투자",
    "economy", "economic", "trade", "sanction", "tourism", "tourist", "food", "crypto", "IT worker", "hack", "cyber", "workers", "export",
    "经济", "贸易", "制裁", "旅游", "黑客", "劳工", "投资", "経済", "貿易", "観光", "ハッキング",
    "экономик", "торгов", "санкц", "туризм", "турист", "хакер", "рабоч", "инвестиц",
  ],
  society: [
    "주민", "생활", "사회", "문화", "보건", "의료", "재난", "홍수", "스포츠", "축구", "올림픽", "영화", "종교",
    "residents", "society", "culture", "health", "flood", "football", "soccer", "sport", "film", "religio",
    "社会", "文化", "生活", "足球", "女足", "体育", "サッカー", "スポーツ",
    "общество", "культур", "здравоохран", "наводнен", "футбол", "спорт",
  ],
  humanRights: [
    "인권", "탈북", "억류", "선교사", "납북", "북송", "수용소", "이산가족", "국군포로", "강제노동",
    "human rights", "defector", "refugee", "abduct", "detain", "missionar", "prison camp", "forced labor", "forced labour",
    "人权", "脱北", "人権", "拉致", "拘束", "宣教師",
    "прав человека", "перебежчик", "беженц",
  ],
  women: ["여성", "여맹", "여자", "women", "woman", "female", "妇女", "女性", "女足", "женщин"],
  education: ["교육", "학교", "대학", "학생", "교원", "education", "school", "university", "student", "教育", "学校", "大学", "学生", "образован", "школ", "университет", "студент"],
  youth: ["청년", "청소년", "아동", "어린이", "소년단", "U17", "U20", "youth", "children", "young", "青年", "儿童", "子ども", "молодеж", "детей", "дети", "детск"],
};

const tagFields = (title) => {
  const lower = title.toLowerCase();
  return Object.entries(FIELDS)
    .filter(([, words]) => words.some((w) => lower.includes(w.toLowerCase())))
    .map(([f]) => f);
};

// 방송사·프로그램 검색은 본문에만 '북한'이 나오는 기사도 걸러 오므로, 제목이 북한을 다루는 것만 남긴다
const NK_TITLE = /북한|북측|北|김정은|김여정|평양|조선중앙|노동신문|로동신문|탈북|북송|남북|대남|대북|DMZ|비무장지대|군사분계선/;
const BROADCASTER = /KBS|MBC|SBS|YTN|JTBC|연합뉴스TV|MBN|채널A|TV조선|TV CHOSUN|OBS|EBS/i;
const PROGRAM = /남북의 창|통일전망대|클로즈업 북한/;
// 프로그램 검색은 그 이름을 언급한 다른 언론 기사도 가져오므로, 방송사 기사이거나 제목에 프로그램 이름이 있는 것만 남긴다
const keep = (a) =>
  !a.via || (NK_TITLE.test(a.title) && (a.via !== "program" || BROADCASTER.test(a.source) || PROGRAM.test(a.title)));

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
  url.searchParams.set("q", `${e.q} when:${e.when ?? "1d"}`);
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
      return {
        id: norm(title).slice(0, 80),
        title,
        url: tag(item, "link"),
        source,
        country: e.country,
        ...(e.via && { via: e.via }),
        published: published.toISOString(),
        fields: tagFields(title),
      };
    })
    .filter((a) => a.title && a.url && !Number.isNaN(Date.parse(a.published)))
    .filter(keep);
}

// 제목 여러 개를 줄바꿈으로 이어 한 번에 번역한다. 줄 수가 맞지 않으면 그 묶음은 건너뛰고 다음 실행에 다시 한다
const HANGUL = /[가-힣]/;
async function translateBatch(titles) {
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  Object.entries({ client: "gtx", sl: "auto", tl: "ko", dt: "t" }).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { method: "POST", body: new URLSearchParams({ q: titles.join("\n") }) });
  if (!res.ok) throw new Error(`translate ${res.status}`);
  const lines = (await res.json())[0].map((seg) => seg[0]).join("").split("\n").map((l) => l.trim());
  return lines.length === titles.length ? lines : null;
}
async function summarize(items) {
  const todo = items.filter((a) => !a.summary);
  todo.filter((a) => HANGUL.test(a.title)).forEach((a) => (a.summary = a.title));
  const foreign = todo.filter((a) => !a.summary);
  let done = 0;
  for (let i = 0; i < foreign.length; i += 20) {
    const batch = foreign.slice(i, i + 20);
    try {
      const out = await translateBatch(batch.map((a) => a.title));
      if (out) batch.forEach((a, j) => out[j] && (a.summary = out[j])), (done += batch.length);
    } catch (err) {
      warn(`한 줄 요약 번역 실패(${err.message}). 남은 것은 다음 실행에 합니다.`);
      break;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return done;
}

const report = (msg) => console.log(process.env.GITHUB_ACTIONS ? `::notice::${msg}` : msg);
function warn(msg) {
  console.log(process.env.GITHUB_ACTIONS ? `::warning::${msg}` : msg);
}

await mkdir(DIR, { recursive: true });

if (process.argv.includes("--retag")) {
  for (const f of (await readdir(DIR)).filter((f) => f.endsWith(".json"))) {
    const day = JSON.parse(await readFile(new URL(f, DIR), "utf8"));
    day.items = day.items.filter(keep);
    day.items.forEach((a) => (a.fields = tagFields(a.title)));
    await writeFile(new URL(f, DIR), JSON.stringify(day, null, 1) + "\n");
    report(`${f}: ${day.items.filter((a) => a.fields.length).length}/${day.items.length}건 분류`);
  }
  process.exit(0);
}
if (process.argv.includes("--summarize")) {
  for (const f of (await readdir(DIR)).filter((f) => f.endsWith(".json"))) {
    const day = JSON.parse(await readFile(new URL(f, DIR), "utf8"));
    const before = JSON.stringify(day.items);
    const n = await summarize(day.items);
    if (JSON.stringify(day.items) !== before) await writeFile(new URL(f, DIR), JSON.stringify(day, null, 1) + "\n");
    report(`${f}: 번역 ${n}건`);
  }
  process.exit(0);
}
const byDay = new Map();
for (const e of EDITIONS) {
  try {
    const items = await fetchEdition(e);
    report(`${e.country}${e.via ? `(${e.via})` : ""}: ${items.length}건`);
    for (const a of items) {
      const day = kstDate(new Date(a.published));
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day).push(a);
    }
  } catch (err) {
    warn(`${e.country}${e.via ? `(${e.via})` : ""} 수집 실패: ${err.message}`);
  }
}

for (const [day, found] of byDay) {
  const file = new URL(`${day}.json`, DIR);
  const prev = await readFile(file, "utf8").then(JSON.parse, () => ({ date: day, items: [] }));
  const before = JSON.stringify(prev.items);
  const prevCount = prev.items.length;
  const seen = new Set(prev.items.map((a) => `${a.country}:${a.id}`));
  const items = [...prev.items];
  for (const a of found.sort((x, y) => y.published.localeCompare(x.published))) {
    const key = `${a.country}:${a.id}`;
    // 같은 기사가 일반 검색과 방송사 검색에 모두 걸리면 방송사 표시(via)를 남긴다
    if (seen.has(key)) {
      const prevItem = items.find((x) => `${x.country}:${x.id}` === key);
      if (a.via && prevItem && !prevItem.via) prevItem.via = a.via;
      continue;
    }
    if (items.filter((x) => x.country === a.country && x.via === a.via).length >= PER_COUNTRY_PER_DAY) continue;
    seen.add(key);
    items.push(a);
  }
  await summarize(items);
  if (JSON.stringify(items) === before) continue;
  items.sort((x, y) => y.published.localeCompare(x.published));
  await writeFile(file, JSON.stringify({ date: day, items }, null, 1) + "\n");
  report(`${day}: ${items.length - prevCount}건 추가 (모두 ${items.length}건)`);
}
