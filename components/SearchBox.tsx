"use client";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { ArticleMeta } from "@/lib/types";

// 第一版搜索：按标题 / 摘要 / 标签 / 分类在本地索引里匹配，输入即出结果
export default function SearchBox({
  articles,
  variant = "hero",
}: {
  articles: ArticleMeta[];
  variant?: "hero" | "header";
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const results = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return [];
    return articles
      .filter((a) =>
        [a.title, a.excerpt, a.category, ...a.tags]
          .join(" ")
          .toLowerCase()
          .includes(kw)
      )
      .slice(0, 6);
  }, [q, articles]);
  return (
    <div className={`search ${variant}`} ref={boxRef}>
      <div className="search-input">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.8-3.8" />
        </svg>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="搜索标题、标签、原文出处…"
          aria-label="搜索文章"
        />
        {variant === "hero" && <kbd>⌘K</kbd>}
      </div>
      {open && q.trim() && (
        <div className="search-results">
          {results.length === 0 && <div className="search-empty">没有找到相关文章</div>}
          {results.map((a) => (
            <Link key={a.slug} href={`/articles/${a.slug}`} className="search-item">
              <span className="search-item-title">{a.title}</span>
              <span className="search-item-meta">
                {a.date} · {a.category} · 原文：{a.source.outlet}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
