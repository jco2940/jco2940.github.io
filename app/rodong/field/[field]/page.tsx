import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageIntro } from "../../../components";
import { PROFILE } from "../../../../site.config";
import { DAYS, FIELDS, formatDate, type FieldId } from "../../data";
import { EmptyNote, FieldNav, IssueItem } from "../../components";
import { ArchiveNav } from "../../../archive/nav";

export const dynamicParams = false;

export function generateStaticParams() {
  return FIELDS.map((f) => ({ field: f.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ field: string }> }): Promise<Metadata> {
  const { field } = await params;
  const label = FIELDS.find((f) => f.id === field)?.label;
  return { title: `노동신문 브리핑 · ${label} | ${PROFILE.name}` };
}

export default async function RodongFieldPage({ params }: { params: Promise<{ field: string }> }) {
  const { field } = await params;
  const meta = FIELDS.find((f) => f.id === field);
  if (!meta) notFound();

  const days = DAYS.map((day) => ({ ...day, items: day.items.filter((i) => i.field === field) })).filter(
    (day) => day.items.length > 0,
  );

  return (
    <main className="inner-page">
      <ArchiveNav />
      <PageIntro eyebrow="RODONG SINMUN BRIEFING" title={`노동신문 브리핑 · ${meta.label}`} lead={`${meta.label} 분야 이슈를 날짜순으로 모았습니다.`} />
      <FieldNav current={meta.id as FieldId} />
      {days.length === 0 ? (
        <EmptyNote />
      ) : (
        days.map((day) => (
          <section key={day.date} className="about-section">
            <h2>
              <Link href={`/rodong/${day.date}`}>{formatDate(day.date)}</Link>
            </h2>
            <ul className="issue-list">
              {day.items.map((issue) => (
                <IssueItem key={issue.title} issue={issue} />
              ))}
            </ul>
          </section>
        ))
      )}
    </main>
  );
}
