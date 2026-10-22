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
      prev={{ slug: "agents-cli-extension-system", title: "Agents CLI 的扩展系统，表面上是在支持 LangChain，实际上是在把 Agent 工具链从“框架绑定”改造成“命令面可替换”" }}
      next={{ slug: "kiro-frontier-engineering", title: "Kiro 的前沿工程指南真正把开发者改成了“软件系统的设计者”" }}
    >
      <div>
        <p>AutoClean 真正解决的不是“AI 能不能找到并删除过期 feature flag”，而是能不能在大型代码库里持续完成这种删除，同时不改变程序行为、不误删测试、不把清理范围扩散到别的功能。</p>
        <p>这件事的关键也不在于模型多聪明，而在于系统如何限制模型的自由度：能交给确定性工具完成的改写，不交给模型自由发挥；能限制文件范围的修复任务，不给模型修改生产代码的权限；主清理 Agent 记住的约束，不再依赖它自己在长任务里始终遵守，而是拆成独立检查器逐条验证。</p>
        <p>在 Uber 的场景里，feature flag 已经不只是“控制一个功能开关”。它最初承担的是发布控制：让功能逐步上线、运行实验，并在出现问题时快速回滚。功能完全上线后，flag 本身却没有跟着消失。</p>
        <p>配置字段、调用点、函数参数、条件分支、测试和配置结构都会留下残余。一个只有几行代码的开关，经过长期演化，可能变成散布在几十个文件里的技术债。工程师要理解这些残余，AI Agent 也要解析它们，结果是代码越多，Agent 会话越长、执行成本越高。</p>
        <p>删除 flag 表面上只是搜索和替换，实际却包含一条传播链。</p>
        <p>假设 <code>new_order_pipeline</code> 已经完成全量发布，配置值恒为 <code>true</code>。第一步可以把 <code>flipr.GetBool("new_order_pipeline", false)</code> 替换成 <code>true</code>。但把常量写进代码，只完成了传播的第一段。</p>
        <p>接下来，系统还要判断：</p>
        <ul>
          <li><code>processOrder</code> 的所有调用者是否都传入同一个值；</li>
          <li>如果是，<code>useNewPipeline</code> 参数是否只剩这一个来源；</li>
          <li>参数删除后，旧处理分支是否变成不可达代码；</li>
          <li>配置结构中的 <code>UseNewPipeline</code> 是否还有其他读取者；</li>
          <li>删除结构字段会不会破坏其他服务的接口约定；</li>
          <li>原有测试究竟在验证仍需保留的行为，还是只验证旧分支存在。</li>
        </ul>
        <p>这里需要区分两类操作。</p>
        <p>内联布尔值、化简恒真或恒假条件，属于结果可由明确规则推导的机械变换。参数是否能够删除、分支是否彻底不可达、测试应该删除还是重写，则需要结合调用关系、上下文和业务边界判断。前者适合交给规则化代码改写引擎，后者才需要 Agent 参与。</p>
        <figure className="article-figure">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/uber-diagram.svg" alt="AutoClean 三阶段流水线图" />
          <figcaption>核心机制：判断归 agent、化简归确定性引擎、修复限范围、验收拆成独立属性</figcaption>
        </figure>
        <p>这正是 AutoClean 第一阶段的关键设计。</p>
        <p>Agent 可以搜索整个代码库、编辑文件，也能通过 MCP 调用 Uber 开源的 PolyglotPiranha。Piranha 并不是这次才出现的“AI 删除工具”。它早于 Agent 体系，使用 tree-sitter 解析代码，通过规则图完成大规模、可重复的 AST 级改写。Uber 在内部也长期使用它清理过期 flag。</p>
        <p>AutoClean 的新意，是给这条确定性清理线加上了 Agent 编排层：Agent 负责理解 flag 的传播路径和下一步该删什么，Piranha 负责执行容易被模型改坏的布尔化简。</p>
        <p>这种分工很重要。条件表达式只要化简错一点，就可能让生产环境走向另一条分支。与其让 Agent 根据自然语言自行重写，不如把这类高风险操作收进确定性工具。Agent 仍然拥有判断权，但关键变换的执行权不完全属于模型。</p>
        <p>改写完成后，AutoClean 提交 diff，让 CI 在 monorepo 的多个目标上运行。本地测试通过并不能证明改动安全，因为一个 flag 的影响范围可能跨越大量构建目标和测试任务。</p>
        <p>CI 失败后，AutoClean 会读取失败信息并分发给 fixer。机械问题先交给便宜的确定性 fixer，例如删除未使用的默认值、清理 lint 报错；无法识别的失败继续下沉，测试该删除还是该重写这类问题再交给 Agentic fixer。每次修复都会重新触发 CI，直到 diff 变绿或达到尝试次数上限。</p>
        <p>更关键的是，每个 fixer 都有严格的作用域。测试 fixer 只能修改测试文件，不能碰生产代码。否则 Agent 可能通过修改被测对象让测试通过，而测试通过恰恰不是清理任务真正要证明的结果。</p>
        <p>不过，CI 全绿仍然不是最终正确性。测试被删除了，CI 也会绿；常量只内联了一部分，代码依然能构建，CI 同样会绿。于是 AutoClean 又加了一层独立验证。</p>
        <p>静态检查负责可编码的机械问题，例如一个恒真函数仍然存在、可以化简的条件没有化简、只通过旧 flag 路径才能到达的代码仍留在仓库中。静态检查通过后，diff 再进入 CodeCourt。</p>
        <p>CodeCourt 是 AutoClean 里最值得单独拆开看的机制。它没有继续给主清理 Agent 增加一条提示词，而是把清理必须满足的要求外置成独立正确性属性：</p>
        <ul>
          <li><strong>No additions</strong>：清理只能删除或简化，不能引入新代码。</li>
          <li><strong>Preserves semantics</strong>：清理前后的可观察行为必须保持一致。</li>
          <li><strong>No intent drift</strong>：只能处理目标 flag，不能顺手删除其他相关 flag。</li>
          <li><strong>No agent artifacts</strong>：不能留下 Agent 推理过程、临时注释或其他清理痕迹。</li>
        </ul>
        <p>每个属性由一个专门 reviewer Agent 检查。多个 reviewer 并行运行，全部通过才进入人工评审；任何一个失败，diff 会在到达人面前之前被放弃。</p>
        <p>这解决了长任务 Agent 的一个典型问题：任务越长，约束越多，主 Agent 越容易只追逐眼前最明显的成功信号。比如它发现测试失败，最直接的办法可能是删除测试；CI 变绿了，但“保留仍有效行为”的约束已经丢失。继续往主提示词里增加规则，并不能从根本上消除这种冲突。约束如果和执行混在同一个上下文里，就仍可能被执行动作挤到一边。</p>
        <p>CodeCourt 的做法相当于把“执行者”和“验收者”拆开。每个 reviewer 只回答一个明确问题，不负责重新执行整个清理流程。这个结构不只适用于代码删除。任何长链路 Agent，只要存在多个可能互相冲突的要求，都适合把要求外置成独立属性，再设置逐项检查者。</p>
        <p>自动化的终点也不是完全取消人工，而是一个经过机械检查和属性验证的 diff。人工评审者主要判断业务问题：这个 flag 现在是否真的应该删除。代码是否还能构建、测试是否通过、行为是否被意外改变，则尽量由前面的自动层负责。</p>
        <p>AutoClean 的价值也因此不应只用“删了多少代码”来理解。更重要的是，它把一件通常被工程团队无限期推迟的维护工作，改造成了一条持续运行的流水线：</p>
        <ol>
          <li>识别已经失去存在价值的 flag；</li>
          <li>用 Agent 做跨代码传播判断；</li>
          <li>用确定性引擎完成布尔化简等机械改写；</li>
          <li>用 CI 发现跨目标影响；</li>
          <li>用受限 fixer 修复失败；</li>
          <li>用静态检查和 CodeCourt 验证行为与意图；</li>
          <li>最后把判断权交回人。</li>
        </ol>
        <p>截至文章发布时，Uber 自报 AutoClean 在过去几年累计清理了超过 16,000 个 flag 和超过 100 万行代码。这是 Uber 多年累计的产出，不是单年成果，也不能直接换算成成功率，因为公开材料没有提供 CodeCourt 丢弃率、CI 修复循环平均轮次或人工评审驳回率等分母。</p>
        <p>这也划定了 AutoClean 的适用边界。它适合 flag 已完成全量发布、目标行为稳定、删除不会改变可观察语义的任务。涉及线上回滚能力、多个 flag 共同决定业务规则，或者删除动作会改变接口契约时，自动化可以准备 diff，但最终判断不能只依赖代码层面。</p>
        <p>更直接的问题是：CodeCourt 目前由多个 Agent 审核 Agent 的 diff。如果 reviewer 与 cleanup Agent 共享同一种模型盲点，属性拆分仍然可能一起失效。后续能不能加入行为对照测试、运行时 trace 对比或从生产历史生成验证样本，会决定这套系统能否继续从“准备得较好的 diff”走向更强的事后证明。</p>
      </div>
    </ArticleShell>
  );
}
