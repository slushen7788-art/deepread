import Link from "next/link";
import { notFound } from "next/navigation";
import articlesJson from "@/lib/articles.generated.json";
import type { ArticleMeta } from "@/lib/types";

const articles = articlesJson as ArticleMeta[];

export function generateStaticParams() {
  return [...new Set(articles.map((a) => a.categorySlug))].map((slug) => ({ slug }));
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const list = articles.filter((a) => a.categorySlug === slug);
  if (list.length === 0) notFound();
  const name = list[0].category;
  return (
    <div>
      <div className="sec-title">
        <span>分类 · {name}</span>
      </div>
      {list.map((a) => (
        <Link key={a.slug} href={`/articles/${a.slug}`} className="article-row">
          <div className="row-thumb">{a.category.slice(0, 2)}</div>
          <div>
            <h3>{a.title}</h3>
            <p>{a.excerpt}</p>
            <div className="card-meta">
              {a.date} · {a.category} · 原文：{a.source.outlet}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
