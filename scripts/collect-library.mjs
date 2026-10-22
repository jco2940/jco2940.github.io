// 북한 라이브러리 수집기. 유엔 디지털 도서관(UN Digital Library)과 ReliefWeb 에서
// 북한 인권 관련 결의·보고서·정책문서의 서지정보를 모아 app/data/library.json 에 더한다.
//
//   node scripts/collect-library.mjs [--since YYYY]
//
// 법령처럼 자동으로 모이지 않는 자료는 app/data/library-manual.json 에 직접 적는다(사이트에는 함께 보인다).
// ReliefWeb 은 승인받은 appname 이 필요할 수 있어, 환경변수 RELIEFWEB_APPNAME 으로 바꿀 수 있다.

import { readFile, writeFile } from "node:fs/promises";

const DATA = new URL("../app/data/library.json", import.meta.url);

const args = process.argv.slice(2);
const sinceYear = Number(args.includes("--since") ? args[args.indexOf("--since") + 1] : new Date().getUTCFullYear() - 1);

const report = (msg) => console.log(process.env.GITHUB_ACTIONS ? `::notice::${msg}` : msg);
const warn = (msg) => console.log(process.env.GITHUB_ACTIONS ? `::warning::${msg}` : msg);
const UA = { "User-Agent": "Mozilla/5.0 (jco2940.github.io north korea library)" };

// 북한을 다룬 문서인지 제목으로 확인한다
const NK = /democratic people.s republic of korea|\bdprk\b|north korea/i;

const decode = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, "&").trim();

// MARCXML 한 레코드에서 tag/code 의 값들을 꺼낸다
function marc(record, tagNo, code) {
  const out = [];
  for (const m of record.matchAll(new RegExp(`<datafield tag="${tagNo}"[^>]*>([\\s\\S]*?)</datafield>`, "g"))) {
    for (const s of m[1].matchAll(new RegExp(`<subfield code="${code}">([\\s\\S]*?)</subfield>`, "g"))) out.push(decode(s[1]));
  }
  return out;
}

const UN_BODIES = [
  [/special rapporteur/i, "유엔 북한인권 특별보고관"],
  [/commission of inquiry/i, "유엔 북한인권 조사위원회(COI)"],
  [/universal periodic review/i, "유엔 보편적 정례검토(UPR)"],
  [/high commissioner|OHCHR/i, "유엔 인권최고대표사무소"],
  [/human rights council/i, "유엔 인권이사회"],
  [/general assembly/i, "유엔 총회"],
  [/security council/i, "유엔 안전보장이사회"],
  [/secretary-general/i, "유엔 사무총장"],
  [/committee/i, "유엔 조약기구"],
];

function unCategory(title, types) {
  const t = `${title} ${types.join(" ")}`;
  if (/resolution/i.test(t)) return "resolution";
  if (/report|note by the secretary/i.test(t)) return "report";
  return "document";
}

async function fromUNDL() {
  const out = [];
  for (let jrec = 1; jrec <= 1000; jrec += 100) {
    const url = new URL("https://digitallibrary.un.org/search");
    Object.entries({ ln: "en", p: `"human rights" "Democratic People's Republic of Korea"`, sf: "year", so: "d", rg: "100", jrec: String(jrec), of: "xm" }).forEach(
      ([k, v]) => url.searchParams.set(k, v),
    );
    const res = await fetch(url, { headers: UA });
    if (!res.ok) throw new Error(`UN DL ${res.status}`);
    const xml = await res.text();
    const records = xml.split(/<record[\s>]/).slice(1);
    if (jrec === 1 && !records.length) warn(`UN DL 응답에 레코드가 없음 (${res.headers.get("content-type")}): ${xml.slice(0, 200).replace(/\s+/g, " ")}`);
    let older = false;
    for (const r of records) {
      const id = r.match(/<controlfield tag="001">(\d+)<\/controlfield>/)?.[1];
      const title = [marc(r, "245", "a")[0], marc(r, "245", "b")[0]].filter(Boolean).join(" ").replace(/\s*[:/]\s*$/, "");
      const symbol = marc(r, "191", "a")[0] ?? "";
      const rawDate = (marc(r, "269", "a")[0] ?? "").replace(/\D/g, "");
      if (!id || !title || !rawDate) continue;
      const date = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6) || "01"}-${rawDate.slice(6, 8) || "01"}`;
      if (Number(date.slice(0, 4)) < sinceYear) {
        older = true;
        continue;
      }
      if (!NK.test(title)) continue;
      const authors = marc(r, "710", "a");
      const publisher = UN_BODIES.find(([re]) => authors.some((a) => re.test(a)) || re.test(title))?.[1] ?? "유엔";
      out.push({
        id: `undl:${id}`,
        title: symbol ? `${title} (${symbol})` : title,
        url: `https://digitallibrary.un.org/record/${id}`,
        date,
        category: unCategory(title, marc(r, "989", "b")),
        publisher,
        source: "undl",
      });
    }
    if (records.length < 100 || older) break;
  }
  return out;
}

async function fromReliefWeb() {
  const appname = process.env.RELIEFWEB_APPNAME || "jco2940-github-io";
  const out = [];
  for (let offset = 0; offset < 1000; offset += 200) {
    const res = await fetch(`https://api.reliefweb.int/v2/reports?appname=${encodeURIComponent(appname)}`, {
      method: "POST",
      headers: { ...UA, "Content-Type": "application/json" },
      body: JSON.stringify({
        filter: {
          operator: "AND",
          conditions: [
            { field: "primary_country.iso3", value: "prk" },
            { field: "theme.name", value: "Protection and Human Rights" },
            { field: "date.original", value: { from: `${sinceYear}-01-01T00:00:00+00:00` } },
          ],
        },
        fields: { include: ["title", "date.original", "source.name", "format.name", "url_alias"] },
        sort: ["date.original:desc"],
        limit: 200,
        offset,
      }),
    });
    if (!res.ok) throw new Error(`ReliefWeb ${res.status} ${(await res.text()).slice(0, 200)}`);
    const page = await res.json();
    for (const { id, fields: f } of page.data) {
      const formats = (f.format ?? []).map((x) => x.name);
      if (formats.includes("News and Press Release")) continue;
      out.push({
        id: `reliefweb:${id}`,
        title: f.title,
        url: f.url_alias ?? `https://reliefweb.int/node/${id}`,
        date: f.date.original.slice(0, 10),
        category: formats.some((x) => /guideline|policy/i.test(x)) ? "policy" : "report",
        publisher: (f.source ?? []).map((s) => s.name).join(", "),
        source: "reliefweb",
      });
    }
    if (page.data.length < 200) break;
  }
  return out;
}

const data = JSON.parse(await readFile(DATA, "utf8"));
const byId = new Map(data.items.map((d) => [d.id, d]));
let found = 0;
for (const [name, fn] of [["UN Digital Library", fromUNDL], ["ReliefWeb", fromReliefWeb]]) {
  try {
    const items = await fn();
    report(`${name}: ${items.length}건`);
    found += items.length;
    for (const d of items) if (!byId.has(d.id)) byId.set(d.id, { ...d, added: new Date().toISOString().slice(0, 10) });
  } catch (err) {
    warn(`${name} 수집 실패: ${err.message}`);
  }
}

const items = [...byId.values()].sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
if (items.length !== data.items.length) {
  await writeFile(DATA, JSON.stringify({ updated: new Date().toISOString().slice(0, 10), items }, null, 1) + "\n");
}
report(`since ${sinceYear}: ${found} found, ${items.length - data.items.length} new, ${items.length} total`);
