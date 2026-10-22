import Link from "next/link";
import { Cover } from "./components";
import { ARCHIVES, PROFILE } from "../site.config";
import research from "./data/research.json";

export default function Home() {
  const all = research.groups.flatMap((g) => g.items.map((item) => ({ ...item, group: g.title, groupId: g.id })));
  const featured = all.filter((item) => item.featured);
  const series = research.groups.find((g) => g.id === "online-series")!.items.slice(0, 3);

  return (
    <main className="archive-home">
      <aside className="profile-rail">
        <h2 className="profile-name">
          {PROFILE.name}
          <span>{PROFILE.nameEn}, Ph.D.</span>
        </h2>
        <p className="profile-role">통일연구원 인권연구실 부연구위원</p>
        <p className="profile-summary">
          {PROFILE.tagline.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
      </aside>

      <section>
        <div className="tile-grid">
          {ARCHIVES.map((a) => (
            <Link key={a.href} href={a.href} className={`tile tile-archive ${a.tone}`}>
              <strong>
                {a.title} <span aria-hidden="true">↗</span>
              </strong>
              <span>{a.text}</span>
            </Link>
          ))}
        </div>

        <div className="home-section-head">
          <p className="eyebrow">FEATURED</p>
        </div>
        <div className="card-row">
          {featured.map((item, i) => (
            <Link key={item.title} href={`/research#${item.groupId}`} className="feature-card">
              <Cover label={item.venue.split(" ")[0]} title={item.title} tone={i} />
              <span className="feature-meta">
                {item.group} · {item.date}
              </span>
              <strong>{item.title}</strong>
              <span className="feature-sub">{item.venue}</span>
            </Link>
          ))}
        </div>

        <div className="home-section-head">
          <p className="eyebrow">ONLINE SERIES</p>
          <Link href="/research#online-series">전체 보기</Link>
        </div>
        <div className="card-row">
          {series.map((item, i) => (
            <Link key={item.title} href="/research#online-series" className="feature-card">
              <Cover label="KINU 온라인시리즈" title={item.title} tone={i + 1} />
              <span className="feature-meta">
                {item.date} · <em>통일연구원</em>
              </span>
              <strong>{item.title}</strong>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
