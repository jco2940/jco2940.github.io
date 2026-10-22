import type { Metadata } from "next";
import { PageIntro } from "../components";
import { ResearchNav } from "../nav";
import { PROFILE } from "../../site.config";
import { LIBRARY } from "./data";
import { LibraryBrowser } from "./browser";

export const metadata: Metadata = { title: `연구 라이브러리 | ${PROFILE.name}` };

export default function LibraryPage() {
  return (
    <main className="inner-page">
      <ResearchNav />
      <PageIntro
        eyebrow="RESEARCH LIBRARY"
        title="연구 라이브러리"
        lead={`한국·미국 등 여러 나라에서 발표되는 북한의 교육·디아스포라·경제 관련 논문을 매일 모읍니다. OpenAlex와 KCI의 서지정보를 바탕으로 하며, 제목을 누르면 원문 페이지로 이동합니다.${
          LIBRARY.updated ? ` (최근 갱신 ${LIBRARY.updated.replaceAll("-", ".")})` : ""
        }`}
      />
      {LIBRARY.items.length === 0 ? <p className="rodong-empty">첫 수집을 기다리고 있습니다.</p> : <LibraryBrowser items={LIBRARY.items} />}
    </main>
  );
}
