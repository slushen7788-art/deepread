// 构建前运行：扫描 app/articles/*/meta.json，生成 lib/articles.generated.json
// 新增文章只要按约定放好 meta.json + page.tsx，首页/分类/sitemap/搜索都会自动收录
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const dir = join(root, "app", "articles");
const out = [];
for (const name of readdirSync(dir)) {
  if (name.startsWith("_") || name.startsWith(".")) continue;
  const metaPath = join(dir, name, "meta.json");
  if (!existsSync(metaPath)) continue;
  const meta = JSON.parse(readFileSync(metaPath, "utf8"));
  if (meta.slug !== name) {
    console.warn(`[gen-index] 警告：目录 ${name} 与 meta.slug ${meta.slug} 不一致`);
  }
  out.push(meta);
}
out.sort((a, b) => (a.date < b.date ? 1 : -1));
writeFileSync(
  join(root, "lib", "articles.generated.json"),
  JSON.stringify(out, null, 2) + "\n"
);
console.log(`[gen-index] 收录 ${out.length} 篇文章`);
