import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { site } from "@/lib/site";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name}·${site.nameEn} | ${site.tagline}`, template: `%s | ${site.name}·${site.nameEn}` },
  description: site.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const adsClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || site.adsClient;
  return (
    <html lang="zh-CN">
      <body>
        {adsClient && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsClient}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
        <Header />
        <main className="page-wrap">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
