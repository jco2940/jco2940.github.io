"use client";

import { useMemo, useState } from "react";
import { ArchiveBrowser, type Entry } from "../archive/browser";
import { countryName } from "../archive/countries";
import type { Cluster, Star } from "./map";

type Meta = { id: string; countries: string[]; year: string; ko: boolean; topic: string };
type Topic = { id: string; label: string; color: string; count: number };
type Pick = { label: string; desc: string; ids: string[]; cluster?: string } | null;

// 별자리 지도 + 오른쪽 패널 + 핵심 키워드 + 논문 목록.
// 별자리 이름표나 키워드를 누르면 그 주제가 지도에서 빛나고, 패널이 그 주제의 구성으로 바뀌며, 목록도 그 논문만 보인다
export function Explorer({
  width,
  height,
  stars,
  clusters,
  lines,
  dust,
  topics,
  keywords,
  meta,
  entries,
  tags,
}: {
  width: number;
  height: number;
  stars: Star[];
  clusters: Cluster[];
  lines: [number, number, number, number][];
  dust: { x: number; y: number; r: number; o: number }[];
  topics: Topic[];
  keywords: { word: string; count: number; ids: string[] }[];
  meta: Meta[];
  entries: Entry[];
  tags: string[];
}) {
  const [only, setOnly] = useState("");
  const [koOnly, setKoOnly] = useState(false);
  const [hover, setHover] = useState<Star | null>(null);
  const [pick, setPick] = useState<Pick>(null);
  const [listPick, setListPick] = useState<Pick>(null);

  const picked = useMemo(() => (pick ? new Set(pick.ids) : null), [pick]);
  const color = (t: string) => topics.find((x) => x.id === t)?.color ?? "#ccc";
  const topicLabel = (t: string) => topics.find((x) => x.id === t)?.label ?? t;
  const lit = (s: { topic: string; id?: string }) => (picked ? (s.id ? picked.has(s.id) : true) : !only || only === s.topic);

  const chooseCluster = (c: Cluster) => {
    const ids = stars.filter((s) => s.cluster === c.key).map((s) => s.id);
    const same = pick?.cluster === c.key;
    setPick(same ? null : { label: c.label, desc: `${topicLabel(c.topic)} 분야에서 제목에 '${c.label}'이(가) 들어간 논문`, ids, cluster: c.key });
    setOnly("");
  };
  const chooseKeyword = (k: { word: string; ids: string[] }) => {
    setPick(pick?.label === k.word && !pick.cluster ? null : { label: k.word, desc: `제목(한국어)에 '${k.word}'이(가) 들어간 모든 분야의 논문`, ids: k.ids });
    setOnly("");
    document.getElementById("starmap")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const showList = () => {
    setListPick(pick);
    document.getElementById("papers")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // 패널 통계: 고른 주제(없으면 전체)
  const sel = picked ? meta.filter((m) => picked.has(m.id)) : meta;
  const total = sel.length || 1;
  const byTopic = topics.map((t) => ({ ...t, n: sel.filter((m) => m.topic === t.id).length })).filter((t) => t.n > 0);
  const countries = new Map<string, number>();
  sel.forEach((m) => m.countries.forEach((c) => countries.set(c, (countries.get(c) ?? 0) + 1)));
  const topCountries = [...countries].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const years = new Map<string, number>();
  sel.forEach((m) => m.year && years.set(m.year, (years.get(m.year) ?? 0) + 1));
  const hull = pick?.cluster ? clusters.find((c) => c.key === pick.cluster) : null;

  return (
    <>
      <div className="starmap-grid" id="starmap">
        <div className="starmap-wrap">
          <div className="starmap-legend">
            {topics.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={only === t.id}
                onClick={() => {
                  setOnly(only === t.id ? "" : t.id);
                  setPick(null);
                }}
              >
                <i style={{ background: t.color }} /> {t.label} {t.count}
              </button>
            ))}
            <label>
              <input type="checkbox" checked={koOnly} onChange={(e) => setKoOnly(e.target.checked)} /> 한국 논문 강조
            </label>
            <span className="starmap-hint">별자리 이름을 누르면 그 주제를 봅니다</span>
          </div>
          <div className="starmap">
            <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="북한 사회 연구 논문 별자리 지도">
              <defs>
                <radialGradient id="sky" cx="50%" cy="45%" r="70%">
                  <stop offset="0%" stopColor="#2a2f63" />
                  <stop offset="60%" stopColor="#141633" />
                  <stop offset="100%" stopColor="#0a0b1c" />
                </radialGradient>
                <filter id="glow" x="-200%" y="-200%" width="500%" height="500%">
                  <feGaussianBlur stdDeviation="2.2" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <rect width={width} height={height} fill="url(#sky)" onClick={() => setPick(null)} />
              {topics.map((t) => (
                <radialGradient key={`g-${t.id}`} id={`neb-${t.id}`}>
                  <stop offset="0%" stopColor={t.color} stopOpacity={0.32} />
                  <stop offset="60%" stopColor={t.color} stopOpacity={0.08} />
                  <stop offset="100%" stopColor={t.color} stopOpacity={0} />
                </radialGradient>
              ))}
              {dust.map((d, i) => (
                <circle key={`d${i}`} cx={d.x} cy={d.y} r={d.r} fill="#ffffff" opacity={d.o} pointerEvents="none" />
              ))}
              {clusters.map((c) => (
                <circle key={`neb-${c.key}`} cx={c.x} cy={c.y} r={60 + Math.sqrt(c.count) * 14} fill={`url(#neb-${c.topic})`} opacity={lit(c) ? 1 : 0.25} pointerEvents="none" />
              ))}
              {hull && (
                <circle cx={hull.x} cy={hull.y} r={62} fill="none" stroke="#f2b84b" strokeWidth={1.4} strokeDasharray="5 5" pointerEvents="none" />
              )}
              {lines.map(([x1, y1, x2, y2], i) => (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#d7dbff" strokeOpacity={only || pick ? 0.12 : 0.38} strokeWidth={0.8} pointerEvents="none" />
              ))}
              {stars.map((s) => {
                const on = lit(s);
                const faded = koOnly && !s.ko;
                return (
                  <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(null)}>
                    <circle
                      cx={s.x}
                      cy={s.y}
                      r={(koOnly && s.ko ? s.r + 1.6 : s.r) + (picked && on ? 0.8 : 0)}
                      fill={color(s.topic)}
                      opacity={(on ? 0.95 : 0.12) * (faded ? 0.3 : 1)}
                      filter="url(#glow)"
                      stroke={koOnly && s.ko ? "#fff" : "none"}
                      strokeWidth={0.8}
                    />
                  </a>
                );
              })}
              {clusters
                .filter((c) => c.count >= 3)
                .map((c) => {
                  const w = c.label.length * 12 + 30;
                  const x = Math.min(width - w / 2 - 6, Math.max(w / 2 + 6, c.x));
                  const active = pick?.cluster === c.key;
                  return (
                    <g
                      key={`lab-${c.key}`}
                      className="starmap-label"
                      opacity={(only && only !== c.topic) || (pick && !active && pick.cluster) ? 0.35 : 1}
                      onClick={() => chooseCluster(c)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && chooseCluster(c)}
                      aria-label={`${c.label} ${c.count}편 보기`}
                    >
                      <rect x={x - w / 2} y={c.y - 12} width={w} height={22} rx={11} fill={active ? "#f2b84b" : "#0d0f25"} fillOpacity={active ? 1 : 0.78} stroke="#ffffff" strokeOpacity={0.22} />
                      <text x={x} y={c.y + 4} textAnchor="middle" fill={active ? "#2b1d04" : "#f3f3ff"} fontSize={12} fontWeight={650}>
                        {c.label} <tspan fill={active ? "#5b4210" : "#9aa0d8"}>{c.count}</tspan>
                      </text>
                    </g>
                  );
                })}
            </svg>
            {hover && (
              <div className="starmap-tip" style={{ left: `${(hover.x / width) * 100}%`, top: `${(hover.y / height) * 100}%` }}>
                <b>{hover.title}</b>
                <span>{hover.date}</span>
              </div>
            )}
          </div>
        </div>

        <aside className="starmap-panel">
          <h2>{pick ? pick.label : "전체"}</h2>
          <p className="muted">{pick ? pick.desc : "별자리 이름이나 아래 핵심 키워드를 누르면 그 주제만 봅니다. 별을 누르면 논문 원문으로 갑니다."}</p>
          <p className="big">
            <b>{sel.length.toLocaleString()}</b> 논문 <b>{countries.size}</b> 개국 <b>{sel.filter((m) => m.ko).length}</b> 한국 논문
          </p>
          <h3>분야 구성</h3>
          <div className="bar">
            {byTopic.map((t) => (
              <span key={t.id} style={{ width: `${(t.n / total) * 100}%`, background: t.color }} title={`${t.label} ${t.n}`} />
            ))}
          </div>
          <p className="muted small">{byTopic.map((t) => `${t.label} ${Math.round((t.n / total) * 100)}%`).join(" · ")}</p>
          <h3>저자 소속 국가</h3>
          {topCountries.map(([c, n]) => (
            <div key={c} className="meter">
              <span>{countryName(c)}</span>
              <i>
                <i style={{ width: `${(n / topCountries[0][1]) * 100}%` }} />
              </i>
              <em>{n}</em>
            </div>
          ))}
          <h3>출판 연도</h3>
          {[...years]
            .sort((a, b) => b[0].localeCompare(a[0]))
            .slice(0, 4)
            .map(([y, n]) => (
              <div key={y} className="meter">
                <span>{y}</span>
                <i>
                  <i style={{ width: `${(n / total) * 100}%` }} />
                </i>
                <em>{n}</em>
              </div>
            ))}
          {pick && (
            <div className="starmap-actions">
              <button type="button" className="starmap-btn" onClick={showList}>
                이 주제 목록 보기
              </button>
              <button type="button" className="starmap-btn ghost" onClick={() => setPick(null)}>
                전체로 돌아가기
              </button>
            </div>
          )}
        </aside>
      </div>

      <section className="starmap-keywords">
        <h2>
          연구주제 핵심 키워드 <small>논문 제목(한국어)에 자주 나오는 말 · 누르면 지도와 패널이 그 주제로 바뀝니다</small>
        </h2>
        <div className="digest-chips">
          {keywords.map((k) => (
            <button
              key={k.word}
              type="button"
              className="digest-chip"
              aria-pressed={pick?.label === k.word && !pick.cluster}
              onClick={() => chooseKeyword(k)}
            >
              {k.word} <b>{k.count}</b>
            </button>
          ))}
        </div>
      </section>

      <section id="papers" className="starmap-list">
        <h2>논문 목록</h2>
        <ArchiveBrowser
          items={entries}
          tags={tags}
          facetLabel="모든 국가(저자 소속)"
          unit="편"
          restrict={listPick}
          onClearRestrict={() => setListPick(null)}
        />
      </section>
    </>
  );
}
