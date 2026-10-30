import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PROFILE } from "../../../../site.config";
import { PublicHeader } from "../../../archive/public-header";
import { topicOf } from "../../data";
import { MONTHS, REPORT_FIELDS, daysInMonth, fieldStat, monthDays, monthLabel, monthLead, type FieldStat } from "../report";

export const dynamicParams = false;

export function generateStaticParams() {
  return MONTHS.map((month) => ({ month }));
}

export async function generateMetadata({ params }: { params: Promise<{ month: string }> }): Promise<Metadata> {
  const { month } = await params;
  return { title: `노동신문 월별 리포트 ${monthLabel(month)} | ${PROFILE.name}`, description: monthLead(month) };
}

const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

function Bars({ rows, total, unit }: { rows: [string, number][]; total: number; unit: string }) {
  const max = Math.max(1, ...rows.map(([, n]) => n));
  return (
    <ul className="mr-bars">
      {rows.map(([label, n]) => (
        <li key={label} title={`${label} ${n}${unit} (${pct(n, total)}%)`}>
          <span className="mr-bar-label">{label}</span>
          <span className="mr-bar-track">
            <span className="mr-bar-fill" style={{ width: `${(n / max) * 100}%` }} />
          </span>
          <span className="mr-bar-value">
            {n}
            <small> {pct(n, total)}%</small>
          </span>
        </li>
      ))}
    </ul>
  );
}

// 그달 날짜별 항목 수. 브리핑이 없는 날은 빗금으로 구분한다
function DayStrip({ stat, month, briefed }: { stat: FieldStat; month: string; briefed: Set<number> }) {
  const n = daysInMonth(month);
  return (
    <div className="mr-days" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
      {Array.from({ length: n }, (_, i) => i + 1).map((d) => {
        const v = stat.byDay.get(d) ?? 0;
        const has = briefed.has(d);
        const date = `${month}-${String(d).padStart(2, "0")}`;
        const cell = (
          <span className={`mr-day ${has ? `lv${Math.min(v, 3)}` : "none"}`} title={`${Number(month.slice(5))}월 ${d}일 · ${has ? `${v}건` : "브리핑 없음"}`}>
            {d % 5 === 0 || d === 1 ? <i>{d}</i> : null}
          </span>
        );
        return has && v ? (
          <Link key={d} href={`/rodong/${date}`}>
            {cell}
          </Link>
        ) : (
          <span key={d}>{cell}</span>
        );
      })}
    </div>
  );
}

export default async function RodongMonthlyPage({ params }: { params: Promise<{ month: string }> }) {
  const { month } = await params;
  if (!MONTHS.includes(month)) notFound();
  const days = monthDays(month);
  const briefed = new Set(days.map((d) => Number(d.date.slice(8))));
  const prev = MONTHS[MONTHS.indexOf(month) + 1];
  const next = MONTHS[MONTHS.indexOf(month) - 1];
  const stats = REPORT_FIELDS.map((f) => fieldStat(month, f));
  const prevStats = prev ? new Map<string, number>(REPORT_FIELDS.map((f) => [f, fieldStat(prev, f).issues.length])) : undefined;
  const span = `${Number(days[0].date.slice(8))}~${Number(days[days.length - 1].date.slice(8))}일`;

  return (
    <main className="digest">
      <PublicHeader current="/rodong" title={`노동신문 월별 리포트 · ${monthLabel(month)}`} badge="Monthly Report" tone="rodong">
        {monthLabel(month)} {span} 브리핑 {days.length}일치에서 교육·여성·청(소)년·장애인·보건의료 분야를 집계했습니다. by 통일연구원{" "}
        <Link href="/">{PROFILE.name}</Link> · <Link href="/rodong/monthly">월별 리포트 목록</Link> · <Link href="/rodong">일일 브리핑</Link>
      </PublicHeader>

      <div className="digest-inner">
        <section className="digest-section">
          {monthLead(month) && <p className="mr-lead">{monthLead(month)}</p>}
          <div className="mr-kpis">
            {stats.map((s) => {
              const before = prevStats?.get(s.id);
              const diff = before === undefined ? undefined : s.issues.length - before;
              return (
                <a key={s.id} href={`#${s.id}`} className="mr-kpi">
                  <span>{s.label}</span>
                  <b>{s.issues.length}</b>
                  <small>
                    기사 {s.articles}건 · {s.days}일
                    {diff !== undefined && ` · 전월 대비 ${diff > 0 ? "+" : ""}${diff}`}
                  </small>
                </a>
              );
            })}
          </div>
          <p className="mr-method">
            '항목'은 브리핑에서 하나로 정리한 이슈, '기사'는 그 근거로 단 노동신문 기사 수입니다. 브리핑은 분야마다 하루 0~3개 항목만 고르므로
            지면 전체를 센 것은 아닙니다. 세부 주제는 근거 기사마다 하나씩 직접 분류해, 주제별 그래프와 해석의 주제 건수는 기사 기준입니다.
          </p>
        </section>

        {stats.map((s) => (
          <section key={s.id} id={s.id} className="digest-section mr-field">
            <h2>
              <Link href={`/rodong/field/${s.id}`}>{s.label}</Link>
              <small>
                항목 {s.issues.length} · 기사 {s.articles} · 게재일 {s.days}일
              </small>
            </h2>
            {s.analysis && (
              <div className="mr-analysis">
                <p>{s.analysis.summary}</p>
                <ul>
                  {s.analysis.findings.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
            {s.id === "education" && (
              <p className="mr-method" style={{ margin: "0 0 14px" }}>
                교원·지역 교육격차·교육강령 실행·학생용품 생산·교육후원은{" "}
                <Link href="/rodong/focus/education-2026-autumn" className="digest-monthly-link">
                  심층 해석 →
                </Link>
                에서 따로 다룹니다.
              </p>
            )}
            {s.issues.length > 0 && (
              <div className="mr-grid">
                <div className="mr-panel">
                  <h3>세부 주제별 기사 수 (근거 기사 {s.articles}건 기준)</h3>
                  <Bars rows={s.topics} total={s.articles} unit="건" />
                </div>
                <div className="mr-panel">
                  <h3>날짜별 게재</h3>
                  <DayStrip stat={s} month={month} briefed={briefed} />
                  <p className="mr-legend">
                    <span className="mr-day lv1" /> 1건 <span className="mr-day lv2" /> 2건 <span className="mr-day lv3" /> 3건 이상{" "}
                    <span className="mr-day none" /> 브리핑 없음
                  </p>
                  <h3>지면 배치 (기사 기준)</h3>
                  <Bars rows={s.byPage.map(([p, n]) => [`${p}면`, n])} total={s.articles} unit="건" />
                </div>
              </div>
            )}
            {s.issues.length > 0 && (
              <details className="mr-list">
                <summary>항목 목록 {s.issues.length}건</summary>
                <ul>
                  {s.issues.map((i) => (
                    <li key={i.date + i.title}>
                      <Link href={`/rodong/${i.date}`}>{Number(i.date.slice(5, 7))}.{Number(i.date.slice(8))}</Link>
                      <span className="kind">{topicOf(i)}</span>
                      {i.title}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>
        ))}

        <nav className="mr-pager">
          {prev ? <Link href={`/rodong/monthly/${prev}`}>← {monthLabel(prev)}</Link> : <span />}
          {next ? <Link href={`/rodong/monthly/${next}`}>{monthLabel(next)} →</Link> : <span />}
        </nav>
      </div>
    </main>
  );
}
