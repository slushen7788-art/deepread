import type { Metadata } from "next";
import ArticleShell from "@/components/ArticleShell";
import metaJson from "./meta.json";
import type { ArticleMeta } from "@/lib/types";

const meta = metaJson as ArticleMeta;
export const metadata: Metadata = {
  title: meta.seoTitle ?? meta.title,
  description: meta.seoDescription ?? meta.excerpt,
  openGraph: {
    title: meta.seoTitle ?? meta.title,
    description: meta.seoDescription ?? meta.excerpt,
    type: "article",
    publishedTime: meta.date,
  },
  twitter: {
    card: "summary",
    title: meta.seoTitle ?? meta.title,
    description: meta.seoDescription ?? meta.excerpt,
  },
};

export default function Page() {
  return (
    <ArticleShell meta={meta} prev={{ slug: "critical-thinking-when-agents-do-the-work", title: "Agent 交活之后，验收从逐行读过，移到了事先定好什么算验过" }}>
      <div>
        <p>长会话 agent 越跑越慢，慢的地方不在模型读多少，而在每轮都要把历史再发一遍。Messages API 本来是无状态的，每轮都是独立请求，客户端只能把全部历史塞进请求体；会话到几十万 token 时，上传、校验、分词这三步发生在模型出第一个 token 之前，历史越长等得越久。消息线程的做法是把会话从请求体里抽出来，存在服务端内存里，首请求发全量建线程，之后每轮只发新增消息和上一条响应的 ID，模型每轮仍读全文，token 用量不变，省的是首 token 之前的等待。</p>
        <p>用法就一个 thread 参数加一个 beta 头。首请求照常发全量对话、system、tools，再加 thread create，API 把对话连同回复存在响应 ID 下面。后续每轮只发上轮之后的新消息，加 thread continue 和上一条 ID，system 和 tools 不再发，线程沿用建线程时的值，每轮用新响应的 ID 续下一轮。SDK 有 helper 包了这些事，自动加 beta 头、续线程、续不上时重放一次；手动写请求也一样，就是这两个字段，beta 头是 message-threads-2026-08-12。</p>
        <p>每轮发什么有三组规矩。建线程时才能发的：system、tools，续线程时发了就报 400，哪怕发 null 也不行。固定字段：model、tool_choice、thinking、mcp_servers（授权 token 除外）、context_management、output_config、容器里的 skills、顶层 cache_control、beta 头集合，每轮必须和建线程时一模一样，变了就报 400 thread_fingerprint_mismatch，报错里会点名哪个字段变了。剩下 max_tokens、stop_sequences、stream、metadata、service_tier 这些每轮可变。想改固定字段，办法只有一个，重发全量开新线程。</p>
        <p>线程只能追加，不能改写历史。每个响应 ID 只能续一次，永远从最新响应的 ID 续；想改前面某条消息、想分支、想把前面压成摘要，都得开新线程发全量。流式也一样，拿到 message_stop 之后再续，提前续可能报 404；pause_turn 停住的轮次用空消息列表续，续的时候不能再塞一条新 user 消息。</p>
        <p>线程是 best-effort，这一条是我最在意的，因为它划清了责任：服务端不承诺存住。5 分钟没新请求就过期，最晚在最后使用 1 小时内删除；续不上就报 404 thread_not_found，原因不告诉你，过期、上一轮没存住、fallback 模型写了上一轮、上一轮还在生成、换了组织或账号，都可能。恢复办法只有一条，用自己留的全量副本重发建新线程。应用自己是会话的 source of truth，这个副本必须从一开始就留，SDK helper 只在内存里留一份，进程没了就没了。线程的定位是有回退的加速路径，保管责任还在客户端，平台只加速，不保管。</p>
        <p>线程和提示词缓存是两件正交的事。线程不替你缓存，省的是上传、校验、分词；缓存省的是模型侧重算。想每轮都读缓存，顶层 cache_control 每轮都要发，它是固定字段；一共最多 4 个断点，顶层算一个，建线程时 system 和 tools 上的断点每轮都重复计，超了就报 400。只开线程不设断点，每轮仍重算；只设缓存不开线程，每轮仍上传全文。两处省的东西不一样，叠加才完整。</p>
        <figure className="article-figure">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/images/message-threads-diagram.svg" alt="Claude 消息线程：首请求全量建线程，后续只发新增与上一响应 ID，服务端内存持有，5 分钟过期后全量重放" /><figcaption>首请求全量建线程，后续只发新增与上一响应 ID，服务端内存持有，5 分钟过期后全量重放</figcaption></figure>
        <p>有几类请求用不了线程：Message Batches、token counting、compaction、context editing（clear_thinking keep all 除外）、开了 HIPAA 的组织、开了 inference hooks 的组织，多数报 400 thread_unsupported_request。也没有 list、read、delete 线程的接口。价格和限速不变，token 用量也不变，省的是延迟，账单按原样算。文件按引用持有，截图这类文件在线程用着的时候不能删，删了线程可能续不上。</p>
        <p>最适合三类：长跑的 coding agent，每轮工具结果和文件改动都在加长对话；computer use agent，截图留在线程里不用每轮重传；文档图像重型工作流，请求体本身就大。对话越长，省下的首 token 等待越多。反过来，间隔经常超过 5 分钟的会话、需要频繁改 system 或 tools 的分支、想把会话当长期存储用的，都不适合，过期和 append-only 会先卡住。博客给的口径是 50 万到 100 万 token 的请求，首 token 延迟中位数降约三成，厂商自报，未经第三方核实。</p>
      </div>
    </ArticleShell>
  );
}
