"use client";
import { useState } from "react";
import Link from "next/link";
import type { ArticleMeta } from "@/lib/types";

// 文章列表（首页「最新精读」用）：首屏渲染 pageSize 篇，点「加载更多」逐批展开。
// 数据是构建时生成的静态索引、随页面一起下发，展开不需要再发请求；
// 全量列表保留在各分类页，搜索引擎可以顺分类页和 sitemap 抓到每一篇。
const PAGE_SIZE = 10;

export default function ArticleList({ articles }: { articles: ArticleMeta[] }) {
  const [shown, setShown] = useState(PAGE_SIZE);
  const visible = articles.slice(0, shown);
  const hasMore = shown < articles.length;
  return (
    <div>
      {visible.map((a) => (
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
      {hasMore && (
        <div className="load-more-wrap">
          <button type="button" className="load-more-btn" onClick={() => setShown((s) => s + PAGE_SIZE)}>
            加载更多
          </button>
          <div className="load-more-count">
            已显示 {visible.length} / 共 {articles.length} 篇 · 全量文章在各分类页
          </div>
        </div>
      )}
    </div>
  );
}
