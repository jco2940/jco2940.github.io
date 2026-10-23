// 북한인권 라이브러리 수집기. ReliefWeb(유엔 인도주의업무조정국이 운영하는 문서 저장소)에서
// 북한 인권 관련 보고서·정책문서의 서지정보를 모아 app/data/library.json 에 더한다.
// (유엔 디지털 도서관은 자동 접속을 막아 두어 수집하지 않는다)
//
//   node scripts/collect-library.mjs [--since YYYY]
//
// 법령처럼 자동으로 모이지 않는 자료는 app/data/library-manual.json 에 직접 적는다(사이트에는 함께 보인다).
// ReliefWeb 은 승인받은 appname 이 있어야 한다. 저장소 Secret RELIEFWEB_APPNAME 으로 넘긴다.

import { readFile, writeFile } from "node:fs/promises";

const DATA = new URL("../app/data/library.json", import.meta.url);

const args = process.argv.slice(2);
const sinceYear = Number(args.includes("--since") ? args[args.indexOf("--since") + 1] : new Date().getUTCFullYear() - 1);

const report = (msg) => console.log(process.env.GITHUB_ACTIONS ? `::notice::${msg}` : msg);
const warn = (msg) => console.log(process.env.GITHUB_ACTIONS ? `::warning::${msg}` : msg);
const UA = { "User-Agent": "jco2940.github.io north korea library" };

async function fromReliefWeb() {
  const appname = process.env.RELIEFWEB_APPNAME;
  if (!appname) throw new Error("RELIEFWEB_APPNAME 이 없음 (https://apidoc.reliefweb.int/parameters#appname 에서 신청)");
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
for (const [name, fn] of [["ReliefWeb", fromReliefWeb]]) {
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
