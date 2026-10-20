# 精读 · DEEPREAD（精读文章站）

Next.js（App Router）+ TypeScript。每篇文章是一个独立的 TSX 页面，提交到 GitHub 后由 Vercel 自动部署。

## 本地运行

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # 构建前会自动运行 scripts/gen-index.mjs 刷新文章索引
```

## 新增一篇文章（4 步）

1. 在 `app/articles/` 下新建文件夹，文件夹名就是文章 slug，如 `app/articles/my-article/`
2. 复制 `app/articles/_template/meta.template.json` 为该文件夹里的 `meta.json`，填好标题、摘要、日期、分类、标签、原文出处
3. 复制 `app/articles/_template/page.template.tsx.txt` 为 `page.tsx`，把正文换成你的内容
   （结构参考现成的 `app/articles/fde-bubble/page.tsx`；小节标题记得带 `id="sec-N"` 并同步写进 meta.json 的 toc）
4. `git add . && git commit && git push` —— 首页列表、分类页、搜索、sitemap、RSS 都靠构建时扫描 meta.json 自动收录，不用改任何清单文件

正文里放广告位：`<AdSlot slot="in-article" />`（建议正文约 1/3 处一个、文末已有外壳自带的一个，不要在第一段之前放）。

## 上线（Vercel）

1. 用 GitHub 账号 **slushen7788-art** 登录 Vercel，Import 这个仓库
2. 在 Vercel 项目 Settings → Environment Variables 里填：
   - `NEXT_PUBLIC_SITE_URL` = 你的正式域名（如 https://xxx.com）
3. 绑定自定义域名（Vercel 项目 Settings → Domains，按提示改 DNS）
4. `public/ads.txt` 已写好真实发布商 ID（pub-2463152068592975），无需改动

注意：Vercel Hobby 免费版禁止商用（挂广告算商用），挂 AdSense 需开 Pro（$20/月），或改部署到 Cloudflare Pages。

## 上线前待替换的占位

- [ ] `lib/site.ts`：作者署名、联系邮箱
- [ ] Vercel 环境变量：只需填域名 NEXT_PUBLIC_SITE_URL（AdSense ID 已内置在代码里）
- [ ] `app/privacy/page.tsx`：核对隐私政策里的运营者信息

## 广告位说明

AdSense 发布商 ID 已内置在 `lib/site.ts`（ca-pub-2463152068592975），广告位会直接渲染真实广告；如需换发布商 ID，改 `lib/site.ts` 一处即可。AdSense 的 JS 只在根 `app/layout.tsx` 加载一次，文章里只写 `<AdSlot />`。
