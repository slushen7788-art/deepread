import { site } from "@/lib/site";
import articlesJson from "@/lib/articles.generated.json";
import type { ArticleMeta } from "@/lib/types";

export const dynamic = "force-static";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function GET() {
  const articles = articlesJson as ArticleMeta[];
  const items = articles
    .map(
      (a) => `<item><title>${esc(a.title)}</title><link>${site.url}/articles/${a.slug}</link><description>${esc(a.excerpt)}</description><pubDate>${new Date(a.date).toUTCString()}</pubDate><guid>${site.url}/articles/${a.slug}</guid></item>`
    )
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(site.name)}</title><link>${site.url}</link><description>${esc(site.description)}</description>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
