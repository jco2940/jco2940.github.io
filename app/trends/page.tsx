import type { Metadata } from "next";
import Link from "next/link";
import { PROFILE } from "../../site.config";
import { PublicHeader } from "../archive/public-header";
import { countryName } from "../archive/countries";
import { DAYS as RODONG_DAYS } from "../rodong/data";
import { DOCS } from "../library/data";
import { STUDIES } from "../studies/data";
import { TREND_COUNTRIES, TREND_FIELDS, trendDays, type TrendDay } from "../trends/data";
import { featuredStories, isBroadcast, textOf } from "../trends/top";

export const metadata: Metadata = {
  title: `북한 이슈 동향 | ${PROFILE.name}`,
  description: "북한 인권·사회 동향 다이제스트: 국내외 언론 보도, 『로동신문』 브리핑, 북한인권 문서, 북한 사회 연구 논문",
};

const FIELD_ICON: Record<string, string> = {
  politics: "🏛️",
  security: "🛡️",
  economy: "📈",
  society: "🏘️",
  humanRights: "⚖️",
  women: "👩",
  education: "🎓",
  youth: "🧒",
};

const clip = (s: string, n = 48) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const dotted = (d: string) => d.replaceAll("-", ".").replace(/\.0(\d)/g, ".$1");

// 월요일~일요일 한 주씩 묶는다
function weeks(days: TrendDay[]) {
  const byWeek = new Map<string, TrendDay[]>();
  for (const d of days) {
    const t = new Date(`${d.date}T00:00:00Z`);
    const monday = new Date(t.getTime() - ((t.getUTCDay() + 6) % 7) * 864e5).toISOString().slice(0, 10);
    byWeek.set(monday, [...(byWeek.get(monday) ?? []), d]);
  }
  return [...byWeek]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([monday, ds]) => {
      const sunday = new Date(Date.parse(`${monday}T00:00:00Z`) + 6 * 864e5).toISOString().slice(0, 10);
      const merged: TrendDay = { date: ds[0].date, items: ds.flatMap((d) => d.items) };
      return { monday, sunday, count: merged.items.length, stories: featuredStories(merged, { limit: 3 }) };
    });
}

// 보도량으로 그 주의 '날씨'를 붙인다
const weather = (n: number) => (n >= 1500 ? "⛈️" : n >= 800 ? "🌧️" : n >= 300 ? "⛅" : "🌤️");

export default function TrendsPage() {
  const days = trendDays().filter((d) => d.items.length > 0);
  const all = days.flatMap((d) => d.items);
  const weekly = weeks(days).slice(0, 8);

  const bySource = [
    ...TREND_COUNTRIES.map((c) => ({ label: `${countryName(c)} 언론`, n: all.filter((a) => a.country === c && !isBroadcast(a)).length, href: `/trends/${days[0]?.date}?facet=${encodeURIComponent(countryName(c))}`, tone: "chip-press" })),
    { label: "국내 방송", n: all.filter(isBroadcast).length, href: `/trends/${days[0]?.date}`, tone: "chip-press" },
    { label: "노동신문 브리핑", n: RODONG_DAYS.reduce((s, d) => s + d.items.length, 0), href: "/rodong", tone: "chip-rodong" },
    { label: "북한인권 문서", n: DOCS.length, href: "/library", tone: "chip-doc" },
    { label: "북한 사회 연구 논문", n: STUDIES.items.length, href: "/studies", tone: "chip-study" },
  ].filter((s) => s.n > 0);

  const byField = TREND_FIELDS.map((f) => ({ ...f, n: all.filter((a) => a.fields.includes(f.id)).length }))
    .filter((f) => f.n > 0)
    .sort((a, b) => b.n - a.n);

  return (
    <main className="digest">
      <PublicHeader current="/trends" title="북한 이슈 동향" badge="North Korea in Focus">
        한국·미국·영국·중국·러시아·일본 언론과 『로동신문』으로 보는 북한 동향 다이제스트 (총 {days.length}일치 {all.length.toLocaleString()}건) by
        통일연구원 <Link href="/">{PROFILE.name}</Link>
      </PublicHeader>

      <div className="digest-inner">

        <section className="digest-section">
          <h2>
            <Link href={days[0] ? `/trends/${days[0].date}` : "/trends"}>주간 하이라이트 →</Link>
          </h2>
          <ul className="digest-weeks">
            {weekly.map((w) => (
              <li key={w.monday}>
                <span className="digest-range">
                  {dotted(w.monday)} ~ {dotted(w.sunday)}
                </span>
                <span>
                  <span aria-hidden="true">{weather(w.count)}</span>{" "}
                  {w.stories.length > 0
                    ? `${w.stories.map((s) => `「${clip(textOf(s.headline).replace(/\s*-\s*[^-]+$/, ""))}」(${s.sources}곳)`).join(", ")} 등이 이번 주 가장 많이 보도되었다.`
                    : `기사 ${w.count}건을 모았다.`}
                  <em> · 기사 {w.count.toLocaleString()}건</em>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="digest-section">
          <h2>소스별 모아보기</h2>
          <div className="digest-chips">
            {bySource.map((s) => (
              <Link key={s.label} href={s.href} className={`digest-chip ${s.tone}`}>
                {s.label} <b>{s.n.toLocaleString()}</b>
              </Link>
            ))}
          </div>
        </section>

        <section className="digest-section">
          <h2>주제별 모아보기</h2>
          <div className="digest-chips">
            {byField.map((f) => (
              <Link key={f.id} href={`/trends/${days[0]?.date}?tag=${encodeURIComponent(f.label)}`} className="digest-chip">
                <span aria-hidden="true">{FIELD_ICON[f.id] ?? "•"}</span> {f.label} <b>{f.n.toLocaleString()}</b>
              </Link>
            ))}
          </div>
        </section>

        <section className="digest-section">
          <h2>
            <Link href="/rodong">최근 노동신문 브리핑 →</Link>
          </h2>
          <ul className="digest-weeks">
            {RODONG_DAYS.slice(0, 5).map((d) => (
              <li key={d.date}>
                <span className="digest-range">{dotted(d.date)}</span>
                <Link href={`/rodong/${d.date}`}>{d.overview}</Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="digest-section">
          <h2>날짜별 동향</h2>
          <ul className="digest-days">
            {days.map((d) => (
              <li key={d.date}>
                <Link href={`/trends/${d.date}`}>
                  {dotted(d.date)} <b>{d.items.length.toLocaleString()}건</b>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
