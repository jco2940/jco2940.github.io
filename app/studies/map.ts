import { STUDIES, STUDY_TOPICS, type Paper } from "./data";

// 북한 사회 연구 '별자리 지도': 논문을 분야(색)와 제목의 핵심 키워드(별자리)로 묶어 2차원에 놓는다.
// 위치는 빌드할 때 정해지고(논문 id 의 해시로 흩뿌림), 같은 데이터면 늘 같은 지도가 나온다.

export const TOPIC_COLORS: Record<string, string> = {
  diaspora: "#5aa9ff",
  economy: "#f2b84b",
  education: "#7ad3a0",
  women: "#ff8fb1",
  health: "#ff7a59",
  youth: "#c9a7ff",
  politics: "#e0e0e0",
  disability: "#5ee0e0",
  elderly: "#b8b07a",
};

const STOP = new Set(
  "북한 북한의 북한에서 북한과 북한은 북한이 조선 조선민주주의인민공화국 한국 남한 연구 분석 사례 중심 대한 관한 통한 위한 따른 미치는 영향 효과 관계 문제 과정 의미 고찰 탐색 검토 이해 시대 이후 이전 통해 대해 위해 사이 경우 가지 요인 특성 중심으로 함의 변화 현황 실태 방안 모델 접근 관점 측면 기반 결과 경험 연구의 그리고 또는 나타난 미치 비교 인식 질적 활용한 김정 국가 대한민국 어떻게 무엇 새로운 따라 현재 최근 주요 기간 정도 결정 측정 평가 이용 사용 조사 데이터 국경 미국 중국 러시아 여성 교육 경제 정치 노인 장애 청소년 청년 보건 의료 the of and in on for a to from with by north korea korean dprk".split(" "),
);
const PARTICLE = /(에서의|에서|으로의|으로|에게|까지|부터|이다|과의|와의|들의|들은|들이|들을|들|은|는|이|가|을|를|의|에|도|로|과|와)$/;

function words(title: string) {
  return [
    ...new Set(
      title
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .map((w) => (w.length >= 3 ? w.replace(PARTICLE, "") : w))
        .filter((w) => w.length >= 2 && /[가-힣]/.test(w) && !STOP.has(w)),
    ),
  ];
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967295;
}

export type Star = { id: string; x: number; y: number; r: number; topic: string; title: string; url: string; date: string; ko: boolean; cluster: string };
export type Cluster = { key: string; label: string; topic: string; x: number; y: number; count: number };

const W = 1000;
const H = 620;

export function buildMap() {
  const papers = STUDIES.items;
  const mainTopic = (p: Paper) => STUDY_TOPICS.find((t) => p.topics.includes(t.id))?.id ?? "politics";
  const topics = STUDY_TOPICS.map((t) => t.id).filter((id) => papers.some((p) => mainTopic(p) === id));

  // 분야마다 자리를 타원 위에 고르게 나눈다(논문이 많은 분야를 가운데 가깝게)
  const sizes = Object.fromEntries(topics.map((t) => [t, papers.filter((p) => mainTopic(p) === t).length]));
  const order = [...topics].sort((a, b) => sizes[b] - sizes[a]);
  const centers: Record<string, { x: number; y: number }> = {};
  // 큰 분야와 작은 분야가 번갈아 오도록 놓아 한쪽으로 몰리지 않게 한다
  const placed = order.map((_, i) => (i % 2 ? order[order.length - 1 - (i >> 1)] : order[i >> 1]));
  placed.forEach((t, i) => {
    const angle = (i / placed.length) * Math.PI * 2 - Math.PI / 2;
    centers[t] = { x: W / 2 + Math.cos(angle) * W * 0.33, y: H / 2 + Math.sin(angle) * H * 0.33 };
  });

  const clusters: Cluster[] = [];
  const stars: Star[] = [];
  for (const t of order) {
    const group = papers.filter((p) => mainTopic(p) === t);
    const counts = new Map<string, number>();
    group.forEach((p) => words(p.titleKo ?? p.title).forEach((w) => counts.set(w, (counts.get(w) ?? 0) + 1)));
    // 그 분야에서 자주 나오는 낱말 2~4개가 별자리 이름이 된다
    const top = [...counts].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]).slice(0, group.length > 60 ? 4 : 2).map(([w]) => w);
    const label: string = STUDY_TOPICS.find((x) => x.id === t)!.label;
    const c = centers[t];
    const spots: { key: string; label: string; kw: string; x: number; y: number }[] = [{ key: `${t}:`, label, kw: "", x: c.x, y: c.y }];
    top.forEach((kw, i) => {
      const a = (i / Math.max(top.length, 1)) * Math.PI * 2 + hash(t) * 6;
      spots.push({ key: `${t}:${kw}`, label: kw, kw, x: c.x + Math.cos(a) * 95, y: c.y + Math.sin(a) * 62 });
    });
    for (const p of group) {
      const ws = words(p.titleKo ?? p.title);
      const spot = spots.find((s) => s.kw && ws.includes(s.kw)) ?? spots[0];
      const a = hash(p.id) * Math.PI * 2;
      const d = Math.sqrt(hash(`${p.id}#`)) * (spot.kw ? 55 : 70);
      stars.push({
        id: p.id,
        x: Math.min(W - 8, Math.max(8, spot.x + Math.cos(a) * d)),
        y: Math.min(H - 8, Math.max(8, spot.y + Math.sin(a) * d * 0.8)),
        r: 1.4 + Math.min(p.topics.length, 3) * 0.7,
        topic: t,
        title: p.titleKo ?? p.title,
        url: p.url,
        date: p.date,
        ko: p.lang === "ko" || p.countries.includes("KR"),
        cluster: spot.key,
      });
    }
    for (const s of spots) {
      const count = stars.filter((x) => x.cluster === s.key).length;
      if (count > 0) clusters.push({ key: s.key, label: s.label, topic: t, x: s.x, y: s.y, count });
    }
  }

  // 별자리 선: 같은 묶음 안에서 가까운 별끼리 잇는다
  const lines: [number, number, number, number][] = [];
  for (const c of clusters) {
    const group = stars.filter((s) => s.cluster === c.key).slice(0, 40);
    group.forEach((s, i) => {
      if (i === 0 || i % 2) return;
      const near = group.slice(0, i).sort((a, b) => Math.hypot(a.x - s.x, a.y - s.y) - Math.hypot(b.x - s.x, b.y - s.y))[0];
      if (Math.hypot(near.x - s.x, near.y - s.y) < 45) lines.push([near.x, near.y, s.x, s.y]);
    });
  }

  // 핵심 키워드 전체(분야 구분 없이)
  const all = new Map<string, number>();
  papers.forEach((p) => words(p.titleKo ?? p.title).forEach((w) => all.set(w, (all.get(w) ?? 0) + 1)));
  const keywords = [...all].filter(([, n]) => n >= 4).sort((a, b) => b[1] - a[1]).slice(0, 40);

  return { width: W, height: H, stars, clusters, lines, keywords, topics: order };
}
