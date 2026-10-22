"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, RESEARCH_NAV } from "../site.config";

// 정적 호스팅에서 /trends.html 처럼 확장자가 붙어 열려도 같은 페이지로 본다
function isUnder(rawPath: string, href: string) {
  const path = rawPath.replace(/\.html$/, "");
  return path === href || path.startsWith(`${href}/`);
}

export function MainNav() {
  const path = usePathname();
  const inResearch = RESEARCH_NAV.some((item) => isUnder(path, item.href));
  return (
    <nav aria-label="주 메뉴">
      {NAV.map((item) => {
        const active = item.href === "/research" ? inResearch : isUnder(path, item.href);
        return (
          <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

// "연구" 아래 페이지들 상단의 하위 분류 탭
export function ResearchNav() {
  const path = usePathname();
  return (
    <nav className="sub-nav" aria-label="연구 분류">
      {RESEARCH_NAV.map((item) => (
        <Link key={item.href} href={item.href} aria-current={isUnder(path, item.href) ? "page" : undefined}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
