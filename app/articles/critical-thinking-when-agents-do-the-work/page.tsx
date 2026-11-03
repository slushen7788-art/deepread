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
    <ArticleShell meta={meta} prev={{ slug: "droid-frontier-harness", title: "Droid 1.0：把工具调用从对话里抽出来，变成程序一次跑完" }}>
      <div>
        <p>Agent 交活越来越多之后，批判性思维卡住的地方是验收。过去审东西的方式是逐行读过，现在产出多到读不过来，判断只能换个地方落：动手之前先定好什么才算验过，拿到结果之后抽查它替你做的决定。</p>
        <p>这条滑落的线是渐进的，每一步看起来都合理。最上层是外包：任务交给 Agent，结果的所有权还在自己手里，检查的动作还在。中间一层是移交：Agent 的输出直接变成下一步的输入，不再被当成一个有待验证的假设。最底层是认知投降（cognitive surrender）：输出悄悄变成自己的，连检查的念头都不起了。从上一层滑到下一层没有明显的台阶，上一次认真读了，这一次只扫一眼，再下一次只看骨架，最后被问到某一行，连着 Agent 一起都解释不出来。</p>
        <p>滑下去的代价平时看不见，名字倒有好几个。认知债是这样攒起来的：每次都省掉了自己想一遍的功夫，债的总额一直藏着，直到哪天想套用一个心智模型去理解系统，才发现那个模型根本不存在。理解债（comprehension debt）是代码版：代码看起来干净，测试全过，改动的那天才发现没人懂这片系统了。意图债（intent debt）更难还：没写进来的目标、约束和理由，别人没法替你补，意图只能来自你自己。还有一笔编排税（orchestration tax）：Agent 生成的东西和你敢署名的东西之间的差，产出堆得比你看得完还快时，再开一个会话也没用，要么收紧检查，要么慢下来。还有监督悖论：监督 Agent 需要的编程能力，恰恰可能在 AI 过度使用中萎缩。</p>
        <p>瓶颈跟着变了位置。以前的瓶颈是写代码，现在是确认自己是对的。给 Agent 一条验证回路，让它改完就跑测试、读结果、再改一轮，这条回路本身不难搭，难的是知道什么样的验证才算数。绿勾只证明一件事：测试和功能犯同一个错，照样全绿。所以 verified 要事先定义，完工的证据要是测试通过、截图、日志、trace 这种实打实的东西，“看起来做完了”不算。看结果的顺序也要倒过来：先看它跑了什么命令、返回了什么，再看它自己写的总结。收尾多问一句有没有漏掉什么，常常能多挖出两三条。</p>
        <p>审东西的动作本身也在变形。600 行 PR 只看结构、变量名合理、测试通过就批，审是审了，但只审了自己预期会发现的东西。更值得审的是 diff 背后它替你做的决定：默认值怎么定的、什么被划出范围、两个需求冲突时它 reinterpret 了哪一个。让它把决策和假设列出来，随机抽几行逐行问，文档合上后凭记忆默写主论点，有人用的规则是 quiz 满分才 merge。</p>
        <p>我认按需重建理解这个前提，但只认一半。Claude Code 团队的做法是需要哪片就让 Agent 讲哪片，不背全量模型，理解可以在需要的时候局部重建。对资深者这条路走得通，因为重建的前提是知道自己缺什么。对新人这条路是个陷阱：不知道缺什么的人，连问题都提不出来，重建也就无从开始。团队层面更弱：共享系统理论的侵蚀说的是理解不在任何一个人脑子里时，问 Agent 要解释这个动作本身没人发起，个人能重建不等于团队能重建。</p>
        <p>低 stakes 全权委托、高 stakes 留住推理，这条分界我也觉得需要再往前想一步。选酒店交给 Agent 没问题，因为错了便宜；投钱、给孩子选职业方向、决定做什么、影响哪些用户、能不能上线，这些决定错了要由别人承担后果，推理必须留在人手里。问题是分界本身会漂移：今天把选酒店交出去，明天选供应商的标准也可能顺手交出去，“错了便宜”这个判断本身也会被外包。分界不能只凭感觉守，得事先写下来：哪些决定错了便宜、哪些决定别人要承担后果，写下来才不会在一次次顺手里退后。</p>
        <p>我最想追问的是验收链的最后一环。决策清单、quiz 题目、“有没有漏掉什么”的回答，全都可能出自同一个 Agent。抽查的工具和被抽查的东西同源时，抽查能发现的只是它愿意暴露的。最后一环能不能不是 Agent 自己？这个问题不解决，前面所有的检查都只是在同一条链上打转。</p>
        <p>这些做法能拼进日常工作流的地方很具体。PR 模板里可以加一栏，让 Agent 列出它替你做的决定清单。收尾固定多问一句有没有漏掉什么，被否掉的东西把理由写进 shared config、hook 或者测试里，品味就是这样攒起来的。每周留一次不用 Agent 写代码的时间，每月列一次自己停掉的事，决定哪些可以不练。</p>
        <p>下次 Agent 交活时，先不看它写的总结，先看它跑了什么、返回了什么，再问它一句还漏了什么。验收从这里开始。</p>
      </div>
    </ArticleShell>
  );
}
