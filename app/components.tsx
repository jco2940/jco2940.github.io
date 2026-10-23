import Link from "next/link";
import { PROFILE } from "../site.config";
import { MainNav } from "./nav";

export function SiteHeader() {
  return (
    <header className="masthead">
      <Link href="/" className="wordmark">
        <span className="wordmark-ko">{PROFILE.name}</span>
      </Link>
      <MainNav />
      <span className="masthead-meta">
        {PROFILE.links.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </span>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>
        © {new Date().getFullYear()} {PROFILE.name}
      </span>
      <span className="footer-links">
        {PROFILE.links.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </span>
    </footer>
  );
}

export function PageIntro({ eyebrow, title, lead }: { eyebrow: string; title: string; lead?: string }) {
  return (
    <section className="page-intro">
      <p className="eyebrow">{eyebrow}</p>
      <div>
        <h1>{title}</h1>
        {lead && <p className="page-lead">{lead}</p>}
      </div>
    </section>
  );
}

// 이미지가 없는 실적에 쓰는 표지. 발행처와 제목으로 문서 표지처럼 그린다
export function Cover({ label, title, tone }: { label: string; title: string; tone: number }) {
  return (
    <span className={`cover cover-${tone % 4}`} aria-hidden="true">
      <span className="cover-label">{label}</span>
      <span className="cover-title">{title}</span>
      <span className="cover-rule" />
    </span>
  );
}
