import Link from "next/link";
import { Cover } from "./components";
import { ARCHIVES, PROFILE } from "../site.config";
import research from "./data/research.json";
import { mediaCards, recentNotes } from "./home";

export default function Home() {
  const all = research.groups.flatMap((g) => g.items.map((item) => ({ ...item, group: g.title, groupId: g.id })));
  const featured = all.filter((item) => item.featured);
  const series = research.groups.find((g) => g.id === "online-series")!.items.slice(0, 3);
  const cards = mediaCards();
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

        {cards.length > 0 && (
          <>
            <div className="home-section-head">
              <p className="eyebrow">MEDIA</p>
              <Link href="/media">전체 보기</Link>
            </div>
            <div className="card-row">
              {cards.map((card, i) => {
                const body = (
                  <>
                    {card.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={card.image} alt="" className="card-thumb" />
                    ) : (
                      <Cover label={card.label} title={card.title} tone={i + 2} />
                    )}
                    <span className="feature-meta">
                      {card.date} · <em>{card.label}</em>
                    </span>
                    <strong>{card.title}</strong>
                  </>
                );
                return card.external ? (
                  <a key={card.href + card.title} href={card.href} className="feature-card">
                    {body}
                  </a>
                ) : (
                  <Link key={card.href + card.title} href={card.href} className="feature-card">
                    {body}
                  </Link>
                );
              })}
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
