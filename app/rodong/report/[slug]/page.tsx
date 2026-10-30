import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PROFILE } from "../../../../site.config";
import { PublicHeader } from "../../../archive/public-header";
import { REPORTS, fillReport, period, reportStats, type Stats } from "../report-data";
import { topicOf } from "../../data";

export const dynamicParams = false;

export function generateStaticParams() {
  return REPORTS.flatMap((r) => [r.slug, ...(r.aliases ?? [])].map((slug) => ({ slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const r = REPORTS.find((x) => x.slug === slug || x.aliases?.includes(slug));
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
  const r = REPORTS.find((x) => x.slug === slug || x.aliases?.includes(slug));
  if (!r) notFound();
  const s = reportStats(r);
  const fill = (t: string) => fillReport(t, s);
  // 직접 정한 국면 뒤로 새 브리핑이 쌓이면 '이후 보도' 국면을 자동으로 붙인다
  const lastPhase = r.phases.at(-1);
  const after = lastPhase && lastPhase.to < s.to ? addDay(lastPhase.to) : undefined;
  const afterTopics = after
    ? [...s.sources.filter((x) => x.date >= after).reduce((m, x) => m.set(x.topic, (m.get(x.topic) ?? 0) + 1), new Map<string, number>())].sort((x, y) => y[1] - x[1]).slice(0, 3)
    : [];
  const phases = after
    ? [...r.phases, { from: after, to: s.to, title: "이후 보도 (자동)", text: afterTopics.length ? `많이 다뤄진 주제: ${afterTopics.map(([t, n]) => `${t} ${n}`).join(", ")}.` : "교육 기사가 아직 없다." }]
    : r.phases;
  const last = s.perMonth.at(-1);
  const prev = s.perMonth.at(-2);
  const recentDays = s.days.slice(-7).map((d) => d.date);
  const recent = s.items.filter((i) => recentDays.includes(i.date)).reverse();

  const dates: string[] = [];
  for (let d = r.from; d <= s.to; d = addDay(d)) dates.push(d);
  const dmax = Math.max(1, ...s.byDate.values());
  const sumRange = (from: string, to: string) => [...s.byDate].filter(([d]) => d >= from && d <= to).reduce((n, [, v]) => n + v, 0);

  const topicNames = [...new Set(s.perMonth.flatMap((p) => [...p.topics.keys()]))].sort(
    (x, y) => s.perMonth.reduce((n, p) => n + (p.topics.get(y) ?? 0), 0) - s.perMonth.reduce((n, p) => n + (p.topics.get(x) ?? 0), 0),
  );
  const top = (p: (typeof s.perMonth)[number]) => [...p.topics].sort((x, y) => y[1] - x[1])[0];
  const topPages = (p: (typeof s.perMonth)[number]) =>
    [...p.pages].sort((x, y) => y[1] - x[1]).slice(0, 2).map(([pg, n]) => `${pg}면 ${n}`).join(", ");
  const row = (label: string, f: (p: (typeof s.perMonth)[number]) => string | number, num = false) => ({ label, cells: s.perMonth.map(f), num });
  const cmp = [
    row("항목", (p) => p.items, true),
    row("근거 기사", (p) => p.articles, true),
    row("게재일", (p) => `${p.days}일 / ${p.briefed}`),
    row("전체 항목 중 비중", (p) => `${p.share}%`),
    row("분야 순위", (p) => `${p.rank}위`),
    row("기사 기준 1위 주제", (p) => (top(p) ? `${top(p)[0]} ${top(p)[1]}` : "-")),
    row("많이 실린 면", (p) => topPages(p) || "-"),
  ];

  return (
    <main className="digest">
      <PublicHeader current="/rodong" title={`${r.short} (${r.from.slice(0, 4)}년 ${Number(r.from.slice(5, 7))}월~)`} badge={r.kind} tone="rodong">
        {period(r.from, s.to)} 노동신문 브리핑 {s.days.length}일치 종합 · 새 브리핑이 올라오면 자동 갱신 · by 통일연구원 <Link href="/">{PROFILE.name}</Link> ·{" "}
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
          <div className="mr-scroll">
            <table className="mr-table">
              <thead>
                <tr>
                  <th />
                  {s.months.map((m) => (
                    <th key={m}>{mLabel(m)}</th>
                  ))}
                  <th>전월 대비</th>
                </tr>
              </thead>
              <tbody>
                {cmp.map((c) => (
                  <tr key={c.label}>
                    <th>{c.label}</th>
                    {c.cells.map((v, i) => (
                      <td key={i}>{v}</td>
                    ))}
                    <td>
                      {c.num && c.cells.length > 1
                        ? `${Number(c.cells.at(-1)) - Number(c.cells.at(-2)) > 0 ? "+" : ""}${Number(c.cells.at(-1)) - Number(c.cells.at(-2))}`
                        : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mr-panel rp-panel">
            <h3>날짜별 기사 수 ({md(r.from)} ~ {md(s.to)})</h3>
            <div className="rp-daily-wrap" style={{ ["--rp-min" as string]: `${Math.max(620, dates.length * 11)}px` }}>
              <div className="rp-phases" style={{ gridTemplateColumns: `repeat(${dates.length}, minmax(0, 1fr))` }}>
                {phases.map((p, i) => (
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
          <h2>최근 보도 (자동 갱신)</h2>
          {last && (
            <p className="mr-lead" style={{ fontSize: ".84rem" }}>
              {mLabel(last.month)}({last.briefed}일치 반영{last.briefed < new Date(Date.UTC(Number(last.month.slice(0, 4)), Number(last.month.slice(5)), 0)).getUTCDate() ? ", 집계 진행 중" : ""}): 항목 {last.items}건
              {prev && ` (전월 ${prev.items}건)`}, 근거 기사 {last.articles}건, 게재일 {last.days}일
              {top(last) && `, 기사 기준 1위 주제는 ${top(last)[0]}(${top(last)[1]}건)`}이다.
            </p>
          )}
          <ul className="mr-list-plain">
            {recent.map((i) => (
              <li key={i.date + i.title}>
                <Link href={`/rodong/${i.date}`}>{md(i.date)}</Link>
                <span className="kind">{topicOf(i)}</span>
                {i.title}
              </li>
            ))}
          </ul>
          <p className="mr-method">최근 브리핑 7일치의 교육 항목입니다. 새 브리핑을 올리면 이 절과 위의 수치·그래프가 함께 바뀝니다.</p>
        </section>

        <section className="digest-section">
          <h2>국면</h2>
          <div className="rp-phase-cards">
            {phases.map((p) => (
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
