import type { Metadata } from "next";
import { PageIntro } from "../components";
import { PROFILE } from "../../site.config";
import { HAS_TALKS, TALK_GROUPS } from "./data";

export const metadata: Metadata = { title: `강의·미디어 | ${PROFILE.name}` };

export default function TalksPage() {
  const groups = TALK_GROUPS.filter((g) => g.items.length > 0);
  return (
    <main className="inner-page">
      <PageIntro
        eyebrow="TALKS & MEDIA"
        title="강의·미디어"
        lead={HAS_TALKS ? groups.map((g) => `${g.title} ${g.items.length}`).join(" · ") : "학회 발표, 강의, 방송·언론 출연 기록"}
      />
      {!HAS_TALKS && <p className="rodong-empty">목록을 준비하고 있습니다.</p>}
      {groups.map((group) => (
        <section key={group.id} id={group.id} className="about-section">
          <h2>{group.title}</h2>
          <ul className="cv-list">
            {group.items.map((item) => (
              <li key={item.date + item.title}>
                <span className="cv-period">{item.date}</span>
                <span>
                  <strong>{item.url ? <a href={item.url} className="talk-link">{item.title}</a> : item.title}</strong>
                  <p>
                    {item.venue}
                    {item.role && ` · ${item.role}`}
                  </p>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
