import type { Metadata } from "next";
import { PROFILE } from "../../site.config";
import { PageIntro } from "../components";
import type { RecordGroup } from "../records";
import media from "../data/media.json";
import { MediaArchive } from "./MediaArchive";

export const metadata: Metadata = { title: `미디어 | ${PROFILE.name}` };

export default function MediaPage() {
  return (
    <main className="inner-page">
      <PageIntro eyebrow="MEDIA" title="미디어" lead="방송 출연, 유튜브, 강연 영상, 언론 인터뷰와 보도" />
      <MediaArchive groups={media.groups as RecordGroup[]} />
    </main>
  );
}
