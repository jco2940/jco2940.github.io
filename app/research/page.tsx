import type { Metadata } from "next";
import { PageIntro } from "../components";
import { PROFILE } from "../../site.config";
import research from "../data/research.json";
import { ResearchNav } from "../nav";

export const metadata: Metadata = { title: `연구·논문 | ${PROFILE.name}` };

export default function ResearchPage() {
  const counts = research.groups.map((g) => `${g.title} ${g.items.length}`).join(" · ");
  return (
    <main className="inner-page">
      <ResearchNav />
      <PageIntro eyebrow="RESEARCH" title="연구·논문" lead={counts} />
      {research.groups.map((group) => (
        <section key={group.id} id={group.id} className="about-section">
          <h2>{group.title}</h2>
          <ul className="cv-list">
            {group.items.map((item) => (
              <li key={item.title + item.date}>
                <span className="cv-period">{item.date || "—"}</span>
                <span>
                  <strong>{item.title}</strong>
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
