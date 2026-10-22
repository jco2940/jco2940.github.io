import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "../components";
import { PROFILE } from "../../site.config";
import { ArchiveNav } from "../archive/nav";
import { formatDate } from "../rodong/data";
import { trendDays } from "./data";
import { TrendDayView } from "./view";

export const metadata: Metadata = { title: `북한 이슈 동향 | ${PROFILE.name}` };

export default function TrendsPage() {
  const days = trendDays();
  return (
    <main className="inner-page">
      <ArchiveNav />
      <PageIntro
        eyebrow="NORTH KOREA IN THE NEWS"
        title="북한 이슈 동향"
        lead="한국·미국·영국·중국·러시아·일본 언론이 하루 동안 보도한 북한 관련 기사를 매일 모아 분야별로 정리합니다. 나라는 Google 뉴스 국가판 기준이고, 분야는 제목의 낱말로 자동 분류합니다. 제목을 누르면 기사 원문으로 이동합니다."
      />
      {days.length === 0 ? (
        <p className="rodong-empty">첫 수집을 기다리고 있습니다.</p>
      ) : (
        <>
          <TrendDayView day={days[0]} prev={days[1]?.date} />
          {days.length > 1 && (
            <section className="about-section">
              <h2>지난 동향</h2>
              <ul className="trend-archive">
                {days.slice(1).map((d) => (
                  <li key={d.date}>
                    <Link href={`/trends/${d.date}`}>{formatDate(d.date)}</Link> <span>{d.items.length}건</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  );
}
