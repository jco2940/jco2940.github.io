import type { Metadata } from "next";
import { PROFILE } from "../../site.config";
import { RecordsPage, type RecordGroup } from "../records";
import talks from "../data/talks.json";

export const metadata: Metadata = { title: `발표 | ${PROFILE.name}` };

export default function TalksPage() {
  return <RecordsPage eyebrow="TALKS" title="발표" lead="학회 발표·토론, 기관·시민단체 강의" groups={talks.groups as RecordGroup[]} />;
}
