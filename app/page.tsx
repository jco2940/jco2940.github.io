import Link from "next/link";
import { Cover } from "./components";
import { PROFILE } from "../site.config";
import research from "./data/research.json";

const TILES = [
  { href: "/interests#human-rights", title: "북한 인권 연구", text: "북한 주민의 인권 상황과 유엔·국제사회의 조사와 데이터를 정리합니다.", tone: "tile-indigo", wide: true },
  { href: "/research", title: "연구·논문", text: "학위논문, 학술논문, 저서, 연구보고서를 모았습니다.", tone: "tile-slate", wide: true },
  { href: "/research#online-series", title: "온라인시리즈", text: "통일연구원 온라인시리즈로 발표한 현안 분석입니다.", tone: "tile-plum" },
  { href: "/interests", title: "연구 관심사", text: "교육·사회·여성·청(소)년·정치·경제·근로단체·북한이탈주민을 연구합니다.", tone: "tile-green" },
  { href: "/about", title: "CV", text: "학력, 경력, 자격을 정리했습니다.", tone: "tile-brown" },
];

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
        <p className="profile-summary">{PROFILE.tagline}</p>
      </aside>

      <section>
        <div className="tile-grid">
          {TILES.map((tile) => (
            <Link key={tile.href} href={tile.href} className={`tile ${tile.tone}${tile.wide ? " tile-wide" : ""}`}>
              <strong>
                {tile.title} <span aria-hidden="true">↗</span>
              </strong>
              <span>{tile.text}</span>
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
