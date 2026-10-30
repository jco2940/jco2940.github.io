import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PROFILE } from "../../../../site.config";
import { PublicHeader } from "../../../archive/public-header";
import { REPORTS, fillReport, reportStats, type Stats } from "../report-data";

export const dynamicParams = false;

export function generateStaticParams() {
  return REPORTS.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const r = REPORTS.find((x) => x.slug === slug);
  return { title: `${r?.short ?? "종합 리포트"} | ${PROFILE.name}`, description: r?.lead };
}

const mLabel = (m: string) => `${Number(m.slice(5))}월`;
const md = (date: string) => `${Number(date.slice(5, 7))}.${Number(date.slice(8))}`;
const addDay = (d: string) => new Date(Date.parse(`${d}T00:00:00Z`) + 864e5).toISOString().slice(0, 10);

// 달별로 짝지은 막대. 1번째 달은 파랑, 2번째 달은 주황
function PairBars({ s, rows }: { s: Stats; rows: { label: string; values: number[] }[] }) {
  const max = Math.max(1, ...rows.flatMap((r) => r.values));
  return (
    <>
      <p className="rp-legend">
        {s.months.map((m, i) => (
          <span key={m}>
            <i className={`rp-sw m${i}`} />
            {mLabel(m)}
          </span>
        ))}
      </p>
      <ul className="rp-pairs">
        {rows.map((r) => (
          <li key={r.label}>
            <span>{r.label}</span>
            <span className="rp-pbars">
              {r.values.map((v, i) => (
                <span key={i} className="rp-pbar" title={`${r.label} · ${mLabel(s.months[i])} ${v}건`}>
                  <i className={`m${i}`} style={{ width: `${(v / max) * 85}%` }} />
                  {v}
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

export default async function RodongReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = REPORTS.find((x) => x.slug === slug);
  if (!r) notFound();
  const s = reportStats(r);
  const fill = (t: string) => fillReport(t, s);
  const [a, b] = s.perMonth;

  const dates: string[] = [];
  for (let d = r.from; d <= r.to; d = addDay(d)) dates.push(d);
  const dmax = Math.max(1, ...s.byDate.values());
  const sumRange = (from: string, to: string) => [...s.byDate].filter(([d]) => d >= from && d <= to).reduce((n, [, v]) => n + v, 0);

  const topicNames = [...new Set(s.perMonth.flatMap((p) => [...p.topics.keys()]))].sort(
    (x, y) => s.perMonth.reduce((n, p) => n + (p.topics.get(y) ?? 0), 0) - s.perMonth.reduce((n, p) => n + (p.topics.get(x) ?? 0), 0),
  );
  const top = (p: (typeof s.perMonth)[number]) => [...p.topics].sort((x, y) => y[1] - x[1])[0];
  const topPages = (p: (typeof s.perMonth)[number]) =>
    [...p.pages].sort((x, y) => y[1] - x[1]).slice(0, 2).map(([pg, n]) => `${pg}면 ${n}`).join(", ");
  const cmp: [string, string | number, string | number, boolean][] = a && b ? [
    ["항목", a.items, b.items, true],
    ["근거 기사", a.articles, b.articles, true],
    ["게재일", `${a.days}일`, `${b.days}일`, false],
    ["전체 항목 중 비중", `${a.share}%`, `${b.share}%`, false],
    ["분야 순위", `${a.rank}위`, `${b.rank}위`, false],
    ["기사 기준 1위 주제", `${top(a)[0]} ${top(a)[1]}`, `${top(b)[0]} ${top(b)[1]}`, false],
    ["많이 실린 면", topPages(a), topPages(b), false],
  ] : [];

  return (
    <main className="digest">
      <PublicHeader current="/rodong" title={r.short} badge={r.kind} tone="rodong">
        {md(r.from)}~{md(r.to)} 노동신문 브리핑 종합 · by 통일연구원 <Link href="/">{PROFILE.name}</Link> ·{" "}
        <Link href="/rodong/monthly">월별 리포트</Link> · <Link href={`/rodong/focus/${r.focus}`}>심층 해석</Link>
      </PublicHeader>
      <div className="digest-inner">
        <section className="digest-section">
          <h2 className="rp-title">{r.title}</h2>
          <p className="mr-lead">{fill(r.lead)}</p>
          <div className="mr-kpis rp-kpis">
            <div className="mr-kpi"><span>항목</span><b>{s.items.length}</b><small>브리핑에서 정리한 이슈</small></div>
            <div className="mr-kpi"><span>근거 기사</span><b>{s.sources.length}</b><small>노동신문 기사 수</small></div>
            <div className="mr-kpi"><span>게재일</span><b>{new Set(s.items.map((i) => i.date)).size}</b><small>브리핑 {s.days.length}일 중</small></div>
            <div className="mr-kpi"><span>전체 항목 중 비중</span><b>{s.all ? Math.round((s.items.length / s.all) * 1000) / 10 : 0}%</b><small>전체 {s.all}건 기준</small></div>
          </div>
        </section>

        <section className="digest-section">
          <h2>핵심 정리</h2>
          <ol className="rp-keys">
            {r.keys.map((k) => (
              <li key={k.head}>
                <b>{k.head}</b> {fill(k.body)}
              </li>
            ))}
          </ol>
        </section>

        <section className="digest-section">
          <h2>월별 추이</h2>
          {cmp.length > 0 && (
            <div className="mr-scroll">
              <table className="mr-table">
                <thead>
                  <tr><th /><th>{mLabel(a.month)}</th><th>{mLabel(b.month)}</th><th>변화</th></tr>
                </thead>
                <tbody>
                  {cmp.map(([k, x, y, num]) => (
                    <tr key={k}>
                      <th>{k}</th><td>{x}</td><td>{y}</td>
                      <td>{num ? `${Number(y) - Number(x) > 0 ? "+" : ""}${Number(y) - Number(x)}` : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mr-panel rp-panel">
            <h3>날짜별 기사 수 ({md(r.from)} ~ {md(r.to)})</h3>
            <div className="rp-daily-wrap">
              <div className="rp-phases" style={{ gridTemplateColumns: `repeat(${dates.length}, minmax(0, 1fr))` }}>
                {r.phases.map((p, i) => (
                  <span key={p.title} className={i % 2 ? "" : "band"} style={{ gridColumn: `${dates.indexOf(p.from) + 1} / ${dates.indexOf(p.to) + 2}` }}>
                    {p.title}
                  </span>
                ))}
              </div>
              <div className="rp-daily" style={{ gridTemplateColumns: `repeat(${dates.length}, minmax(0, 1fr))` }}>
                {dates.map((d) => {
                  const v = s.byDate.get(d) ?? 0;
                  const m = s.months.indexOf(d.slice(0, 7));
                  return (
                    <Link key={d} href={`/rodong/${d}`} title={`${md(d)} · ${v}건`} className="rp-col">
                      <i className={`m${m}`} style={{ height: `${(v / dmax) * 100}%` }} />
                      <small>{d.slice(8) === "01" || Number(d.slice(8)) % 10 === 0 ? md(d) : ""}</small>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mr-grid">
            <div className="mr-panel">
              <h3>세부 주제별 기사 수</h3>
              <PairBars s={s} rows={topicNames.map((t) => ({ label: t, values: s.perMonth.map((p) => p.topics.get(t) ?? 0) }))} />
            </div>
            <div className="mr-panel">
              <h3>지면 배치 (기사 기준)</h3>
              <PairBars s={s} rows={[1, 2, 3, 4, 5, 6].map((pg) => ({ label: `${pg}면`, values: s.perMonth.map((p) => p.pages.get(pg) ?? 0) }))} />
              <p className="mr-method">대체로 1면 최고지도자 동정·사설, 2면 연설·논설·정론, 3면 당·경제 조직사업, 4~5면 부문 소식·기획, 6면 생활·사례·국제 기사.</p>
            </div>
          </div>
        </section>

        <section className="digest-section">
          <h2>국면</h2>
          <div className="rp-phase-cards">
            {r.phases.map((p) => (
              <div key={p.title} className="mr-panel">
                <small className="rp-range">{md(p.from)} ~ {md(p.to)}</small>
                <h3 className="rp-phase-title">{p.title}</h3>
                <p>
                  기사 <b>{sumRange(p.from, p.to)}</b>건. {p.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="digest-section">
          <h2>
            <Link href={`/rodong/focus/${r.focus}`}>쟁점별 해석 →</Link>
          </h2>
          <p className="mr-method" style={{ margin: "0 0 12px" }}>건수는 심층 해석의 쟁점별 보도 흐름에 정리한 날짜 수입니다. 한 날짜가 여러 쟁점에 들어갈 수 있습니다.</p>
          <div className="rp-issues">
            {r.issues.map((it) => {
              const t = s.themes.find((x) => x.title.startsWith(it.theme.split(" ")[0]));
              return (
                <article key={it.theme} className="mr-panel">
                  <h3 className="rp-phase-title">
                    {it.theme}
                    {t && <small> {t.perMonth.map((n, i) => `${mLabel(s.months[i])} ${n}`).join(" → ")}</small>}
                  </h3>
                  <p>{it.body}</p>
                  <p className="mr-method">{it.evidence}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="digest-section">
          <h2>종합 해석</h2>
          <div className="fc-reading">
            {r.synthesis.map((n) => (
              <div key={n.head} className="fc-note">
                <h4>{n.head}</h4>
                <p>{fill(n.body)}</p>
              </div>
            ))}
            <h3>앞으로 볼 지점</h3>
            <ul className="fc-watch">
              {r.watch.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
          <p className="mr-method">{r.caveats}</p>
        </section>
      </div>
    </main>
  );
}
