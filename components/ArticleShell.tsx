import Link from "next/link";
import type { ReactNode } from "react";
import type { ArticleMeta } from "@/lib/types";
import { site } from "@/lib/site";

// 文章页公共外壳：标题区、出处卡、目录、上下篇都在这里
// 每篇文章的 page.tsx 只写 meta 和正文，版式改这里就全站生效
export default function ArticleShell({
  meta,
  prev,
  next,
  children,
}: {
  meta: ArticleMeta;
  prev?: { slug: string; title: string };
  next?: { slug: string; title: string };
  children: ReactNode;
}) {
  // 结构化数据：每篇文章向搜索引擎声明标题、日期、作者、出处分类
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: meta.title,
    description: meta.seoDescription ?? meta.excerpt,
    datePublished: meta.date,
    author: { "@type": "Person", name: site.author },
    publisher: { "@type": "Organization", name: `${site.name}·${site.nameEn}` },
    mainEntityOfPage: `${site.url}/articles/${meta.slug}`,
    inLanguage: "zh-CN",
    articleSection: meta.category,
    keywords: meta.tags.join("，"),
  };
  return (
    <article className="article">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <div className="crumb">
        <Link href="/">首页</Link> /{" "}
        <Link href={`/category/${meta.categorySlug}`} className="crumb-cat">
          {meta.category}
        </Link>{" "}
        / {meta.title.slice(0, 18)}…
      </div>
      <div className="tag-row">
        <Link className="chip on" href={`/category/${meta.categorySlug}`}>
          {meta.category}
        </Link>
        {meta.tags.map((t) => (
          <span key={t} className="chip">
            {t}
          </span>
        ))}
      </div>
      <h1 className="article-title">{meta.title}</h1>
      <p className="article-dek">{meta.excerpt}</p>
      <div className="byline">
        <span className="avatar">{site.author.slice(0, 1)}</span>
        <span className="byline-author">{site.author}</span>
        <span>{meta.date}</span>
        <span>读完约 {meta.readingMinutes} 分钟</span>
      </div>
      <a className="source-card" href={meta.source.url} target="_blank" rel="noreferrer">
        <span>
          原文出处：<strong>{meta.source.title}</strong> · {meta.source.outlet}
        </span>
        <span className="source-go">查看原文 →</span>
      </a>
      <div className="article-cols">
        {meta.toc && meta.toc.length > 0 && (
          <aside className="toc">
            <div className="toc-title">本页目录</div>
            {meta.toc.map((s) => (
              <a key={s.id} href={`#${s.id}`}>
                {s.label}
              </a>
            ))}
          </aside>
        )}
        <div className="article-body">{children}</div>
      </div>
      {(prev || next) && (
        <nav className="prev-next">
          <div>
            {prev && (
              <Link href={`/articles/${prev.slug}`}>
                <small>← 上一篇</small>
                <p>{prev.title}</p>
              </Link>
            )}
          </div>
          <div className="pn-next">
            {next && (
              <Link href={`/articles/${next.slug}`}>
                <small>下一篇 →</small>
                <p>{next.title}</p>
              </Link>
            )}
          </div>
        </nav>
      )}
    </article>
  );
}
