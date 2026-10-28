import type { Doc } from "./data";

// 문서를 인권 분야로 나눈다(제목·설명·발간기관의 낱말). 한 문서가 여러 분야에 들 수 있고,
// 북한 인권 상황 전반을 다루는 문서는 '포괄'에 넣는다
export const LIB_TOPICS = [
  { id: "general", label: "포괄 (인권 상황 전반)", icon: "🌐", re: /situation of human rights|universal periodic review|UPR|commission of inquiry|COI|북한인권법|human rights act|national report|종합/i },
  { id: "accountability", label: "책임규명", icon: "⚖️", re: /accountab|책임규명|commission of inquiry|COI|crimes against humanity/i },
  { id: "civil", label: "자유권·구금·강제실종", icon: "🔒", re: /CCPR|civil and political|자유권|detention|prison|강제실종|납치|abduct|disappear/i },
  { id: "social", label: "사회권 (식량·보건·교육)", icon: "🍚", re: /CESCR|economic, social|경제적·사회적|사회권|food|health|education|교육권/i },
  { id: "women", label: "여성", icon: "👩", re: /CEDAW|women|여성|여아/i },
  { id: "child", label: "아동", icon: "🧒", re: /CRC|child|OPSC|아동/i },
  { id: "disability", label: "장애인", icon: "♿", re: /CRPD|disabilit|장애/i },
  { id: "labour", label: "강제노동", icon: "⛏️", re: /forced labou?r|강제노동/i },
] as const;

export type LibTopicId = (typeof LIB_TOPICS)[number]["id"];

export function topicsOf(d: Doc): LibTopicId[] {
  const text = `${d.title} ${d.note ?? ""} ${d.publisher}`;
  const hit = LIB_TOPICS.filter((t) => t.re.test(text)).map((t) => t.id);
  return hit.length ? hit : ["general"];
}

// 발간 주체: 지역 대신 문서를 낸 쪽으로 나눈다
export const ISSUERS = [
  { id: "un", label: "유엔 인권기구", re: /유엔 (인권이사회$|총회|인권최고대표|북한인권 특별보고관|북한인권 조사위원회|인권위원회)|유엔 인권이사회$/ },
  { id: "treaty", label: "조약기구", re: /위원회\((CEDAW|CRC|CRPD|CESCR|HRC)\)/ },
  { id: "upr", label: "UPR", re: /UPR/ },
  { id: "state", label: "각국 정부·의회", re: /국회|의회|정부|congress|parliament/i },
] as const;

export function issuerOf(d: Doc) {
  return ISSUERS.find((i) => i.re.test(d.publisher))?.id ?? (d.publisher.startsWith("유엔") ? "un" : "state");
}
