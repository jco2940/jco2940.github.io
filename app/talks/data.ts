import raw from "../data/talks.json";

// 강의·발표와 미디어 출연 기록. 항목은 app/data/talks.json의 각 group.items에 추가한다
export type Talk = {
  date: string; // YYYY.MM 또는 YYYY.MM.DD
  title: string; // 발표·강의 제목, 또는 출연한 회차 제목
  venue: string; // 학회·기관·프로그램명 (예: 행사명, 방송사·프로그램)
  role?: string; // 발표, 토론, 강사, 패널, 인터뷰 등
  url?: string; // 발표자료·영상·기사 주소
};

export type TalkGroup = { id: string; title: string; items: Talk[] };

export const TALK_GROUPS: TalkGroup[] = (raw.groups as TalkGroup[]).map((g) => ({
  ...g,
  items: [...g.items].sort((a, b) => b.date.localeCompare(a.date)),
}));

export const HAS_TALKS = TALK_GROUPS.some((g) => g.items.length > 0);
