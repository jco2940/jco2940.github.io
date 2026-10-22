import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "../components";
import { PROFILE } from "../../site.config";
import { DAYS, FIELDS, formatDate } from "./data";
import { EmptyNote, FieldNav } from "./components";

export const metadata: Metadata = { title: `노동신문 브리핑 | ${PROFILE.name}` };

export default function RodongPage() {
  return (
    <main className="inner-page">
      <PageIntro
        eyebrow="RODONG SINMUN BRIEFING"
        title="노동신문 브리핑"
        lead="매일 『로동신문』을 읽고 정치·경제·사회·여성·교육·청(소)년 분야의 이슈를 정리합니다."
      />
      <FieldNav />
      {DAYS.length === 0 ? (
        <EmptyNote />
      ) : (
        <div className="index-list">
          {DAYS.map((day) => (
            <Link key={day.date} href={`/rodong/${day.date}`} className="index-row">
              <time>{formatDate(day.date)}</time>
              <span>
                <span className="kind">
                  {FIELDS.map((f) => [f.label, day.items.filter((i) => i.field === f.id).length] as const)
                    .filter(([, n]) => n > 0)
                    .map(([label, n]) => `${label} ${n}`)
                    .join(" · ")}
                </span>
                <h2>{day.overview}</h2>
              </span>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
