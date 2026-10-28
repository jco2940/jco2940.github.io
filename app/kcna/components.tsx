import Link from "next/link";
import { FIELDS, type FieldId } from "./data";
export { IssueItem } from "../rodong/components";

export function FieldNav({ current }: { current?: FieldId }) {
  return (
    <nav className="field-nav" aria-label="분야">
      <Link href="/kcna" aria-current={current ? undefined : "page"}>
        전체
      </Link>
      {FIELDS.map((f) => (
        <Link key={f.id} href={`/kcna/field/${f.id}`} aria-current={current === f.id ? "page" : undefined}>
          {f.label}
        </Link>
      ))}
    </nav>
  );
}

export function EmptyNote() {
  return <p className="rodong-empty">아직 정리된 브리핑이 없습니다. 조선중앙통신 보도문을 받는 대로 분야별로 정리합니다.</p>;
}
