// 연구 라이브러리 수집기. OpenAlex(해외·국제 학술지)와 KCI(국내 학술지)에서
// 북한의 교육·디아스포라·경제 관련 논문 서지정보를 모아 app/data/library.json 에 더한다.
//
//   node scripts/collect-library.mjs [--since YYYY-MM-DD]
//
// --since 를 주지 않으면 최근 90일 출판분을 다시 확인한다(늦게 색인되는 논문을 놓치지 않으려고).
// KCI는 환경변수 KCI_API_KEY 가 있을 때만 조회한다. OPENALEX_API_KEY 는 없어도 되지만 있으면 한 번에 끝까지 받는다.
// 잘못 들어온 논문은 app/data/library-exclude.json 에 id 를 넣으면 지워지고 다시 수집되지 않는다.

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

const DATA = new URL("../app/data/library.json", import.meta.url);
const EXCLUDE = new URL("../app/data/library-exclude.json", import.meta.url);

const NK = '("North Korea" OR "North Korean" OR "North Koreans" OR DPRK OR Pyongyang)';
const TOPICS = {
  education: {
    openalex: `${NK} AND (education OR school OR schooling OR teacher OR teachers OR university OR curriculum OR textbook OR students)`,
    kci: ["북한 교육", "북한 학교", "북한 교원", "북한 교사", "북한 대학", "북한 교과서", "북한 교육과정"],
    ko: ["교육", "학교", "교원", "교사", "대학", "교과", "학생", "학습"],
  },
  diaspora: {
    openalex: `${NK} AND (defector OR defectors OR refugee OR refugees OR migrant OR migrants OR diaspora OR resettlement OR escapee OR escapees)`,
    kci: ["북한이탈주민", "탈북민", "탈북", "북한이탈", "북한 디아스포라", "북한 이주민"],
    ko: ["이탈", "탈북", "디아스포라", "이주", "정착", "난민"],
  },
  economy: {
    openalex: `${NK} AND (economy OR economic OR market OR markets OR marketization OR trade OR sanctions OR industry OR agriculture OR food)`,
    kci: ["북한 경제", "북한 시장", "북한 무역", "북한 대북제재", "북한 산업", "북한 농업", "북한 식량"],
    ko: ["경제", "시장", "무역", "제재", "산업", "농업", "식량", "기업"],
  },
};
const KINDS = "article|book-chapter|book|dissertation";

const args = process.argv.slice(2);
const sinceArg = args.includes("--since") ? args[args.indexOf("--since") + 1] : null;
const since = sinceArg ?? new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10);

const normTitle = (t) => t.toLowerCase().replace(/<[^>]+>/g, "").replace(/[^\p{L}\p{N}]+/gu, "");
const shortAuthors = (names) => (names.length > 5 ? [...names.slice(0, 5), "외"] : names);

async function getJSON(url) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": "jco2940.github.io research library" } });
    if (res.ok) return res.json();
    if (attempt >= 4 || (res.status < 500 && res.status !== 429)) throw new Error(`${res.status} ${(await res.text()).slice(0, 300)} ${url}`);
    await new Promise((r) => setTimeout(r, 2000 * attempt));
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

async function fromOpenAlex(topic, query) {
  const key = process.env.OPENALEX_API_KEY;
  const windows = key ? [[since, new Date().toISOString().slice(0, 10)]] : monthWindows(since);
  const out = [];
  for (const [from, to] of windows) {
    let cursor = key ? "*" : null;
    do {
      const url = new URL("https://api.openalex.org/works");
      url.searchParams.set("filter", `title_and_abstract.search:${query},from_publication_date:${from},to_publication_date:${to},type:${KINDS}`);
      url.searchParams.set("select", "id,doi,display_name,publication_date,authorships,primary_location,language");
      url.searchParams.set("per-page", "200");
      if (key) {
        url.searchParams.set("api_key", key);
        url.searchParams.set("cursor", cursor);
      }
      const page = await getJSON(url);
      out.push(...page.results.filter((w) => w.display_name).map((w) => toPaper(topic, w)));
      if (!key && page.meta.count > 200) warn(`OpenAlex ${topic} ${from}~${to}: ${page.meta.count}건 중 200건만 받음 (OPENALEX_API_KEY 를 넣으면 모두 받음)`);
      cursor = key && page.results.length ? page.meta.next_cursor : null;
    } while (cursor);
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

const found = [];
for (const [topic, q] of Object.entries(TOPICS)) {
  const items = await fromOpenAlex(topic, q.openalex);
  report(`OpenAlex ${topic}: ${items.length}`);
  found.push(...items);
  if (process.env.KCI_API_KEY) {
    const kci = await fromKCI(topic, q.kci, process.env.KCI_API_KEY);
    report(`KCI ${topic}: ${kci.length}`);
    found.push(...kci);
  }
}

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
