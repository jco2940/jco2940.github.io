import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PROFILE } from "../../../site.config";
import writing from "../../data/writing.json";

export function generateStaticParams() {
  return writing.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = writing.find((p) => p.slug === slug);
  return { title: post ? `${post.title} | ${PROFILE.name}` : PROFILE.name, description: post?.summary };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = writing.find((p) => p.slug === slug);
  if (!post) notFound();

  return (
    <main className="inner-page">
      <article className="post">
        <p className="eyebrow">
          {post.category} · <time>{post.date}</time>
        </p>
        <h1>{post.title}</h1>
        {post.body.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
        <Link href="/writing" className="back-link">
          ← 글 목록
        </Link>
      </article>
    </main>
  );
}
