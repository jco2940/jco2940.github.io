import Link from "next/link";
import { Cover } from "./components";
import { ARCHIVES, PROFILE } from "../site.config";
import research from "./data/research.json";
import { recentNotes } from "./home";
import { trendDays } from "./trends/data";
import { featuredStories, isBroadcast } from "./trends/top";
import { countryName } from "./archive/countries";

export default function Home() {
  const all = research.groups.flatMap((g) => g.items.map((item) => ({ ...item, group: g.title, groupId: g.id })));
  const featured = all.filter((item) => item.featured);
  const series = research.groups.find((g) => g.id === "online-series")!.items.slice(0, 3);
  const latest = trendDays()[0];
  const stories = latest ? featuredStories(latest) : [];
  // MEDIA: 국내 방송사(KBS·MBC 등)와 북한 전문 프로그램이 가장 많이 다룬 이슈. FEATURED 와는 보는 눈이 달라 같은 이야기가 겹칠 수 있다
  const onAir = latest ? featuredStories(latest, { only: isBroadcast, minSources: 1 }) : [];
  const notes = recentNotes();

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

        {/* FEATURED: 최신 언론 동향에서 여러 언론이 함께 다룬 이야기 3개. 수집분이 없으면 대표 연구를 보여 준다 */}
        <div className="home-section-head">
          <p className="eyebrow">FEATURED</p>
          {stories.length > 0 && <Link href={`/trends/${latest.date}`}>동향 전체 보기</Link>}
        </div>
        <div className="card-row">
          {stories.length > 0
            ? stories.map((story, i) => (
                <a key={story.headline.url} href={story.headline.url} className="feature-card">
                  <Cover label={`북한 이슈 동향 · ${story.date.replaceAll("-", ".")}`} title={story.headline.title} tone={i} />
                  <span className="feature-meta">
                    {story.countries.map(countryName).join("·")} 언론 {story.sources}곳 보도
                  </span>
                  <strong>{story.headline.title}</strong>
                  <span className="feature-sub">
                    {story.headline.source}
                    {story.sources > 1 && ` 외 ${story.sources - 1}곳`}
                    {story.lang === "ko" && story.keywords.length > 0 && ` · ${story.keywords.join(" · ")}`}
                  </span>
                </a>
              ))
            : featured.map((item, i) => (
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

        {onAir.length > 0 && (
          <>
            <div className="home-section-head">
              <p className="eyebrow">MEDIA</p>
              <Link href={`/trends/${latest.date}`}>방송 보도 전체 보기</Link>
            </div>
            <div className="card-row">
              {onAir.map((story, i) => (
                <a key={story.headline.url} href={story.headline.url} className="feature-card">
                  <Cover label={story.headline.source} title={story.headline.title} tone={i + 2} />
                  <span className="feature-meta">
                    {story.date.replaceAll("-", ".")} · <em>{[...new Set(story.articles.map((a) => a.source))].slice(0, 3).join(" · ")}</em>
                  </span>
                  <strong>{story.headline.title}</strong>
                  <span className="feature-sub">
                    방송 {story.sources}곳 보도
                    {story.keywords.length > 0 && ` · ${story.keywords.join(" · ")}`}
                  </span>
                </a>
              ))}
            </div>
          </>
        )}

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

        <section className="recent-notes">
          <p className="eyebrow">RESEARCH NOTES &amp; ARCHIVE</p>
          <h2>최근 기록</h2>
          <ul>
            {notes.map((note) => {
              const body = (
                <>
                  <time>{note.date.replaceAll("-", ".")}</time>
                  <span>
                    <span className="kind">{note.kind}</span>
                    <strong>{note.title}</strong>
                    {note.sub && <p>{note.sub}</p>}
                  </span>
                  <span aria-hidden="true">{note.external ? "↗" : "→"}</span>
                </>
              );
              return (
                <li key={note.kind + note.date + note.title}>
                  {note.external ? <a href={note.href}>{body}</a> : <Link href={note.href}>{body}</Link>}
                </li>
              );
            })}
          </ul>
        </section>
      </section>
    </main>
  );
}
