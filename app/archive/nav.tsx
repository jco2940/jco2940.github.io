"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ARCHIVES } from "../../site.config";

// 정적 호스팅에서 /trends.html 처럼 확장자가 붙어 열려도 같은 페이지로 본다
const isUnder = (rawPath: string, href: string) => {
  const path = rawPath.replace(/\.html$/, "");
  return path === href || path.startsWith(`${href}/`);
};

// 공개 아카이브 페이지 상단의 탭. 아카이브끼리 오가고, 하위 탭이 있으면 그 아래에 보인다
export function ArchiveNav() {
  const path = usePathname();
  const current = ARCHIVES.find((a) => isUnder(path, a.href) || a.sub.some((s) => isUnder(path, s.href)));
  return (
    <>
      <nav className="sub-nav archive-nav" aria-label="공개 아카이브">
        {ARCHIVES.map((a) => (
          <Link key={a.href} href={a.href} aria-current={a === current ? "page" : undefined}>
            {a.title}
          </Link>
        ))}
      </nav>
      {current && current.sub.length > 0 && (
        <nav className="sub-nav archive-subnav" aria-label={current.title}>
          {current.sub.map((s) => (
            <Link key={s.href} href={s.href} aria-current={isUnder(path, s.href) ? "page" : undefined}>
              {s.label}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
