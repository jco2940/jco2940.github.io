import Link from "next/link";

// 공개 아카이브(북한 이슈 동향·노동신문 브리핑·북한인권 라이브러리·북한 사회 연구) 첫 화면의 색 머리띠
const LINKS = [
  { href: "/trends", label: "북한 이슈 동향" },
  { href: "/rodong", label: "노동신문 브리핑" },
  { href: "/library", label: "북한인권 라이브러리" },
  { href: "/studies", label: "북한 사회 연구" },
];

export function PublicHeader({
  current,
  title,
  badge,
  children,
  tone = "indigo",
}: {
  current: string;
  title: string;
  badge: string;
  children: React.ReactNode;
  tone?: "indigo" | "plum" | "rodong";
}) {
  return (
    <section className={`digest-band digest-${tone}`}>
      <nav className="digest-topnav digest-inner" aria-label="공개 아카이브">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} aria-current={l.href === current ? "page" : undefined}>
            {l.label}
          </Link>
        ))}
        <span />
        <Link href="/">조현정 홈</Link>
      </nav>
      <div className="digest-inner">
        <h1>
          {title} <span className="digest-badge">{badge}</span>
        </h1>
        <p>{children}</p>
      </div>
    </section>
  );
}
