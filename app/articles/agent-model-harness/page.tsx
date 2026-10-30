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
    <ArticleShell meta={meta} prev={{ slug: "dont-rush-to-split-agents", title: "别急着拆分 Agent：先证明它真的需要一个子 Agent" }}>
      <div>
        <p>这份白皮书表面在给 Agent 划分代际和成熟度，真正在锚定一条工程底线：模型只是决策部件，Agent 的生产化瓶颈全部在 Harness，选型的核心不是追 Multi-Agent 或者长时任务，而是匹配风险的最低充分架构。</p>
        <p>它把前一代 AI 应用的矛盾点说得很清楚：Chat/RAG、Workflow、Copilot 都把执行路径提前锁死，模型只负责生成内容或者填参数，人在全程兜底。Coding Agent 之所以成为拐点，不是因为代码场景炫酷，而是它一次性把所有生产级痛点暴露出来：上下文装不下全量仓库、任务要跨多轮维持计划、工具调用会修改真实文件、失败要支持回滚重试、结果不能靠模型自评、高风险动作要有人在回路拦截。这些问题在代码场景跑通之后，才可以平移到数据分析、工单处理、知识库维护这类别的业务里。</p>
        <p>Agent = Model + Harness 这个公式的价值，是把很多人混淆的边界拆开。模型只管推理和决策，状态持久、沙箱隔离、权限校验、轨迹观测、评估校验这些约束能力，全部属于 Harness。Harness 不是某个框架自带的一个循环，而是一整套互相咬合的工程能力集合。很多开源 Agent 框架只提供基础循环和工具调用，不自带稳定的状态恢复、操作审计、强制审批，直接拿去上线，本质上只是拿到了 Model 的外壳，补齐 Harness 才是从演示走向生产的门槛。</p>
        <figure className="article-figure">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/images/agent-harness-diagram.svg" alt="Agent = Model + Harness：模型只管推理和决策，约束能力全部属于 Harness" /><figcaption>Agent = Model + Harness：模型只管推理和决策，约束能力全部属于 Harness</figcaption></figure>
        <p>形态谱系不是一条线性升级链。Single-Agent、Long-Horizon Agent、Multi-Agent 不存在谁更高级，只是沿着两个独立维度扩展：时间维度和协作维度。长程智能体解决跨会话、中断恢复，多智能体解决分工、权限隔离、互相评审，二者可以单独使用，也可以组合。企业最稳妥的路径是先把边界清晰的单智能体跑稳，只有单智能体受限于上下文、权限、角色复杂度的时候，才增加复杂度。Workflow 不会被淘汰，混合架构才是主流，确定性、高风险的步骤留在流程里，只有路径不可预知、需要动态探索的环节交给 Agent 去决策。</p>
        <p>我做过一套面向多用户多任务的研发 Agent 系统，同样要处理沙箱、任务持久化、多租户隔离、子任务调度。这套系统的设计思路和白皮书的判断是对齐的：不要把所有控制权交给模型，把成熟、稳定、反复执行的动作封装成可复用技能，Agent 只负责编排和处理异常。差别在于，这套系统优先把权限、审批、状态快照放在任务调度层统一拦截，而不是散在每个 Agent 的业务循环里面。和白皮书里提到的 Agentic OS 思路刚好对上，业务侧的 Harness 只管任务逻辑，跨应用通用的调度、授权、审计、快照能力抽成公共承载层，避免每个业务 Agent 重复实现同一套安全底座。</p>
        <p>成熟度分级最容易被误读的地方，是把标签当成能力。叫 Agent 的应用可能只是 L1 的问答助手，一套 Workflow 也可以做到 L2 完备的观测和审批。成熟度看的是任务循环、环境影响、治理能力，不是名字。L4 是规模化运营状态，不是新形态，哪怕是 Single-Agent，只要多租户并发、统一治理、持续灰度迭代，一样可以落在 L4。</p>
        <p>白皮书最后抛出的 Agentic OS 视角，是最有延伸空间的部分。传统操作系统、K8s 管理的是确定性的进程和 Pod，重启容器不等于恢复一个已经产生外部副作用的 Agent 任务。Agent 的 Run 是独立的执行单元，状态外置、授权需要每次动作校验、故障恢复要以任务和检查点为单位，而不是进程。云底座是底层资源，但缺少面向 Agent 任务原生的抽象，这一层现在还没有收敛成标准方案。</p>
        <p>原材料：<a href="https://aliyun.github.io/ai-agent-handbook/architecture/chapter-01.html">AI Agent Handbook 第 1 章</a></p>
      </div>
    </ArticleShell>
  );
}
