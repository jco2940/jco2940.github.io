import type { Metadata } from "next";
import { PageIntro } from "../components";
import { PROFILE } from "../../site.config";
import about from "../data/about.json";

export const metadata: Metadata = { title: `소개 | ${PROFILE.name}` };

export default function AboutPage() {
  return (
    <main className="inner-page">
      <PageIntro eyebrow="ABOUT" title={`${PROFILE.name} 소개`} lead={about.intro} />
      {about.sections.map((section) => (
        <section key={section.title} className="about-section">
          <h2>{section.title}</h2>
          <ul className="cv-list">
            {section.items.map((item) => (
              <li key={item.title}>
                <span className="cv-period">{item.period}</span>
                <span>
                  <strong>{item.title}</strong>
                  {item.detail && <p>{item.detail}</p>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
