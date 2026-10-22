import Link from "next/link";
import { FIELDS, fieldLabel, type FieldId, type Issue } from "./data";

export function FieldNav({ current }: { current?: FieldId }) {
  return (
    <nav className="field-nav" aria-label="분야">
      <Link href="/rodong" aria-current={current ? undefined : "page"}>
        전체
      </Link>
      {FIELDS.map((f) => (
        <Link key={f.id} href={`/rodong/field/${f.id}`} aria-current={current === f.id ? "page" : undefined}>
          {f.label}
        </Link>
      ))}
    </nav>
  );
}

export function IssueItem({ issue, showField }: { issue: Issue; showField?: boolean }) {
  return (
    <li className="issue">
      {showField && <span className="kind">{fieldLabel(issue.field)}</span>}
      <h3>{issue.title}</h3>
      <p>{issue.summary}</p>
      {issue.note && <p className="issue-note">{issue.note}</p>}
      <ul className="issue-sources">
        {issue.sources.map((s) => (
          <li key={s.headline}>
            {s.url ? <a href={s.url}>「{s.headline}」</a> : `「${s.headline}」`}
            {s.page && ` ${s.page}면`}
          </li>
        ))}
      </ul>
    </li>
  );
}

export function EmptyNote() {
  return <p className="rodong-empty">아직 정리된 브리핑이 없습니다.</p>;
}
