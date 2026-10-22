// 북한 사회 연구 수집기. OpenAlex(해외·국제 학술지)와 KCI(국내 학술지)에서
// 북한의 교육·디아스포라·여성·청(소)년·장애인·노인·경제·정치 관련 논문 서지정보를 모아 app/data/studies.json 에 더한다.
//
//   node scripts/collect-studies.mjs [--since YYYY-MM-DD]
//
// --since 를 주지 않으면 최근 90일 출판분을 다시 확인한다(늦게 색인되는 논문을 놓치지 않으려고).
// KCI는 환경변수 KCI_API_KEY 가 있을 때만 조회한다. OPENALEX_API_KEY 는 없어도 되지만 있으면 한 번에 끝까지 받는다.
// 잘못 들어온 논문은 app/data/studies-exclude.json 에 id 를 넣으면 지워지고 다시 수집되지 않는다.

import { readFile, writeFile } from "node:fs/promises";

// GitHub Actions 에서는 실패 이유를 주석(annotation)으로도 남긴다
const fail = (e) => {
  if (process.env.GITHUB_ACTIONS) console.log(`::error::${String(e?.message ?? e).replace(/\r?\n/g, " ")}`);
  console.error(e);
  process.exit(1);
};
process.on("uncaughtException", fail);
process.on("unhandledRejection", fail);
const report = (msg) => console.log(process.env.GITHUB_ACTIONS ? `::notice::${msg}` : msg);
const warn = (msg) => console.log(process.env.GITHUB_ACTIONS ? `::warning::${msg}` : msg);

const DATA = new URL("../app/data/studies.json", import.meta.url);
const EXCLUDE = new URL("../app/data/studies-exclude.json", import.meta.url);

// 북한이 제목에 들어간 논문만 받는다(초록에만 스치듯 나오는 책 장·논문을 거르려고). 주제어는 제목이나 초록에서 찾는다
const NK_TITLE = '("North Korea" OR "North Korean" OR "North Koreans" OR DPRK OR Pyongyang OR Nordkorea OR КНДР OR 북한 OR 북한이탈주민 OR 탈북 OR 탈북민 OR 北朝鮮 OR 朝鲜)';
const TOPICS = {
  education: {
    openalex: `(education OR school OR schooling OR teacher OR teachers OR university OR curriculum OR textbook OR students)`,
    kci: ["북한 교육", "북한 학교", "북한 교원", "북한 교사", "북한 대학", "북한 교과서", "북한 교육과정"],
    ko: ["교육", "학교", "교원", "교사", "대학", "교과", "학생", "학습"],
  },
  diaspora: {
    openalex: `(defector OR defectors OR refugee OR refugees OR migrant OR migrants OR diaspora OR resettlement OR escapee OR escapees)`,
    kci: ["북한이탈주민", "탈북민", "탈북", "북한이탈", "북한 디아스포라", "북한 이주민"],
    ko: ["이탈", "탈북", "디아스포라", "이주", "정착", "난민"],
  },
  women: {
    openalex: `(women OR woman OR gender OR female OR mothers OR feminism OR feminist)`,
    kci: ["북한 여성", "북한이탈여성", "탈북여성", "북한 젠더", "여성동맹"],
    ko: ["여성", "젠더", "어머니", "모성", "여맹"],
  },
  youth: {
    openalex: `(youth OR adolescent OR adolescents OR child OR children OR juvenile OR "young people" OR "young adults")`,
    kci: ["북한 청년", "북한 청소년", "북한 아동", "북한 어린이", "탈북 청소년", "북한이탈청소년"],
    ko: ["청년", "청소년", "아동", "어린이", "소년", "학생"],
  },
  disability: {
    openalex: `(disability OR disabilities OR disabled OR impairment OR impairments OR handicapped)`,
    kci: ["북한 장애", "북한 장애인"],
    ko: ["장애"],
  },
  elderly: {
    openalex: `(elderly OR "older adults" OR "older people" OR aging OR ageing OR "old age" OR pension OR pensions)`,
    kci: ["북한 노인", "북한 고령", "북한 노년"],
    ko: ["노인", "고령", "노년", "연금"],
  },
  economy: {
    openalex: `(economy OR economic OR market OR markets OR marketization OR trade OR sanctions OR industry OR agriculture OR food)`,
    kci: ["북한 경제", "북한 시장", "북한 무역", "북한 대북제재", "북한 산업", "북한 농업", "북한 식량"],
    ko: ["경제", "시장", "무역", "제재", "산업", "농업", "식량", "기업"],
  },
  politics: {
    openalex: `(politics OR political OR regime OR leadership OR ideology OR succession OR governance OR "Workers' Party" OR "Kim Jong Un" OR "Kim Jong-un")`,
    kci: ["북한 정치", "북한 노동당", "김정은", "북한 체제", "북한 권력"],
    ko: ["정치", "노동당", "김정은", "체제", "권력", "정권", "이념"],
  },
};
const KINDS = "article|book-chapter|book|dissertation";

