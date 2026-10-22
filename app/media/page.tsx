import type { Metadata } from "next";
import { PROFILE } from "../../site.config";
import { RecordsPage, type RecordGroup } from "../records";
import media from "../data/media.json";

export const metadata: Metadata = { title: `미디어 | ${PROFILE.name}` };

export default function MediaPage() {
  return <RecordsPage eyebrow="MEDIA" title="미디어" lead="방송 출연, 유튜브, 언론 인터뷰" groups={media.groups as RecordGroup[]} />;
}
