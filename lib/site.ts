// 全站配置：上线前把这里的占位信息换成真实信息
export const site = {
  name: "精读",
  nameEn: "DEEPREAD",
  // 正式域名优先读环境变量 NEXT_PUBLIC_SITE_URL，没配时用正式域名（用户 2026-10-21 告知）
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://best.xujingyichang.top",
  tagline: "每天精读一篇值得读的原文",
  // 首页 <title>（SEO 用，带品类关键词；与站内展示的 tagline 分开）
  homeTitle: "精读·DEEPREAD｜AI 解读与精读：看懂 AI 新模型、新概念与真假判断",
  description:
    "每天替你把 AI 领域的新东西看懂、判断真假，再用人话讲明白。AI 模型发布、智能体工程、前沿论文的可视化精读，配机制图拆解核心原理，给出核实过的第一手判断——能翻、能搜、能信。",
  author: "须鲸",
  // AdSense 发布商 ID（用户 2026-10-20 提供；Vercel 环境变量 NEXT_PUBLIC_ADSENSE_CLIENT 可覆盖）
  adsClient: "ca-pub-2463152068592975",
  // Google Analytics 衡量 ID（用户 2026-10-20 提供；环境变量 NEXT_PUBLIC_GA_ID 可覆盖）
  gaId: "G-RV7HB0DDL2",
  contactEmail: "wtechtec@gmail.com",
};