const args = process.argv.slice(2);
const sinceArg = args.includes("--since") ? args[args.indexOf("--since") + 1] : null;
const since = sinceArg ?? new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10);

const normTitle = (t) => t.toLowerCase().replace(/<[^>]+>/g, "").replace(/[^\p{L}\p{N}]+/gu, "");
const shortAuthors = (names) => (names.length > 5 ? [...names.slice(0, 5), "외"] : names);

// OpenAlex 는 불리언 연산자가 많은 검색을 초당 1건으로 제한한다. 요청 사이를 띄우고, 그 제한(429)에 걸리면 잠시 뒤 다시 시도한다.
// 하루 한도(budget)를 다 쓴 429 는 다시 시도해도 소용없으므로 바로 넘긴다
let lastRequest = 0;
async function getJSON(url) {
  for (let attempt = 1; ; attempt++) {
    const wait = lastRequest + 1100 - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequest = Date.now();
    const res = await fetch(url, { headers: { "User-Agent": "jco2940.github.io north korea studies" } });
    if (res.ok) return res.json();
    const body = (await res.text()).slice(0, 300);
    const retry = res.status >= 500 || (res.status === 429 && !/budget/i.test(body));
    if (!retry || attempt >= 5) throw new Error(`${res.status} ${body} ${url}`);
    await new Promise((r) => setTimeout(r, 3000 * attempt));
  }
}

// OpenAlex 는 API 키가 없으면 첫 페이지(200건)까지만 준다. 키가 없으면 한 달씩 나눠 조회해 그 한도 안에 들게 한다
function monthWindows(from) {
  const out = [];
  const today = new Date().toISOString().slice(0, 10);
  let cur = new Date(`${from.slice(0, 7)}-01T00:00:00Z`);
  while (cur.toISOString().slice(0, 10) <= today) {
    const next = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 1));
    const last = new Date(next - 864e5).toISOString().slice(0, 10);
    out.push([out.length ? cur.toISOString().slice(0, 10) : from, last]);
    cur = next;
  }
  return out;
}

function toPaper(topic, w) {
  const doi = w.doi ? w.doi.replace("https://doi.org/", "").toLowerCase() : null;
  return {
    id: doi ? `doi:${doi}` : `openalex:${w.id.split("/").pop()}`,
    title: w.display_name.replace(/<[^>]+>/g, ""),
    authors: shortAuthors(w.authorships.map((a) => a.author?.display_name).filter(Boolean)),
    date: w.publication_date,
    venue: w.primary_location?.source?.display_name ?? "",
    countries: [...new Set(w.authorships.flatMap((a) => a.countries ?? []))],
    lang: w.language ?? "",
    topics: [topic],
    url: w.doi ?? w.primary_location?.landing_page_url ?? w.id,
    source: "openalex",
  };
}

async function openAlexPage(query, from, to, cursor, key) {
  const url = new URL("https://api.openalex.org/works");
  url.searchParams.set("filter", `title.search:${NK_TITLE},title_and_abstract.search:${query},from_publication_date:${from},to_publication_date:${to},type:${KINDS}`);
  url.searchParams.set("select", "id,doi,display_name,publication_date,authorships,primary_location,language");
  url.searchParams.set("per-page", "200");
  if (key) {
    url.searchParams.set("api_key", key);
    url.searchParams.set("cursor", cursor);
  }
  return getJSON(url);
}

