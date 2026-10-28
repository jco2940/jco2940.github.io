import type { Metadata } from "next";
import Link from "next/link";
import { PROFILE } from "../../site.config";
import { PublicHeader } from "../archive/public-header";
import { DAYS, FIELDS, formatDate } from "./data";
import { EmptyNote } from "./components";
import weekly from "../data/kcna-weekly.json";
import { trendDays } from "../trends/data";
import { textOf } from "../trends/top";
import { countryName } from "../archive/countries";

// 국내외 언론이 조선중앙통신을 인용한 기사(북한 이슈 동향 수집분에서 찾는다)
const CITES = /조선중앙통신|조선중앙TV|KCNA|朝中社|朝鮮中央通信|ЦТАК/i;

export const metadata: Metadata = { title: `조선중앙통신 브리핑 | ${PROFILE.name}` };

const FIELD_ICON: Record<string, string> = {
  politics: "🏛️",
  economy: "📈",
  society: "🏘️",
  women: "👩",
  education: "🎓",
  youth: "🧒",
  health: "🏥",
  disability: "♿",
  climate: "🌏",
};

const dotted = (d: string) => d.replaceAll("-", ".").replace(/\.0(\d)/g, ".$1");
const mondayOf = (date: string) => {
  const t = new Date(`${date}T00:00:00Z`);
  return new Date(t.getTime() - ((t.getUTCDay() + 6) % 7) * 864e5).toISOString().slice(0, 10);
};
const addDays = (date: string, n: number) => new Date(Date.parse(`${date}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
// 기사 수로 그 주의 '날씨'를 붙인다
const weather = (n: number) => (n >= 40 ? "⛈️" : n >= 25 ? "🌧️" : n >= 10 ? "⛅" : "🌤️");

export default function KcnaPage() {
  const issues = DAYS.flatMap((d) => d.items);
  // 주간 하이라이트: a../data/kcna-weekly.json 에 쓴 한 주 요약. 없는 주는 그 주 첫 브리핑의 요약을 보여 준다
  const weeks = [...new Set(DAYS.map((d) => mondayOf(d.date)))].sort().reverse();
  const written = new Map((weekly as { week: string; summary: string }[]).map((w) => [w.week, w.summary]));
  const cited = trendDays()
    .slice(0, 7)
    .flatMap((d) => d.items.map((a) => ({ ...a, date: d.date })))
    .filter((a) => CITES.test(`${a.title} ${a.summary ?? ""}`));

  return (
    <main className="digest">
      <PublicHeader current="/kcna" title="조선중앙통신 브리핑" badge="KCNA Daily" tone="kcna">
        조선중앙통신 보도를 매일 읽고 {FIELDS.map((f) => f.label).join("·")} 분야로 정리한 브리핑 (총 {DAYS.length}일치 {issues.length}건) by 통일연구원{" "}
        <Link href="/">{PROFILE.name}</Link>
      </PublicHeader>

      <div className="digest-inner">
        {DAYS.length === 0 ? (
          <EmptyNote />
        ) : (
          <>
            <section className="digest-section">
              <h2>
                <Link href={`/kcna/${DAYS[0].date}`}>주간 하이라이트 →</Link>
              </h2>
              <ul className="digest-weeks">
                {weeks.map((w) => {
                  const days = DAYS.filter((d) => mondayOf(d.date) === w);
                  const n = days.reduce((s, d) => s + d.items.length, 0);
                  return (
                    <li key={w}>
                      <span className="digest-range">
                        {dotted(w)} ~ {dotted(addDays(w, 6))}
                      </span>
                      <span>
                        <span aria-hidden="true">{weather(n)}</span> {written.get(w) ?? days[days.length - 1].overview}
                        <em> · {days.length}일치 {n}건</em>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="digest-section">
              <h2>분야별 모아보기</h2>
              <div className="digest-chips">
                {FIELDS.map((f) => ({ ...f, n: issues.filter((i) => i.field === f.id).length }))
                  .filter((f) => f.n > 0)
                  .sort((a, b) => b.n - a.n)
                  .map((f) => (
                    <Link key={f.id} href={`/kcna/field/${f.id}`} className="digest-chip">
                      <span aria-hidden="true">{FIELD_ICON[f.id] ?? "•"}</span> {f.label} <b>{f.n}</b>
                    </Link>
                  ))}
              </div>
            </section>


            <section className="digest-section">
              <h2>날짜별 브리핑</h2>
              <ul className="digest-weeks">
                {DAYS.map((day) => (
                  <li key={day.date}>
                    <span className="digest-range">{formatDate(day.date)}</span>
                    <Link href={`/kcna/${day.date}`}>
                      <span className="kind">
                        {FIELDS.map((f) => [f.label, day.items.filter((i) => i.field === f.id).length] as const)
                          .filter(([, n]) => n > 0)
                          .map(([label, n]) => `${label} ${n}`)
                          .join(" · ")}
                      </span>
                      <br />
                      {day.overview}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        <section className="digest-section">
          <h2>국내외 언론이 인용한 조선중앙통신 보도 <small className="muted">최근 7일 · {cited.length}건</small></h2>
          {cited.length === 0 ? (
            <p className="muted">최근 7일 동안 수집된 인용 기사가 없습니다.</p>
          ) : (
            <ul className="digest-weeks">
              {cited.slice(0, 40).map((a) => (
                <li key={`${a.country}:${a.id}`}>
                  <span className="digest-range">
                    {dotted(a.date)} · {countryName(a.country)}
                  </span>
                  <a href={a.url} target="_blank" rel="noopener noreferrer">
                    {textOf(a)} <em>· {a.source}</em>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
