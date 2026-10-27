"use client";

import { useState } from "react";
import type { Cluster, Star } from "./map";

// 별자리 지도: 분야 단추로 거르고, 별에 올리면 제목이 보이고, 누르면 원문으로 간다
export function StarMap({
  width,
  height,
  stars,
  clusters,
  lines,
  topics,
}: {
  width: number;
  height: number;
  stars: Star[];
  clusters: Cluster[];
  lines: [number, number, number, number][];
  topics: { id: string; label: string; color: string; count: number }[];
}) {
  const [only, setOnly] = useState("");
  const [koOnly, setKoOnly] = useState(false);
  const [hover, setHover] = useState<Star | null>(null);
  const dim = (topic: string) => (only && only !== topic ? 0.12 : 1);
  return (
    <div className="starmap-wrap">
      <div className="starmap-legend">
        {topics.map((t) => (
          <button key={t.id} type="button" aria-pressed={only === t.id} onClick={() => setOnly(only === t.id ? "" : t.id)}>
            <i style={{ background: t.color }} /> {t.label} {t.count}
          </button>
        ))}
        <label>
          <input type="checkbox" checked={koOnly} onChange={(e) => setKoOnly(e.target.checked)} /> 한국 논문 강조
        </label>
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
          <rect width={width} height={height} fill="url(#sky)" />
          {clusters.map((c) => (
            <circle key={`neb-${c.key}`} cx={c.x} cy={c.y} r={30 + Math.sqrt(c.count) * 9} fill={topics.find((t) => t.id === c.topic)?.color} opacity={0.07 * dim(c.topic)} />
          ))}
          {lines.map(([x1, y1, x2, y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#c9cdf5" strokeOpacity={only ? 0.08 : 0.22} strokeWidth={0.6} />
          ))}
          {stars.map((s) => {
            const color = topics.find((t) => t.id === s.topic)?.color;
            const faded = koOnly && !s.ko;
            return (
              <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(null)}>
                <circle
                  cx={s.x}
                  cy={s.y}
                  r={koOnly && s.ko ? s.r + 1.6 : s.r}
                  fill={color}
                  opacity={dim(s.topic) * (faded ? 0.25 : 0.95)}
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
              return (
                <g key={`lab-${c.key}`} opacity={only && only !== c.topic ? 0.15 : 1} pointerEvents="none">
                  <rect x={x - w / 2} y={c.y - 12} width={w} height={22} rx={11} fill="#0d0f25" fillOpacity={0.78} stroke="#ffffff" strokeOpacity={0.22} />
                  <text x={x} y={c.y + 4} textAnchor="middle" fill="#f3f3ff" fontSize={12} fontWeight={650}>
                    {c.label} <tspan fill="#9aa0d8">{c.count}</tspan>
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
  );
}
