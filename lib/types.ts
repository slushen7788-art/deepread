export interface ArticleMeta {
  slug: string;
  title: string;
  excerpt: string;
  // 搜索专用标题/描述（可选）：只影响 <title> 与搜索结果，站内 H1 与卡片仍用 title/excerpt
  seoTitle?: string;
  seoDescription?: string;
  date: string; // YYYY-MM-DD
  category: string; // 显示名，如 企业 AI
  categorySlug: string; // URL 用，如 enterprise-ai
  tags: string[];
  source: { title: string; url: string; outlet: string };
  readingMinutes: number;
  featured?: boolean;
  toc?: { id: string; label: string }[];
}
