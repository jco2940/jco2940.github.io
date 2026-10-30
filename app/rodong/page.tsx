import type { Metadata } from "next";
import Link from "next/link";
import { PROFILE } from "../../site.config";
import { PublicHeader } from "../archive/public-header";
import { DAYS, FIELDS, formatDate } from "./data";
import { EmptyNote } from "./components";
import weekly from "../data/rodong-weekly.json";
import { MONTHS, monthLabel } from "./monthly/report";

export const metadata: Metadata = { title: `노동신문 브리핑 | ${PROFILE.name}` };

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

export default function RodongPage() {
  const issues = DAYS.flatMap((d) => d.items);
  // 주간 하이라이트: app/data/rodong-weekly.json 에 쓴 한 주 요약. 없는 주는 그 주 첫 브리핑의 요약을 보여 준다
  const weeks = [...new Set(DAYS.map((d) => mondayOf(d.date)))].sort().reverse();
  const written = new Map((weekly as { week: string; summary: string }[]).map((w) => [w.week, w.summary]));
  const pages = new Map<number, number>();
  issues.forEach((i) => i.sources.forEach((s) => s.page && pages.set(s.page, (pages.get(s.page) ?? 0) + 1)));

  return (
    <main className="digest">
      <PublicHeader current="/rodong" title="노동신문 브리핑" badge="Rodong Sinmun Daily" tone="rodong">
        『로동신문』 6면을 매일 읽고 {FIELDS.map((f) => f.label).join("·")} 분야로 정리한 브리핑 (총 {DAYS.length}일치 {issues.length}건) by 통일연구원{" "}
        <Link href="/">{PROFILE.name}</Link>
      </PublicHeader>

      <div className="digest-inner">
        {DAYS.length === 0 ? (
          <EmptyNote />
        ) : (
          <>
            <section className="digest-section">
              <h2>
                <Link href={`/rodong/${DAYS[0].date}`}>주간 하이라이트 →</Link>
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
              <h2>
                <Link href="/rodong/monthly">월별 리포트 →</Link>
              </h2>
              <p className="mr-method" style={{ marginTop: 0 }}>
                교육·여성·청(소)년·장애인·보건의료 분야 기사를 달마다 주제·날짜·지면별로 집계하고 해석합니다.{" "}
                {MONTHS.map((m, i) => (
                  <span key={m}>
                    {i > 0 && " · "}
                    <Link href={`/rodong/monthly/${m}`} className="digest-monthly-link">
                      {monthLabel(m)}
                    </Link>
                  </span>
                ))}
              </p>
            </section>

            <section className="digest-section">
              <h2>분야별 모아보기</h2>
              <div className="digest-chips">
                {FIELDS.map((f) => ({ ...f, n: issues.filter((i) => i.field === f.id).length }))
                  .filter((f) => f.n > 0)
                  .sort((a, b) => b.n - a.n)
                  .map((f) => (
                    <Link key={f.id} href={`/rodong/field/${f.id}`} className="digest-chip">
                      <span aria-hidden="true">{FIELD_ICON[f.id] ?? "•"}</span> {f.label} <b>{f.n}</b>
                    </Link>
                  ))}
              </div>
            </section>

            <section className="digest-section">
              <h2>면별 모아보기</h2>
              <div className="digest-chips">
                {[...pages]
                  .sort((a, b) => a[0] - b[0])
                  .map(([p, n]) => (
                    <span key={p} className="digest-chip chip-rodong">
                      {p}면 <b>{n}</b>
                    </span>
                  ))}
              </div>
            </section>

            <section className="digest-section">
              <h2>날짜별 브리핑</h2>
              <ul className="digest-weeks">
                {DAYS.map((day) => (
                  <li key={day.date}>
                    <span className="digest-range">{formatDate(day.date)}</span>
                    <Link href={`/rodong/${day.date}`}>
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
      </div>
    </main>
  );
}
