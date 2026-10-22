import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "../components";
import { PROFILE } from "../../site.config";
import writing from "../data/writing.json";

export const metadata: Metadata = { title: `글 | ${PROFILE.name}` };

export default function WritingPage() {
  const posts = [...writing].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <main className="inner-page">
      <PageIntro eyebrow="WRITING" title="글" lead={`블로그, 에세이, 메모 ${posts.length}편`} />
      <div className="index-list">
        {posts.map((post) => (
          <Link key={post.slug} href={`/writing/${post.slug}`} className="index-row">
            <time>{post.date}</time>
            <span>
              <span className="kind">{post.category}</span>
              <h2>{post.title}</h2>
              <p>{post.summary}</p>
            </span>
            <span aria-hidden="true">→</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
