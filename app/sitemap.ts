import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import articlesJson from "@/lib/articles.generated.json";
import type { ArticleMeta } from "@/lib/types";

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = articlesJson as ArticleMeta[];
  const cats = [...new Set(articles.map((a) => a.categorySlug))];
  return [
    { url: `${site.url}/`, lastModified: new Date() },
    { url: `${site.url}/about`, lastModified: new Date() },
    { url: `${site.url}/privacy`, lastModified: new Date() },
    ...cats.map((c) => ({ url: `${site.url}/category/${c}`, lastModified: new Date() })),
    ...articles.map((a) => ({
      url: `${site.url}/articles/${a.slug}`,
      lastModified: new Date(a.date),
    })),
  ];
}