const addDays = (date, n) => new Date(Date.parse(`${date}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

async function fromOpenAlex(topic, query) {
  const key = process.env.OPENALEX_API_KEY;
  const today = new Date().toISOString().slice(0, 10);
  const out = [];
  if (key) {
    let cursor = "*";
    while (cursor) {
      const page = await openAlexPage(query, since, today, cursor, key);
      out.push(...page.results.filter((w) => w.display_name).map((w) => toPaper(topic, w)));
      cursor = page.results.length ? page.meta.next_cursor : null;
    }
    return out;
  }
  // 키가 없으면 한 번에 200건까지만 받을 수 있어, 200건이 넘는 기간은 반으로 나눠 다시 조회한다
  const queue = monthWindows(since);
  while (queue.length) {
    const [from, to] = queue.shift();
    const page = await openAlexPage(query, from, to, null, null);
    if (page.meta.count > 200 && from < to) {
      const days = (Date.parse(to) - Date.parse(from)) / 864e5;
      const mid = addDays(from, Math.floor(days / 2));
      queue.unshift([from, mid], [addDays(mid, 1), to]);
      continue;
    }
    if (page.meta.count > 200) warn(`OpenAlex ${topic} ${from}: ${page.meta.count}건 중 200건만 받음 (OPENALEX_API_KEY 를 넣으면 모두 받음)`);
    out.push(...page.results.filter((w) => w.display_name).map((w) => toPaper(topic, w)));
  }
  return out;
}

// KCI 오픈API(articleSearch)는 XML로 답한다. 필요한 칸만 정규식으로 뽑는다
const tag = (xml, name) => xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim() ?? "";
const tags = (xml, name) => [...xml.matchAll(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "g"))].map((m) => m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim());

async function fromKCI(topic, words, key) {
  const out = [];
  const from = since.slice(0, 7).replace("-", "");
  const to = new Date().toISOString().slice(0, 7).replace("-", "");
  for (const title of words) {
    for (let page = 1; page <= 20; page++) {
      const url = new URL("https://open.kci.go.kr/po/openapi/openApiSearch.kci");
      Object.entries({ apiCode: "articleSearch", key, title, dateFrom: from, dateTo: to, displayCount: "100", page: String(page) }).forEach(([k, v]) =>
        url.searchParams.set(k, v),
      );
      const res = await fetch(url);
      if (!res.ok) throw new Error(`KCI ${res.status}`);
      const xml = await res.text();
      const records = xml.split("<record>").slice(1);
      if (page === 1 && !records.length && /<result>|error/i.test(xml)) warn(`KCI ${title}: ${tag(xml, "result-msg") || xml.slice(0, 200)}`);
      for (const r of records) {
        const t = tags(r, "article-title")[0];
        if (!t || !/북한|탈북|조선/.test(t) || !TOPICS[topic].ko.some((w) => t.includes(w))) continue;
        const doi = tag(r, "doi").toLowerCase();
        const year = tag(r, "pub-year");
        const mon = tag(r, "pub-mon").padStart(2, "0");
        out.push({
          id: doi ? `doi:${doi}` : `kci:${r.match(/article-id="([^"]+)"/)?.[1] ?? normTitle(t)}`,
          title: t,
          authors: shortAuthors(tags(r, "author").map((a) => a.replace(/\(.*\)$/, "").trim())),
          date: year ? `${year}-${mon === "00" ? "01" : mon}-01` : "",
          venue: tag(r, "journal-name"),
          countries: ["KR"],
          lang: "ko",
          topics: [topic],
          url: doi ? `https://doi.org/${doi}` : tag(r, "url"),
          source: "kci",
        });
      }
      if (records.length < 100) break;
    }
  }
  return out;
}

const data = JSON.parse(await readFile(DATA, "utf8"));
const exclude = new Set(JSON.parse(await readFile(EXCLUDE, "utf8")));

// 한 분야가 실패해도(예: OpenAlex 하루 한도 초과) 그때까지 모은 것은 저장한다
const found = [];
let openAlexDown = false;
for (const [topic, q] of Object.entries(TOPICS)) {
  if (!openAlexDown) {
    try {
      const items = await fromOpenAlex(topic, q.openalex);
      report(`OpenAlex ${topic}: ${items.length}`);
      found.push(...items);
    } catch (err) {
      warn(`OpenAlex ${topic} 수집 실패: ${err.message.slice(0, 250)}`);
      if (/budget/i.test(err.message)) openAlexDown = true;
    }
  }
  if (process.env.KCI_API_KEY) {
    try {
      const kci = await fromKCI(topic, q.kci, process.env.KCI_API_KEY);
      report(`KCI ${topic}: ${kci.length}`);
      found.push(...kci);
    } catch (err) {
      warn(`KCI ${topic} 수집 실패: ${err.message.slice(0, 250)}`);
    }
  }
}
if (openAlexDown) warn("OpenAlex 하루 무료 한도를 다 써서 나머지 분야는 다음 실행에 받습니다. 저장소 Secret OPENALEX_API_KEY 를 넣으면 이 한도를 따로 씁니다.");

// 같은 논문은 id(DOI 우선)나 제목으로 합치고, 분야는 모두 남긴다
const byKey = new Map();
const byTitle = new Map();
for (const item of [...data.items, ...found]) {
  if (exclude.has(item.id)) continue;
  const key = byKey.has(item.id) ? item.id : byTitle.get(normTitle(item.title)) ?? item.id;
  const prev = byKey.get(key);
  if (prev) {
    prev.topics = [...new Set([...prev.topics, ...item.topics])].sort();
    continue;
  }
  byKey.set(key, { ...item, added: item.added ?? new Date().toISOString().slice(0, 10) });
  byTitle.set(normTitle(item.title), key);
}

const items = [...byKey.values()].sort((a, b) => (b.date || "").localeCompare(a.date || "") || a.title.localeCompare(b.title));
const added = items.length - data.items.filter((i) => !exclude.has(i.id)).length;
const changed = JSON.stringify(items) !== JSON.stringify(data.items);
if (changed) await writeFile(DATA, JSON.stringify({ updated: new Date().toISOString().slice(0, 10), items }, null, 1) + "\n");
report(`since ${since}: ${found.length} found, ${added} new, ${items.length} total${changed ? "" : " (no change)"}`);
