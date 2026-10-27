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
    <ArticleShell
      meta={meta}
      prev={{ slug: "anthropic-code-review-layers", title: "Anthropic 的代码评审真正省下的，是“谁该看什么”这个决策" }}
      next={{ slug: "long-running-agents-6-layers", title: "长时运行 Agent 的六层架构：让模型等待，让系统负责执行" }}
    >
      <div>
        <p>这期 ByteByteGo 的 RAG 部分很短，短到只有两张流程说明：RAG 是用户提问、系统去知识库取相关信息、把信息塞进提示词、模型据此生成答案；Agentic RAG 是 Agent 选工具、查文档、API、数据库或者网络、检查证据够不够、不够就换查法或者换工具、够了再生成答案。篇幅短，判断反而好下：两张图的差别不在"查几次"，而在"证据够不够"这个判断由谁、在什么时候做。RAG 里这个判断不存在，检索是一次性的前置步骤，查什么、查多少在生成之前就定死了；Agentic RAG 里这个判断进了循环，模型自己一边查一边判，查到它认为够了为止。分界不在次数，在判断权的位置。</p>
        <p>RAG 的瓶颈很好理解：答案质量取决于一次检索拿到的上下文准不准。问题问得清楚、知识库干净的时候，这套就够用；问题稍微绕一点，第一次查询本身就可能是错的，拿着错的上下文生成，答案只会错得更顺。Agentic RAG 的回应是把检索从"生成前的准备"变成"推理中的一部分"：模型先有一个初步方向，查到证据后回头看缺什么，再决定下一步查什么、用什么工具查。这个循环里每一步都藏着一个没有画出来的决定。选工具的时候，凭什么认定这个来源比那个来源更可信；判断证据够不够的时候，对照的是什么标准，是问题拆出来的子问题清单，还是模型自己的感觉；调整的时候，是换个问法重查、换个工具，还是放宽或者收紧范围；什么时候停，是证据齐了，还是到了最大轮数、预算花完了。这些决定在图上只是一个标着"够不够"的菱形，实际落地的难度全在里面。</p>
        <figure className="article-figure">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/rag-diagram.svg" alt="RAG 与 Agentic RAG 的机制对比图" />
          <figcaption>核心机制：分界不在检索次数，在"证据够不够"由谁说了算</figcaption>
        </figure>
        <p>最值得盯住的是"够不够"由谁来判。按图上的流程，判的和答的是同一个模型，自己判自己查到的证据够了、再用这些证据作答，等于自己给自己打分。模型觉得够了的时候，可能只是查到的东西恰好印证了它一开始的倾向；模型觉得不够的时候，可能只是在一个查不到答案的问题上空转。缓解办法不在图里，但可以从机制上推出来：把"够不够"拆成可检查的条目，比如问题先拆成子问题、每个子问题都要有对应的证据条目，缺哪条补哪条，而不是对整个问题做一个笼统的感觉判断；高风险的答案再加一道独立的核查，和生成证据的模型分开；循环一定要有硬上限，轮数和成本预算到了就停，停的时候说清楚还缺什么，而不是假装答满了。这些不是原文给的，是按这个框架推下去必须补的东西，原文只给了循环的骨架。</p>
        <p>还有一个容易被"Agentic"这个词盖住的事实：循环没有修好检索本身，只是给了检索更多次机会。第一次查偏了，循环可以纠偏；知识库里根本没有答案，循环只会把"没有"查得更贵。循环带来的代价是实打实的：每一轮都要多一次模型调用和工具调用，延迟和成本跟着轮数涨；每一轮取回的证据都往上下文里堆，窗口会被近似重复的内容占满，真正关键的那条反而可能被淹没；工具一报错，错误会顺着循环往下传。所以选型先看问题类型，不看时髦程度。问题定义清楚、语料干净、延迟和成本敏感，用一次检索的 RAG；问题需要多跳推理、第一问注定问不准、要跨多个来源拼答案，用 Agentic RAG。还有一个现成的诊断信号：如果你的 Agentic RAG 绝大多数时候第一轮就停，它就是套了个循环壳的 RAG，白付了循环的开销；如果经常撞到轮数上限，说明"够不够"的标准或者工具箱本身有问题，循环只是在替它们背锅。</p>
        <p>落到最小可用的设计上，四件事按顺序做：先把"够不够"写成清单，问题拆子问题、子问题对证据条目；再给循环定硬上限，轮数和预算双封顶；然后把每一轮的查询、工具、取回证据都记下来，出问题的时候能回放是哪一轮走偏的；最后对高风险答案留一道独立核查。这四件做完，Agentic RAG 才算从"查几次"变成了"查得有交代"。图上没有画问题拆分这一步，值得单独问一句：复杂问题不先拆分，"够不够"是对着整个问题判的，这个判断本身就没有落点，循环转得再多也只是在原地打转。</p>
      </div>
    </ArticleShell>
  );
}
