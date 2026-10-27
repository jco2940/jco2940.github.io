import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "../components";
import { PROFILE } from "../../site.config";
import writing from "../data/writing.json";
import blog from "../data/blog.json";

export const metadata: Metadata = { title: `글 | ${PROFILE.name}` };

type BlogPost = { id: string; title: string; url: string; date: string; category: string; summary: string };

// 사이트에 직접 쓴 글과 네이버 블로그 글(scripts/collect-blog.mjs 가 모음)을 한 목록으로 보여 준다
export default function WritingPage() {
  const posts = [
    ...writing.map((p) => ({ key: p.slug, href: `/writing/${p.slug}`, external: false, date: p.date.replaceAll(".", "-"), kind: p.category, title: p.title, summary: p.summary })),
    ...(blog.items as BlogPost[]).map((p) => ({ key: p.id, href: p.url, external: true, date: p.date, kind: `네이버 블로그 · ${p.category}`, title: p.title, summary: p.summary })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <main className="inner-page">
      <PageIntro
        eyebrow="WRITING"
        title="글"
        lead={`블로그, 에세이, 메모 ${posts.length}편 · 블로그 글은 네이버 블로그 원문으로 연결됩니다`}
      />
      <p className="archive-shortcuts">
        <a href="https://blog.naver.com/jco2940">네이버 블로그 바로가기 ↗</a>
      </p>
      <div className="index-list">
        {posts.map((post) => {
          const body = (
            <>
              <time>{post.date.replaceAll("-", ".")}</time>
              <span>
                <span className="kind">{post.kind}</span>
                <h2>{post.title}</h2>
                {post.summary && <p>{post.summary}</p>}
              </span>
              <span aria-hidden="true">{post.external ? "↗" : "→"}</span>
            </>
          );
          return post.external ? (
            <a key={post.key} href={post.href} className="index-row" target="_blank" rel="noopener noreferrer">
              {body}
            </a>
          ) : (
            <Link key={post.key} href={post.href} className="index-row">
              {body}
            </Link>
          );
        })}
      </div>
    </main>
  );
}
