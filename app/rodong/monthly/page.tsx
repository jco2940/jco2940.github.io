import type { Metadata } from "next";
import Link from "next/link";
import { PROFILE } from "../../../site.config";
import { PublicHeader } from "../../archive/public-header";
import { MONTHS, REPORT_FIELDS, fieldStat, monthDays, monthLabel, monthLead } from "./report";

export const metadata: Metadata = { title: `노동신문 월별 리포트 | ${PROFILE.name}` };

export default function RodongMonthlyIndex() {
  const labels = REPORT_FIELDS.map((f) => fieldStat(MONTHS[0], f).label);
  return (
    <main className="digest">
      <PublicHeader current="/rodong" title="노동신문 월별 리포트" badge="Monthly Report" tone="rodong">
        노동신문 브리핑에서 {labels.join("·")} 분야 기사를 달마다 모아 주제·날짜·지면별로 집계하고 해석합니다. by 통일연구원{" "}
        <Link href="/">{PROFILE.name}</Link> · <Link href="/rodong">일일 브리핑으로</Link>
      </PublicHeader>
      <div className="digest-inner">
        <section className="digest-section">
          <h2>달별 항목 수</h2>
          <div className="mr-scroll">
            <table className="mr-table">
              <thead>
                <tr>
                  <th>달</th>
                  {labels.map((l) => (
                    <th key={l}>{l}</th>
                  ))}
                  <th>브리핑 일수</th>
                </tr>
              </thead>
              <tbody>
                {MONTHS.map((m) => (
                  <tr key={m}>
                    <th>
                      <Link href={`/rodong/monthly/${m}`}>{monthLabel(m)} →</Link>
                    </th>
                    {REPORT_FIELDS.map((f) => (
                      <td key={f}>{fieldStat(m, f).issues.length}</td>
                    ))}
                    <td>{monthDays(m).length}일</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="digest-section">
          <h2>리포트</h2>
          <ul className="digest-weeks">
            {MONTHS.map((m) => (
              <li key={m}>
                <span className="digest-range">{monthLabel(m)}</span>
                <Link href={`/rodong/monthly/${m}`}>{monthLead(m) ?? `${monthLabel(m)} 분야별 집계`}</Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
