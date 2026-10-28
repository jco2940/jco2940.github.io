import raw from "../data/kcna.json";
import type { Day } from "../rodong/data";

// 조선중앙통신 브리핑: 분야·형식은 노동신문 브리핑과 같다(app/data/kcna.json). 작성 지침은 docs/rodong-briefing.md
export { FIELDS, fieldLabel, formatDate, type FieldId, type Issue } from "../rodong/data";

export const DAYS: Day[] = [...(raw.days as Day[])].sort((a, b) => b.date.localeCompare(a.date));
