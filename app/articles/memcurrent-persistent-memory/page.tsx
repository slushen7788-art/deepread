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
      prev={{ slug: "context-engineering-deep-agents", title: "Deep Agents 真正解决的不是“窗口不够大”，而是任务过程会污染上下文" }}
      next={{ slug: "agents-cli-extension-system", title: "Agents CLI 的扩展系统，表面上是在支持 LangChain，实际上是在把 Agent 工具链从“框架绑定”改造成“命令面可替换”" }}
    >
      <div>
        <p>MemCurrent 的核心不是扩大上下文窗口，而是把 Agent 记忆做成一套分层存储、异步维护、按需读取的运行时系统：原始轨迹负责保留事实细节，蒸馏后的知识文件负责稳定复用，索引负责路由，Agent 工具和离线管线负责处理不同类型的写入。</p>
        <p>这比“把所有历史对话塞回 Prompt”更接近生产系统。后者只是多带材料，前者要处理四个相互牵制的问题：什么值得记、怎样维护、什么时候读取，以及如何证明记忆真的改善了行动。</p>
        <p>MemCurrent 同时支持 plugin、tool、offline pipeline 三种接入方式，并不是为了凑齐形态，而是因为三种方式分别覆盖自动、灵活和后台维护三种不同需求。</p>
        <figure className="article-figure">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/memcurrent-diagram.svg" alt="MemCurrent 记忆架构图" />
          <figcaption>核心机制：情节记忆存原始轨迹、派生记忆存蒸馏知识，在线工具与离线 dreaming 两条写入通道</figcaption>
        </figure>
        <h2>记忆先要分层，不能只追求“更多”</h2>
        <p>作为 plugin 时，记忆在会话中的固定节点自动读取和写入。它在线执行，因此修改马上生效，行为也比较稳定；代价是每次会话都要承担搜索、注入和记录的成本，即使当前任务根本用不上记忆，也可能产生额外延迟和 token 消耗。</p>
        <p>作为 tool 时，是否调用 <code>search_memory</code>、<code>fetch_memory</code>，以及何时写入记忆，都由 Agent 自己决定。tool 同样在线执行，显式指令可以立即生效，还允许 Agent 根据任务需要控制上下文；代价是运行成本仍然存在，而且效果受 Agent 自身判断能力影响。模型不知道该搜、搜错关键词，或者根本没意识到存在可复用记忆，工具能力就落不到实际收益上。</p>
        <p>作为 offline pipeline 时，记忆在后台按计划或触发条件更新，稍后的会话再使用已经整理好的结果。异步批处理能把主要计算移出在线链路，延迟和成本更低，但新信息不会立刻生效，存在一致性延迟。</p>
        <p>三种方式分别对应不同的失败模式。plugin 解决了 Agent 不会主动使用记忆的问题，却容易无差别注入；tool 解决了固定流程不够灵活的问题，却依赖模型决策；offline pipeline 解决了在线维护太贵的问题，却必须接受更新延迟。MemCurrent 把三者放在不同位置：自动路径负责兜底，在线路径处理显式请求，后台路径持续整理隐式学习。</p>
        <p>记忆本身又分成两层。</p>
        <p>episodic memory 保存会话原始轨迹，采用只追加的方式记录。它像事件日志，保留了“这个用户曾经怎样纠正 Agent”“一次任务具体执行了哪些步骤”这样的细节。好处是信息损失少，坏处是内容长、噪声多，而且知识不会自动整理成可复用的结构。</p>
        <p>derived memory 是从原始轨迹中蒸馏出来的文件化知识库。它可修改，组织方式类似分层文件系统：用户偏好、指标定义、项目经验和工作流可以分别放在不同文件中。Agent 后续可以更新其中一条记录，不必重写整段历史。</p>
        <p>两类记忆之间最关键的部件，是顶部的 <code>memory.md</code>。它是一份自动生成的总索引，描述整个记忆库的文件结构，以及每个文件大致包含什么。索引在会话开始时由 plugin 注入，Agent 因而先知道“自己已经知道什么”，再决定要不要深入读取。</p>
        <p>没有这份索引，Agent 只能盲目搜索。文件多了以后，搜索会变贵，召回也容易遗漏；有了索引，Agent 可以先根据目录定位相关知识，再调用 <code>search_memory</code> 找到匹配项，最后通过 <code>fetch_memory</code> 按 session ID 或文件路径取得完整内容。它相当于把“全文塞进上下文”拆成“目录可见、片段可搜、全文按取”。</p>
        <p>这还解释了为什么 derived memory 承担了主要价值：蒸馏后的文件已经按知识主题组织，索引又能帮助 Agent 找到它们。episodic memory 更像补充证据，保留蒸馏过程可能遗漏的细节。</p>
        <h2>写入不是一件事：显式保存与后台整理必须分开</h2>
        <p>derived memory 有两条写入通道。</p>
        <p>第一条是在线工具，包括 <code>add_memory</code>、<code>update_memory</code> 和 <code>delete_memory</code>。用户明确说“不要再在 <code>/tmp</code> 下写脚本”，或者 Agent 在任务中形成一条可以立即复用的定义，就通过这些工具直接修改记忆文件。它们适合表达明确、要求马上生效的知识。</p>
        <p>第二条是离线 dreaming 管线。每次新会话结束后，后台流程从原始轨迹里寻找隐式学习，把散落在对话中的偏好、修正、工作习惯和成功路径整理进相关文件。它还承担整个记忆库维护，包括拆分过大的文件、合并重复内容、解决相互冲突的记录。</p>
        <p>dreaming 的意义不只是“再总结一次”。摘要模型通常擅长把内容写短，却未必擅长长期维护一个会被不断修改的知识库。文件过大后需要拆分，两个文件表达同一件事后需要合并，新旧结论冲突后需要决定保留哪个。背景任务适合做这种跨文件、跨会话整理，因为它不必占用当前用户请求的在线延迟。</p>
        <p>不过，dreaming 也引入了最难工程化的一部分：后台改写必须可追踪、可撤销，并且能解释某个结论来自哪次会话。否则用户删除了一条偏好，几天后 Agent 又从旧轨迹中把它蒸馏回来，系统就失去了用户信任。记忆索引、文件更新和原始轨迹之间需要保留清晰的血缘关系，尤其要区分“暂时无法确认”与“明确禁止”。</p>
        <h2>真正应该评测的是“记忆有没有改善行动”</h2>
        <p>Databricks 用三类公开基准测试 MemCurrent：LoCoMo、LongMemEval 和 ConvoMem。它们都考察 Agent 能否从较早的开放式对话中找回先前说过的事实。在这些测试中，MemCurrent 平均通过率为 88.1%，full context 为 87.8%，两者基本相当；输入 token 约为 8.4K 对 103K，MemCurrent 少用约 12 倍。</p>
        <p>这组结果能证明检索系统可以替代巨量历史注入，却不能完整证明生产 Agent 的记忆设计。公开基准测的是“回忆事实”，而企业 Agent 更关键的能力是把记住的内容用于操作、查询和判断。为了完成一个企业任务，Agent 不仅要找到正确表格、指标定义或工作流，还要据此生成 SQL、调用工具并处理多步执行。找到字符串只是行动链条的前半段。</p>
        <p>公开基准还存在一个重要口径：MemCurrent 等所有后端都只以 plugin 形态运行。加入 memory tool 的结果被严格支配，因此没有展示。公开基准验证的是自动检索路径，并没有验证 plugin、tool、offline pipeline 全部启用时的完整架构。</p>
        <p>Databricks 为此建立了内部基准。数据来自 Genie 的 12K 多条真实会话，团队先筛出 3K 个含有值得记忆信号的候选会话，再为每个候选起草后续问题和评分 rubric。对抗式 LLM 评委按 7 条标准检查题目，例如知识是否真实存在、是否足够具体、回答时是否必需、问题是否自然、结果是否可验证。最后经过人工复核，保留 114 个用例，涉及 29 个用户和 2,233 条历史会话。评分同样由 LLM 评委按照 rubric 执行。</p>
        <p>这套评测更接近真实企业任务，因为会话涉及数据工作台中的表语义、指标定义和工作流，也覆盖用户画像、偏好、领域知识、项目与工作流等 5 类记忆，再与 11 类场景组合。测试要求 Agent 从同一用户的 100 多条历史会话中找到相关记录，并把知识应用到新的多步任务。</p>
        <p>内部基准没有把全部历史放进上下文作为上限。历史太长，塞不进窗口，因此上限改成 gold injection：只注入回答当前问题所需的标准记忆。这个上限由 Databricks 自己定义，用来判断检索和维护还有多少提升空间。</p>
        <p>按 Databricks 自报结果，MemCurrent 在内部基准上的通过率为 68.4%，无记忆基线为 22.3%，gold injection 为 78.6%，Mem0 为 43.9%。相对无记忆，MemCurrent 的通过率约提升至三倍，同时 1.35 倍更快、1.44 倍更便宜。开头使用的“少 31% token、快 26%”是同一组结果的另一种表达。</p>
        <p>这些数字应保留两个限定：它们来自厂商自建基准、自选会话、自建题目和 LLM 评委，gold injection 上限也是厂商定义；它适合说明 MemCurrent 在该评测口径下的相对表现，不能直接当作行业通用成绩。</p>
        <p>消融实验把机制拆得更清楚。只使用 episodic memory 时，通过率为 35.8%，高于无记忆的 22.3%，但 Agent 在测试中只有约三分之一的时候会主动搜索原始轨迹。derived memory 单独工作达到 66.1%，原因之一正是会话开始就注入索引，让 Agent 知道该去哪里找。两种记忆结合后达到 68.4%，新增收益不大，却说明蒸馏确实会遗漏细节，原始轨迹仍有保留价值。</p>
        <p>提取策略的消融也支持职责拆分。offline dreaming 单独使用达到 63.5%，online tools 单独使用为 53.9%，二者结合为 66.1%。后台管线能处理更多隐式学习并统一整理知识，在线工具则负责让明确要求立即生效。这个结果对应的生产选择很直接：不能把“记住用户刚刚明确说过的话”交给异步任务，也不能让每个在线请求都承担全库总结的成本。</p>
        <p>Databricks 展示的两个 Genie 案例与这个架构相吻合。一次 Agent 写出正确 SQL，却没有读取执行结果，最终生成了幻觉表格；用户纠正后，经验进入记忆，后续 Agent 先读结果再回答。另一次 SDP 客户查询首次需要 11 次工具调用、8 个子 Agent、接近 6 分钟，后来把路径保存成 workflow 文件，相似问题只用了 2 次工具调用、1 个子 Agent 和 41 秒。新问题仍然需要新答案，但一部分问题求解路径已经可以复用。</p>
        <h2>记忆系统最终会变成 Agent 的知识运行时</h2>
        <p>把 MemCurrent 放到 Agent 工程里看，它更接近一个小型知识操作系统。episodic memory 是事件日志，derived memory 是可维护的知识文件，<code>memory.md</code> 是目录和路由表，memory tools 是在线事务接口，dreaming 是后台整理作业，search 与 fetch 则构成两级读取协议。</p>
        <p>这也改变了 RAG 的工程重心。传统 RAG 往往把主要难题放在 embedding、召回和重排上；生产级记忆还要处理知识生命周期：新知识怎样进入，旧知识怎样失效，冲突由谁裁决，用户删除怎样真正生效，以及一条结论如何追溯到来源。</p>
        <p>一条更传统的替代路线是保留 append-only 事件日志，用规则或确定性任务构建派生视图，再通过检索服务读取。它通常比 LLM dreaming 更容易审计和重放，但整理跨文件冲突、归纳隐式工作流的能力较弱。另一种路线是只做向量 RAG，不做蒸馏，实现简单，却很难提供“已经整理好的工作流”这类直接可执行的知识。MemCurrent 选择让 LLM 参与知识整理，因此更灵活，也把验证、溯源、删除和冲突治理变成了必须补齐的工程层。</p>
        <p>适合 MemCurrent 这类系统的场景很明确：同一批用户会反复使用 Agent，任务之间存在稳定偏好、指标定义和操作流程，而且历史已经长到无法持续塞回上下文。短会话、一次性问答或每次任务都完全独立时，完整记忆系统可能只是额外成本。</p>
        <p>值得继续追问的问题是：一条 derived memory 被 dreaming 合并、拆分或覆盖之后，Agent 如何向用户解释它为什么可信？尤其当用户明确删除的信息又从旧会话中被重新提炼出来，MemCurrent 会以原始轨迹、derived 文件还是索引为准？这决定它最终是一套可靠的知识资产，还是一个规模更大的幻觉层。</p>
      </div>
    </ArticleShell>
  );
}
