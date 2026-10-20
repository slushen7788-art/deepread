export interface ArticleMeta {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // YYYY-MM-DD
  category: string; // 显示名，如 企业 AI
  categorySlug: string; // URL 用，如 enterprise-ai
  tags: string[];
  source: { title: string; url: string; outlet: string };
  readingMinutes: number;
  featured?: boolean;
  toc?: { id: string; label: string }[];
}
