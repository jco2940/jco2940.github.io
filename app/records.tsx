import { PageIntro } from "./components";

// 발표·미디어처럼 날짜·제목·장소로 이루어진 기록 목록. 데이터는 app/data/talks.json, media.json
export type Record = {
  date: string; // YYYY.MM 또는 YYYY.MM.DD
  title: string; // 발표·강의 제목, 또는 출연한 회차 제목
  venue: string; // 학회·기관·프로그램명
  role?: string; // 발표, 토론, 강사, 패널, 인터뷰 등
  url?: string; // 발표자료·영상·기사 주소
  description?: string; // 미디어 카드의 짧은 설명
  image?: string; // 썸네일 주소. 유튜브 주소면 비워 두어도 자동으로 붙는다
};

export type RecordGroup = { id: string; title: string; items: Record[] };

export function RecordsPage({ eyebrow, title, lead, groups }: { eyebrow: string; title: string; lead: string; groups: RecordGroup[] }) {
  const filled = groups
    .map((g) => ({ ...g, items: [...g.items].sort((a, b) => b.date.localeCompare(a.date)) }))
    .filter((g) => g.items.length > 0);
  return (
    <main className="inner-page">
      <PageIntro eyebrow={eyebrow} title={title} lead={filled.length ? filled.map((g) => `${g.title} ${g.items.length}`).join(" · ") : lead} />
      {filled.length === 0 && <p className="rodong-empty">목록을 준비하고 있습니다.</p>}
      {filled.map((group) => (
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
