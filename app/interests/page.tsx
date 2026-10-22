import type { Metadata } from "next";
import { PageIntro } from "../components";
import { PROFILE } from "../../site.config";
import interests from "../data/interests.json";

export const metadata: Metadata = { title: `연구 관심사 | ${PROFILE.name}` };

export default function InterestsPage() {
  return (
    <main className="inner-page">
      <PageIntro
        eyebrow="RESEARCH INTERESTS"
        title="연구 관심사"
        lead="교육학의 관점에서 북한의 인권과 교육, 사회, 그 안에서 살아가는 사람들을 연구합니다."
      />
      <div className="interest-list">
        {interests.map((item, i) => (
          <section key={item.id} id={item.id} className="interest-row">
            <span className="interest-no">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h2>
                {item.title}
                <span>{item.en}</span>
              </h2>
              <p>{item.summary}</p>
              <span className="tags">
                {item.keywords.map((k) => (
                  <span key={k}>{k}</span>
                ))}
              </span>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
