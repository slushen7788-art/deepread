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
    <ArticleShell meta={meta} prev={{ slug: "agent-model-harness", title: "Agent 的生产化瓶颈不在模型，在 Harness" }}>
      <div>
        <p>Agentic Application 这套参考架构的核心，不是给你一套固定组件清单去搭建 Agent，而是把 Agent 的风险根源定位在边界混淆上，用责任域划分、三个正交视图、五阶段闭环，建立一套和任务风险匹配的最低充分架构。</p>
        <p>很多人做 Agent 的时候习惯把所有东西揉在同一个循环里：模型提示词、任务状态、对话历史、工具权限、运行调度堆在一起，演示时跑起来很顺畅，一旦任务变长、多租户接入、工具变多，故障就会集中爆发。它把最常见的四类边界问题拆得很清楚：模型和 Harness 绑定过死，换模型就要改整套业务逻辑；编排逻辑和 Runtime 混在一起，换执行环境就要重写任务；上下文和持久任务状态不分，压缩摘要直接弄丢任务事实；工具的可发现和执行权限混为一谈，模型能看到工具就等于可以直接执行。</p>
        <p>整套架构用组件、平台、生命周期三个互不替代的视图来描述同一个系统。组件视图清点所有能力，防止漏掉状态持久化、结果校验这类容易被当成细节的模块；平台视图切分执行面、数据资源面、控制面，解决 “这个能力归业务团队写还是共享平台提供” 的权责问题；生命周期视图把 Agent 从一次性演示拉到可持续运营的轨道上。三个视图不能互相推导，组件齐全不等于权责清晰，权责清晰也不等于变更可控，这也是很多 Agent 平台踩坑的地方。</p>
        <p>五层责任域把能力按业务目标到持续优化的链路切开。业务层只定目标、验收条件和触发方式，不碰通用 Agent 能力；编排层负责构造循环、上下文策略、工具约束、中间结果校验，决定模型能看见什么、什么时候停；生产运行层处理调度、隔离、断点恢复、资源管控；治理控制层管版本、身份、策略、审计，决定哪些动作被允许；调优层从运行轨迹里拿到证据产出变更，变更不能直接上线，必须回流到编排层生成新版本，再走治理门禁。安全不是单独一个模块，是贯穿五层的横切责任。</p>
        <figure className="article-figure">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/images/agent-arch-diagram.svg" alt="五层责任域：业务层、编排层、生产运行层、治理控制层、调优层，安全横切五层，变更回流编排层再走治理门禁" /><figcaption>五层责任域：安全横切五层，变更回流编排层再走治理门禁</figcaption></figure>
        <p>配套的五项设计原则，本质都是在做解耦和兜底。模型和 Harness 解耦，模型作为可替换的认知单元，脚手架单独评估，避免模型升级直接引爆应用；编排和 Runtime 解耦，任务语义和底层执行资源分开，长任务可以跨实例恢复；状态外置，所有可恢复的任务事实脱离内存和单次上下文；自主性和权限、可验证性对齐，能力越大，隔离、审批、校验的约束就要越强；可观测、评估、安全是前置条件，不是上线之后再加的补丁。</p>
        <p>它把容易混淆的五类信息做了严格区分：Context 只是单次模型调用的视图，用完就重建；State 是任务级持久事实，用来断点续跑；Memory 是跨会话沉淀的经验，带遗忘和隐私治理；Knowledge 是组织静态知识库，和源系统权限对齐；Skill 是版本化可复用的任务方法。直接把这几类全部塞进同一个向量库，会同时丢失一致性、权限、时效、写入管控。工具、协议、执行环境也要分开，MCP 只是能力发现协议，协议能连通不代表有权限，参数校验通过不代表动作符合业务意图，沙箱执行成功不代表结果安全。</p>
        <p>生产运行的关键，是区分 Runtime 和 Sandbox。Runtime 负责任务生命周期、排队、暂停、从 Checkpoint 恢复；Sandbox 只限制动作的技术可达范围，它解决不了业务意图是否合法、结果是否正确的问题。Gateway 也按粒度拆成三层：模型网关管调用、限流、成本；MCP 网关管工具 ACL、凭证；Agent 网关管租户、任务预算，三者混在一起治理策略很容易互相覆盖。</p>
        <p>这套架构最不一样的地方，是重新定义了 Agent 的发布单元。普通软件的发布包是代码，Agent Release 要绑定模型版本、编排逻辑、上下文策略、工具权限、沙箱配置、评估基线一整套组合。任意一项改动都会改变 Agent 行为，只有把这些要素全部版本化，故障才能复现，优化才能被证明是真的优化，而不是随机波动。整个生命周期闭环也不是瀑布流，调优和治理发现的结构性风险，允许直接回到架构设计阶段重新做决策，而不是不停往旧架构上打补丁。</p>
        <p>我做过面向多用户多任务的研发 Agent，同样用到 MCP、A2A、沙箱和持久化存储，核心思路也是把任务语义和底层执行基础设施拆开。当时遇到的卡点就是边界模糊：工具注册、权限判定、任务状态存在同一个存储里，新增一类工具就要改动编排逻辑，租户多了之后审计链路很难串起来。这套架构给出的划分方式刚好对齐这个痛点，它不强制所有人搭建完整平台，优先要求识别风险，只搭建刚好够用的能力，而不是上来堆砌全套组件。</p>
        <p>这套架构落地之后，最容易被忽略的一点是策略分发模式。控制面集中管理策略，但判定点分布式放在网关、编排中间件、沙箱入口，异步回传审计日志，避免控制面成为全链路单点瓶颈。代价是策略存在传播延迟，高风险操作必须用短期凭证、强制刷新兜底。</p>
        <p>如果只做低风险单任务原型，这套架构的很多组件都可以先不上；但只要 Agent 要做跨天的长任务、多租户、可以操作真实业务系统，是不是提前按这套边界做划分，会决定后续是小迭代还是大规模重构。</p>
        <p>原材料：<a href="https://aliyun.github.io/ai-agent-handbook/architecture/chapter-02.html">AI Agent Handbook 第 2 章</a></p>
      </div>
    </ArticleShell>
  );
}
