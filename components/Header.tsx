import Link from "next/link";
import { site } from "@/lib/site";
import SearchBox from "./SearchBox";
import articles from "@/lib/articles.generated.json";
import type { ArticleMeta } from "@/lib/types";

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="logo">
          {site.name}
          <span className="logo-dot">·</span>
          {site.nameEn}
        </Link>
        <nav className="main-nav">
          <Link href="/">最新</Link>
          <Link href="/about">关于</Link>
        </nav>
        <SearchBox articles={articles as ArticleMeta[]} variant="header" />
      </div>
    </header>
  );
}
