import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PROFILE } from "../../../site.config";
import { ArchiveNav } from "../../archive/nav";
import { formatDate } from "../../rodong/data";
import { trendDays } from "../data";
import { TrendDayView } from "../view";

// 정적 내보내기는 빈 목록을 허용하지 않아, 수집분이 없을 때는 404가 되는 자리표시 경로 하나를 만든다
const EMPTY = "none";

export const dynamicParams = false;

export function generateStaticParams() {
  const days = trendDays();
  return days.length ? days.map((d) => ({ date: d.date })) : [{ date: EMPTY }];
}

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }): Promise<Metadata> {
  const { date } = await params;
  return { title: `북한 이슈 동향 ${date === EMPTY ? "" : formatDate(date)} | ${PROFILE.name}` };
}

export default async function TrendDayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const days = trendDays();
  const i = days.findIndex((d) => d.date === date);
  if (i < 0) notFound();

  return (
    <main className="inner-page">
      <ArchiveNav />
      <TrendDayView day={days[i]} prev={days[i + 1]?.date} next={days[i - 1]?.date} />
      <Link href="/trends" className="back-link">
        ← 최신 동향
      </Link>
    </main>
  );
}
