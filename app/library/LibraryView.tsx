"use client";

import { useState } from "react";
import { ArchiveBrowser, type Entry } from "../archive/browser";

type Col = { id: string; label: string; color: string };
type Row = { id: string; label: string; icon: string };
type DocMeta = { id: string; topics: string[]; category: string; issuer: string; publisher: string };

// 분야 × 문서 유형 지형도. 칸을 누르면 아래 목록이 그 조건으로 걸러진다
export function LibraryView({
  rows,
  cols,
  issuers,
  docs,
  entries,
  tags,
}: {
  rows: Row[];
  cols: Col[];
  issuers: { id: string; label: string }[];
  docs: DocMeta[];
  entries: Entry[];
  tags: string[];
}) {
  const [issuer, setIssuer] = useState("");
  const [pick, setPick] = useState<{ label: string; ids: string[] } | null>(null);
  const scoped = docs.filter((d) => !issuer || d.issuer === issuer);
  const cell = (r: string, c: string) => scoped.filter((d) => d.topics.includes(r) && d.category === c);
  const max = Math.max(1, ...rows.flatMap((r) => cols.map((c) => cell(r.id, c.id).length)));
  const stage = (r: string) => cols.filter((c) => cell(r, c.id).length > 0).length;
  const choose = (label: string, ids: string[]) => {
    setPick({ label, ids });
    document.getElementById("docs")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const wide = rows.filter((r) => stage(r.id) >= 3);
  const starting = rows.filter((r) => stage(r.id) > 0 && stage(r.id) < 3);
  const byPublisher = new Map<string, number>();
  scoped.forEach((d) => byPublisher.set(d.publisher, (byPublisher.get(d.publisher) ?? 0) + 1));

  return (
    <>
      <div className="lib-grid">
        <section className="lib-card">
          <div className="lib-head">
            <div>
              <h2>분야별 국제 감시 지형</h2>
              <p className="muted">분야마다 어떤 형태의 국제 문서가 나와 있는지 셉니다. 칸을 누르면 아래 목록이 그 조건으로 걸러집니다.</p>
            </div>
          </div>
          <div className="lib-issuers">
            <span>발간 주체</span>
            {[{ id: "", label: "전체" }, ...issuers].map((i) => (
              <button key={i.id} type="button" aria-pressed={issuer === i.id} onClick={() => setIssuer(i.id)}>
                {i.label}
              </button>
            ))}
          </div>
          <div className="lib-scroll">
          <div className="lib-table" style={{ gridTemplateColumns: `minmax(150px, 1.4fr) repeat(${cols.length}, minmax(44px, 1fr)) 76px` }}>
            <span />
            {cols.map((c) => (
              <span key={c.id} className="lib-col">
                <i style={{ background: c.color }} />
                {c.label}
              </span>
            ))}
            <span className="lib-col">단계</span>
            {rows.map((r) => {
              const s = stage(r.id);
              return [
                <button key={`${r.id}-l`} type="button" className="lib-row" onClick={() => choose(r.label, scoped.filter((d) => d.topics.includes(r.id)).map((d) => d.id))}>
                  <span aria-hidden="true">{r.icon}</span> {r.label}
                </button>,
                ...cols.map((c) => {
                  const ds = cell(r.id, c.id);
                  return ds.length ? (
                    <button
                      key={`${r.id}-${c.id}`}
                      type="button"
                      className="lib-cell"
                      style={{ background: c.color, opacity: 0.35 + (0.65 * ds.length) / max }}
                      title={`${r.label} · ${c.label} ${ds.length}건`}
                      onClick={() => choose(`${r.label} · ${c.label}`, ds.map((d) => d.id))}
                    >
                      {ds.length}
                    </button>
                  ) : (
                    <span key={`${r.id}-${c.id}`} className="lib-cell empty">–</span>
                  );
                }),
                <span key={`${r.id}-s`} className={`lib-stage ${s >= 3 ? "on" : s ? "start" : "none"}`}>
                  {s >= 3 ? "다층 감시" : s ? "감시 시작" : "공백"}
                </span>,
              ];
            })}
          </div>
          </div>
          <p className="lib-legend">
            {cols.map((c) => (
              <span key={c.id}>
                <i style={{ background: c.color }} /> {c.label}
              </span>
            ))}
            <span>· 진할수록 문서가 많음</span>
          </p>
        </section>

        <aside className="lib-card lib-side">
          <h2>전체 개요</h2>
          <p className="muted">분야를 국제 문서가 쌓인 정도로 묶었습니다. 누르면 아래 목록이 그 분야로 걸러집니다.</p>
          <h3>■ 문서 유형 3가지 이상으로 감시되는 분야</h3>
          <div className="digest-chips">
            {wide.map((r) => (
              <button key={r.id} type="button" className="digest-chip" onClick={() => choose(r.label, scoped.filter((d) => d.topics.includes(r.id)).map((d) => d.id))}>
                {r.icon} {r.label}
              </button>
            ))}
          </div>
          <h3>■ 감시가 시작된 분야</h3>
          <div className="digest-chips">
            {starting.map((r) => (
              <button key={r.id} type="button" className="digest-chip" onClick={() => choose(r.label, scoped.filter((d) => d.topics.includes(r.id)).map((d) => d.id))}>
                {r.icon} {r.label}
              </button>
            ))}
          </div>
          <h3>발간 기관</h3>
          {[...byPublisher]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([p, n]) => (
              <div key={p} className="meter">
                <span>{p.replace("유엔 ", "")}</span>
                <i>
                  <i style={{ width: `${(n / scoped.length) * 100}%` }} />
                </i>
                <em>{n}</em>
              </div>
            ))}
          <p className="muted small">분야는 문서 제목·설명의 낱말로 나눕니다. '포괄'은 북한 인권 상황 전반을 다루는 문서입니다.</p>
        </aside>
      </div>

      <section id="docs" className="starmap-list">
        <h2>문서 목록</h2>
        <ArchiveBrowser items={entries} tags={tags} facetLabel="모든 발간 기관" unit="건" restrict={pick} onClearRestrict={() => setPick(null)} />
      </section>
    </>
  );
}
