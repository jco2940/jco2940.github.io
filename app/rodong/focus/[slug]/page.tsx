import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PROFILE } from "../../../../site.config";
import { PublicHeader } from "../../../archive/public-header";
import { DAYS } from "../../data";
import { FOCUS, FocusTrend, Timeline } from "../trend";

export const dynamicParams = false;

export function generateStaticParams() {
  return FOCUS.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const f = FOCUS.find((x) => x.slug === slug);
  return { title: `${f?.title ?? "심층 해석"} | ${PROFILE.name}`, description: f?.lead };
}

const briefed = new Set(DAYS.map((d) => d.date));

export default async function RodongFocusPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const f = FOCUS.find((x) => x.slug === slug);
  if (!f) notFound();

  return (
    <main className="digest">
      <PublicHeader current="/rodong" title={f.title} badge="Focus" tone="rodong">
        {f.subtitle} · by 통일연구원 <Link href="/">{PROFILE.name}</Link> · <Link href="/rodong/monthly">월별 리포트</Link> ·{" "}
        <Link href="/rodong">일일 브리핑</Link>
      </PublicHeader>
      <div className="digest-inner">
        <section className="digest-section">
          <p className="mr-lead">{f.lead}</p>
          <h2 className="ft-title">주제별 보도 추이</h2>
          <FocusTrend f={f} />
          <p className="ft-jump">
            <a href="#synthesis">종합 해석으로 →</a>
          </p>
        </section>

        {f.themes.map((t) => {
          const sep = t.timeline.filter((e) => e.date.startsWith("2026-09")).length;
          return (
            <section key={t.id} id={t.id} className="digest-section mr-field">
              <h2>
                {t.title}
                <small>
                  관련 보도 {t.timeline.length}일치 (9월 {sep} · 10월 {t.timeline.length - sep})
                </small>
              </h2>
              <p className="fc-question">{t.question}</p>
              <div className="fc-grid">
                <div className="fc-reading">
                  <h3>해석</h3>
                  {t.reading.map((r) => (
                    <div key={r.head} className="fc-note">
                      <h4>{r.head}</h4>
                      <p>{r.body}</p>
                    </div>
                  ))}
                  <h3>앞으로 볼 지점</h3>
                  <ul className="fc-watch">
                    {t.watch.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </div>
                <div className="mr-panel">
                  <h3>보도 흐름 (최근 달 펼침)</h3>
                  <Timeline t={t} briefed={briefed} />
                </div>
              </div>
            </section>
          );
        })}

        <section id="synthesis" className="digest-section mr-field">
          <h2>종합</h2>
          <div className="fc-reading">
            {f.synthesis.map((r) => (
              <div key={r.head} className="fc-note">
                <h4>{r.head}</h4>
                <p>{r.body}</p>
              </div>
            ))}
          </div>
          <p className="mr-method">{f.caveats}</p>
        </section>
      </div>
    </main>
  );
}
