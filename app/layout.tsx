import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { site } from "@/lib/site";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.homeTitle, template: `%s | ${site.name}·${site.nameEn}` },
  description: site.description,
  openGraph: {
    type: "website",
    siteName: `${site.name}·${site.nameEn}`,
    locale: "zh_CN",
    title: site.homeTitle,
    description: site.description,
    url: site.url,
  },
  twitter: { card: "summary", title: site.homeTitle, description: site.description },
};

// 结构化数据：告诉搜索引擎这是一个什么站（文章页另有 Article 结构化数据，见 ArticleShell）
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: `${site.name}·${site.nameEn}`,
  url: site.url,
  description: site.description,
  inLanguage: "zh-CN",
  publisher: { "@type": "Organization", name: `${site.name}·${site.nameEn}` },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const adsClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || site.adsClient;
  const gaId = process.env.NEXT_PUBLIC_GA_ID || site.gaId;
  return (
    <html lang="zh-CN">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        {adsClient && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsClient}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
        {gaId && (
          <>
            <Script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');`}
            </Script>
          </>
        )}
        <Header />
        <main className="page-wrap">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
