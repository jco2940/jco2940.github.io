// 네이버 블로그(blog.naver.com/jco2940)의 글 목록을 RSS 로 받아 app/data/blog.json 에 더한다.
// 글 본문은 옮기지 않고 제목·날짜·분류·앞부분 요약·주소만 저장한다(사이트에서는 블로그 원문으로 연결).
//
//   node scripts/collect-blog.mjs

import { readFile, writeFile } from "node:fs/promises";

const BLOG_ID = "jco2940";
const FILE = new URL("../app/data/blog.json", import.meta.url);
const report = (msg) => console.log(process.env.GITHUB_ACTIONS ? `::notice::${msg}` : msg);

const decode = (s) =>
  s
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
const tag = (xml, name) => decode(xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))?.[1] ?? "");
const kstDate = (d) => new Date(d.getTime() + 9 * 3600e3).toISOString().slice(0, 10);

const res = await fetch(`https://rss.blog.naver.com/${BLOG_ID}.xml`, { headers: { "User-Agent": "Mozilla/5.0 (jco2940.github.io)" } });
if (!res.ok) throw new Error(`blog rss ${res.status}`);
const xml = await res.text();
const found = xml
  .split("<item>")
  .slice(1)
  .map((item) => {
    const url = tag(item, "link").split("?")[0];
    const desc = tag(item, "description");
    return {
      id: url.split("/").pop(),
      title: tag(item, "title"),
      url,
      date: kstDate(new Date(tag(item, "pubDate"))),
      category: tag(item, "category") || "블로그",
      summary: desc.length > 140 ? `${desc.slice(0, 138)}…` : desc,
    };
  })
  .filter((p) => p.title && p.url && p.id);

const prev = await readFile(FILE, "utf8").then(JSON.parse, () => ({ items: [] }));
const byId = new Map(prev.items.map((p) => [p.id, p]));
// RSS 는 최근 글만 주므로, 예전에 모은 글은 남겨 두고 새 글과 바뀐 제목만 반영한다
found.forEach((p) => byId.set(p.id, { ...byId.get(p.id), ...p }));
const items = [...byId.values()].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
if (JSON.stringify(items) !== JSON.stringify(prev.items)) {
  await writeFile(FILE, JSON.stringify({ updated: new Date().toISOString().slice(0, 10), items }, null, 1) + "\n");
}
report(`블로그: RSS ${found.length}편, 모두 ${items.length}편`);
