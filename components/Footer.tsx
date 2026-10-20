import Link from "next/link";
import { site } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <span>
          © {new Date().getFullYear()} {site.name} {site.nameEn}
        </span>
        <nav>
          <Link href="/about">关于</Link>
          <Link href="/privacy">隐私政策</Link>
          <a href="/feed.xml">RSS</a>
        </nav>
      </div>
    </footer>
  );
}
