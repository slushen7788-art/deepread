// 全站配置：上线前把这里的占位信息换成真实信息
export const site = {
  name: "精读",
  nameEn: "DEEPREAD",
  // 正式域名优先读环境变量 NEXT_PUBLIC_SITE_URL，没配时用占位
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",
  tagline: "每天精读一篇值得读的原文",
  description:
    "每篇精读只做三件事：先定主线，再拆核心机制，最后给出核实过的第一手判断。",
  author: "主理人", // TODO: 换成你的署名
  // AdSense 发布商 ID（用户 2026-10-20 提供；Vercel 环境变量 NEXT_PUBLIC_ADSENSE_CLIENT 可覆盖）
  adsClient: "ca-pub-2463152068592975",
  contactEmail: "wtechtec@gmail.com",
};
