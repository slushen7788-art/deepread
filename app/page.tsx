import Link from "next/link";
import articlesJson from "@/lib/articles.generated.json";
import type { ArticleMeta } from "@/lib/types";
import SearchBox from "@/components/SearchBox";
import { site } from "@/lib/site";

const articles = articlesJson as ArticleMeta[];

export default function Home() {
  const featured = articles.find((a) => a.featured) ?? articles[0];
  const rest = articles.filter((a) => a !== featured);
  const cats = [...new Map(articles.map((a) => [a.categorySlug, a.category])).entries()];
  return (
    <div>
      <section className="hero">
        <div className="kicker">每天一篇 · 只读值得读的</div>
        <h1 className="hero-title">原文太长，我替你读完并给出判断</h1>
        <p className="hero-sub">{site.description}</p>
        <SearchBox articles={articles} variant="hero" />
        <div className="tag-row">
          <span className="chip on">全部</span>
          {cats.map(([slug, name]) => (
            <Link key={slug} className="chip" href={`/category/${slug}`}>
              {name}
            </Link>
          ))}
        </div>
      </section>

      {featured && (
        <Link href={`/articles/${featured.slug}`} className="featured-card">
          <div className="featured-tag">本期精选 · {featured.category}</div>
          <h2>{featured.title}</h2>
          <p>{featured.excerpt}</p>
          <div className="card-meta">
            {featured.date} · 读完约 {featured.readingMinutes} 分钟 · 原文：{featured.source.outlet}《{featured.source.title}》
          </div>
        </Link>
      )}


      <div className="sec-title">
        <span>最新精读</span>
      </div>
      <div>
        {rest.map((a) => (
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
        {rest.length === 0 && <p className="empty-note">更多精读正在路上。</p>}
      </div>

    </div>
  );
}
