import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PROFILE } from "../../../site.config";
import { DAYS, FIELDS, formatDate } from "../data";
import { IssueItem } from "../components";
import { ArchiveNav } from "../../archive/nav";

// 정적 내보내기는 빈 목록을 허용하지 않아, 브리핑이 없을 때는 404가 되는 자리표시 경로 하나를 만든다
const EMPTY = "none";

export const dynamicParams = false;

export function generateStaticParams() {
  return DAYS.length ? DAYS.map((day) => ({ date: day.date })) : [{ date: EMPTY }];
}

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }): Promise<Metadata> {
  const { date } = await params;
  const day = DAYS.find((d) => d.date === date);
  return { title: day ? `조선중앙통신 브리핑 ${formatDate(date)} | ${PROFILE.name}` : PROFILE.name, description: day?.overview };
}

export default async function KcnaDayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const day = DAYS.find((d) => d.date === date);
  if (!day) notFound();

  return (
    <main className="inner-page">
      <ArchiveNav />
      <article className="post rodong-day">
        <p className="eyebrow">
          조선중앙통신 브리핑 · <time>{formatDate(day.date)}</time>
        </p>
        <h1>{day.overview}</h1>
        {FIELDS.map((f) => {
          const items = day.items.filter((i) => i.field === f.id);
          if (!items.length) return null;
          return (
            <section key={f.id} className="rodong-field">
              <h2>
                <Link href={`/kcna/field/${f.id}`}>{f.label}</Link>
              </h2>
              <ul className="issue-list">
                {items.map((issue) => (
                  <IssueItem key={issue.title} issue={issue} />
                ))}
              </ul>
            </section>
          );
        })}
        <Link href="/kcna" className="back-link">
          ← 브리핑 목록
        </Link>
      </article>
    </main>
  );
}
