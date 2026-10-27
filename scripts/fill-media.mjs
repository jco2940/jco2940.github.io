// 미디어 목록(app/data/media.json)에서 유튜브 주소만 넣고 제목·날짜를 비워 둔 항목을 채운다.
// 유튜브 영상 페이지의 메타 정보(제목, 채널, 올린 날짜, 설명)를 읽는다. 이미 채운 칸은 건드리지 않는다.
//
//   node scripts/fill-media.mjs

import { readFile, writeFile } from "node:fs/promises";

const FILE = new URL("../app/data/media.json", import.meta.url);
const report = (msg) => console.log(process.env.GITHUB_ACTIONS ? `::notice::${msg}` : msg);
const youtubeId = (url = "") => url.match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/)([\w-]{11})/)?.[1] ?? null;
const decode = (s) =>
  s.replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim();
const meta = (html, key) => decode(html.match(new RegExp(`<meta (?:name|property|itemprop)="${key}" content="([^"]*)"`))?.[1] ?? "");

const data = JSON.parse(await readFile(FILE, "utf8"));
let filled = 0;
for (const group of data.groups) {
  for (const item of group.items) {
    const id = youtubeId(item.url);
    if (!id || (item.title && item.date && item.venue)) continue;
    const res = await fetch(`https://www.youtube.com/watch?v=${id}&hl=ko`, { headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "ko" } });
    if (!res.ok) {
      report(`${id}: ${res.status}`);
      continue;
    }
    const html = await res.text();
    const title = meta(html, "og:title") || meta(html, "name");
    const date = (meta(html, "uploadDate") || meta(html, "datePublished")).slice(0, 10).replaceAll("-", ".");
    const channel = decode(html.match(/"ownerChannelName":"([^"]+)"/)?.[1] ?? "");
    const desc = meta(html, "og:description");
    item.title ||= title;
    item.date ||= date;
    item.venue ||= channel;
    if (!item.description && desc) item.description = desc.length > 120 ? `${desc.slice(0, 118)}…` : desc;
    report(`${id}: ${item.date} ${item.venue} ${item.title}`);
    filled++;
  }
}
if (filled) await writeFile(FILE, JSON.stringify(data, null, 2) + "\n");
report(`미디어 ${filled}건 채움`);
