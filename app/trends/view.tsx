import Link from "next/link";
import { ArchiveBrowser, type Entry } from "../archive/browser";
import { countryName } from "../archive/countries";
import { formatDate } from "../rodong/data";
import { TREND_COUNTRIES, TREND_FIELDS, fieldLabel, type TrendDay } from "./data";

// 하루치 언론 동향: 나라별·분야별 건수 요약과 기사 목록
export function TrendDayView({ day, prev, next }: { day: TrendDay; prev?: string; next?: string }) {
  const entries: Entry[] = day.items.map((a) => ({
    id: `${a.country}:${a.id}`,
    title: a.title,
    url: a.url,
    date: day.date,
    tags: TREND_FIELDS.filter((f) => a.fields.includes(f.id)).map((f) => f.label),
    facets: [countryName(a.country)],
    meta: `${a.source} · ${new Date(a.published).toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit" })}`,
  }));
  const byCountry = TREND_COUNTRIES.map((c) => [c, day.items.filter((a) => a.country === c).length] as const);
  const byField = TREND_FIELDS.map((f) => [f.id, day.items.filter((a) => a.fields.includes(f.id)).length] as const)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <>
      <div className="trend-head">
        <h2>{formatDate(day.date)}</h2>
        <span className="trend-pager">
          {next && <Link href={`/trends/${next}`}>← 다음 날</Link>}
          {prev && <Link href={`/trends/${prev}`}>이전 날 →</Link>}
        </span>
      </div>
      <dl className="trend-stats">
        {byCountry.map(([c, n]) => (
          <div key={c}>
            <dt>{countryName(c)}</dt>
            <dd>{n}</dd>
          </div>
        ))}
      </dl>
      {byField.length > 0 && (
        <p className="trend-fields">
          많이 다뤄진 분야: {byField.map(([f, n]) => `${fieldLabel(f)} ${n}`).join(" · ")}
        </p>
      )}
      <ArchiveBrowser items={entries} tags={TREND_FIELDS.map((f) => f.label)} facetLabel="모든 나라" unit="건" byDay />
    </>
  );
}
