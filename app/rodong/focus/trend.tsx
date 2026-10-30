import Link from "next/link";
import focus from "../../data/rodong-focus.json";
import { DAYS, fieldLabel, type FieldId } from "../data";

export type Note = { head: string; body: string };
export type Entry = { date: string; text: string; auto?: boolean };
type RawTheme = { id: string; title: string; question: string; match: string; timeline: Entry[]; reading: Note[]; watch: string[] };
export type Theme = Omit<RawTheme, "match">;
type RawFocus = { slug: string; title: string; subtitle: string; lead: string; field: FieldId; curatedUntil: string; themes: RawTheme[]; synthesis: Note[]; caveats: string };
export type Focus = Omit<RawFocus, "themes"> & { themes: Theme[]; latest: string };

// 같은 분야는 어떤 항목이든, 다른 분야는 교육과 이어지는 말이 있을 때만 자동으로 넣는다
const CONTEXT = /학교|교육|학생|교원|대학|교복|소년단|사범/;

// 직접 정리한 보도 흐름(curatedUntil까지)에 그 뒤 브리핑에서 주제어가 맞는 항목을 자동으로 더한다.
// 새 브리핑을 올리면 추이표·보도 흐름·건수가 다시 빌드될 때 저절로 늘어난다
function withAuto(f: RawFocus): Focus {
  const later = DAYS.filter((d) => d.date > f.curatedUntil);
  const themes = f.themes.map(({ match, ...t }) => {
    const re = new RegExp(match);
    const auto: Entry[] = later.flatMap((d) =>
      d.items
        .filter((i) => {
          const text = `${i.title} ${i.summary} ${i.sources.map((s) => s.headline).join(" ")}`;
          return re.test(text) && (i.field === f.field || CONTEXT.test(text));
        })
        .map((i) => ({ date: d.date, text: `${i.field === f.field ? "" : `(${fieldLabel(i.field)}) `}${i.title}: ${i.summary}`, auto: true })),
    );
    return { ...t, timeline: [...t.timeline, ...auto] };
  });
  const latest = DAYS.map((d) => d.date).sort().at(-1) ?? f.curatedUntil;
  return { ...f, themes, latest };
}

export const FOCUS = (focus as RawFocus[]).map(withAuto);

const DAY = 864e5;
const mondayOf = (date: string) => {
  const t = Date.parse(`${date}T00:00:00Z`);
  return new Date(t - ((new Date(t).getUTCDay() + 6) % 7) * DAY).toISOString().slice(0, 10);
};

// 보도 흐름 날짜를 주(월요일 시작) 단위로 묶는다. 기사가 쌓여도 표는 주 칸만 늘어난다
export function weeksOf(f: Focus) {
  const dates = f.themes.flatMap((t) => t.timeline.map((e) => e.date)).sort();
  if (!dates.length) return [];
  const weeks: string[] = [];
  for (let w = mondayOf(dates[0]); w <= mondayOf(dates[dates.length - 1]); w = new Date(Date.parse(`${w}T00:00:00Z`) + 7 * DAY).toISOString().slice(0, 10)) weeks.push(w);
  return weeks;
}

export function monthsOf(t: Theme) {
  const m = new Map<string, Entry[]>();
  [...t.timeline].sort((a, b) => a.date.localeCompare(b.date)).forEach((e) => m.set(e.date.slice(0, 7), [...(m.get(e.date.slice(0, 7)) ?? []), e]));
  return [...m].sort((a, b) => b[0].localeCompare(a[0]));
}

// 한 주는 목요일이 속한 달로 센다 (ISO 주 기준)
const endMonth = (week: string) => Number(new Date(Date.parse(`${week}T00:00:00Z`) + 3 * DAY).toISOString().slice(5, 7));
const level = (n: number) => (n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : 3);
const md = (date: string) => `${Number(date.slice(5, 7))}.${Number(date.slice(8))}`;

// 주제 × 주 히트맵. compact는 카드 안에 들어가는 작은 판(링크·라벨 없음)
export function FocusTrend({ f, compact }: { f: Focus; compact?: boolean }) {
  const weeks = weeksOf(f);
  const count = (t: Theme, w: string) => t.timeline.filter((e) => mondayOf(e.date) === w).length;
  return (
    <div className={compact ? "ft ft-compact" : "ft"}>
      <table>
        {!compact && (
          <thead>
            <tr>
              <th />
              {weeks.map((w, i) => {
                // 달이 바뀌는 칸에만 달 이름을 단다
                const month = endMonth(w);
                return <th key={w}>{i === 0 || month !== endMonth(weeks[i - 1]) ? `${month}월` : ""}</th>;
              })}
              <th>합계</th>
            </tr>
          </thead>
        )}
        <tbody>
          {f.themes.map((t) => (
            <tr key={t.id}>
              <th>{compact ? t.title : <a href={`#${t.id}`}>{t.title}</a>}</th>
              {weeks.map((w) => {
                const n = count(t, w);
                const label = `${t.title} · ${md(w)} 주 ${n}건`;
                return (
                  <td key={w}>
                    <span className={`ft-cell lv${level(n)}`} title={label} aria-label={label} />
                  </td>
                );
              })}
              <td className="ft-total">{t.timeline.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!compact && (
        <p className="ft-legend">
          칸 하나가 한 주(월~일)입니다. <span className="ft-cell lv1" /> 1건 <span className="ft-cell lv2" /> 2~3건 <span className="ft-cell lv3" /> 4건 이상{" "}
          <span className="ft-cell lv0" /> 없음 · 주제 이름을 누르면 해석으로 이동합니다.
        </p>
      )}
    </div>
  );
}

// 주제별 보도 흐름. 최근 달만 펼치고 지난 달은 접어 둔다
export function Timeline({ t, briefed }: { t: Theme; briefed: Set<string> }) {
  return (
    <div className="ft-months">
      {monthsOf(t).map(([m, entries], i) => (
        <details key={m} open={i === 0}>
          <summary>
            {m.slice(0, 4)}년 {Number(m.slice(5))}월 <b>{entries.length}건</b>
          </summary>
          <ol className="fc-timeline">
            {entries.map((e) => (
              <li key={e.date + e.text.slice(0, 12)}>
                {briefed.has(e.date) ? <Link href={`/rodong/${e.date}`}>{md(e.date)}</Link> : <span>{md(e.date)}</span>}
                <p>
                  {e.auto && <span className="ft-auto">자동</span>}
                  {e.text}
                </p>
              </li>
            ))}
          </ol>
        </details>
      ))}
    </div>
  );
}
