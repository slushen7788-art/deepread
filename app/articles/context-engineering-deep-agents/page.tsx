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
      prev={{ slug: "more-ambitious-with-models", title: "用模型时最值得偷懒的地方，不是提示词，而是任务本身" }}
      next={{ slug: "memcurrent-persistent-memory", title: "MemCurrent 真正解决的不是“记不住”，而是生产级 Agent 记忆该由谁写、何时写、怎么读" }}
    >
      <div>
        <p>Deep Agents 解决的是一个反直觉问题：Agent 干活越久，积累的信息越多，模型反而可能做得越差。它没有继续扩大模型上下文窗口，而是在 Agent 循环的几个固定位置插入 middleware，提前拦截尖峰、压缩历史、按需加载知识、隔离噪声，并把跨会话记忆交给用户自己保存。</p>
        <p>表面上看，这篇文章介绍了一套上下文管理技术：Offloading、Summarization、Skills、Subagents 和 Long-term memory。实际讨论的是 Agent harness 的一层新职责：模型负责做决定，harness 负责保证它做决定时看到的内容足够完整，又足够干净。</p>
        <p>这两个目标经常发生冲突。信息太少，模型缺少依据；信息太多，历史、工具输出和中间产物又会争夺注意力。上下文工程的目标因而是动态控制信息流：每一步只让模型看到当前任务真正需要的内容，同时保留原始数据的可恢复性。</p>
        <p>这也是 Deep Agents 区别于简单 <code>create_agent</code> 的地方。LangChain 的极简 Agent harness 主要提供模型、工具和循环；Deep Agents 建在 LangGraph 之上，是一套带完整中间件能力的强意见 Agent harness。五种上下文技术都通过 middleware 接入循环，不需要使用者逐个手写实现。</p>
        <p>要理解这套设计，先要理解 context rot。</p>
        <h2>上下文窗口会被任务过程本身污染</h2>
        <p>Agent 与普通聊天的区别，是它会持续执行多步任务。每一步都可能增加内容：</p>
        <ul>
          <li>用户的输入和补充要求；</li>
          <li>模型的推理结果与计划；</li>
          <li>工具调用和工具返回；</li>
          <li>文件、网页、搜索结果；</li>
          <li>中间草稿、测试结果和修订版本；</li>
          <li>为后续任务加载的技能说明与参考资料。</li>
        </ul>
        <p>这些东西都进入同一个上下文窗口。窗口看起来像模型的记忆，其实更像一张不断摊开的桌面：早期指令还在，搜索片段还在，失败尝试还在，新结果也继续往上堆。模型每次调用都要重新阅读这整张桌面。</p>
        <p>context rot 指的就是这种劣化：上下文越长、噪声越多，模型的准确率和推理表现往往越差。这个概念背后有 Chroma 2025 年发布的相关研究背景；LangChain 在这里使用的是作者对研究的转引，本轮没有调阅研究原文，因此不宜把它当成已经覆盖所有模型和任务的普遍定律。</p>
        <p>污染通常来自三个方向。</p>
        <p>第一，信息衰减。上下文变长以后，早期信息在注意力中的相对位置下降。任务靠前作出的决定容易被后面的长内容淹没。</p>
        <p>第二，噪声稀释。真正有用的信息可能只占很小一段，周围却堆着大量日志、网页正文、重复搜索结果和失败路径。内容数量增加了，信息密度反而下降。</p>
        <p>第三，状态冲突。旧计划、旧数据和已经废弃的中间结论继续留在窗口里，模型可能把历史状态误认为当前状态。一个长任务常见的故障并不是模型完全没看见正确答案，而是它同时看见了太多互相不兼容的候选答案。</p>
        <p>所以，“把更多东西塞给模型”经常是一种伪优化。真正需要管理的是信息进入窗口的时机、停留时间和表现形式。</p>
        <h2>Middleware 是 Agent 循环里的控制阀</h2>
        <p>Agent 的基本循环可以压成一条链：</p>
        <pre>模型判断 → 调用工具 → 读取结果 → 再次判断 → ……</pre>
        <p>middleware 是一段插入这条链的代码。它不负责替模型完成业务判断，而是在特定位置读取即将进入上下文的内容，并决定如何修改、过滤、替换或补充。</p>
        <p>可插入的位置包括：</p>
        <ul>
          <li>运行开始前：检查待加载内容，建立本次运行所需的环境；</li>
          <li>每次模型调用前：检查上下文占用，压缩旧消息，注入技能目录和长期记忆；</li>
          <li>每次模型调用后：检查模型输出和即将发起的工具调用；</li>
          <li>每次工具调用后：拦截工具返回结果，拦截过大的内容；</li>
          <li>每次工具调用前：约束或调整工具参数，执行权限与输入检查。</li>
        </ul>
        <p>这些位置分别对应不同的控制动作。运行前适合决定“这次任务要准备什么”；模型调用前适合回答“模型现在应该看到什么”；工具调用后适合处理“外部世界返回了什么”；工具调用前适合决定“允许怎样访问外部世界”。</p>
        <p>Deep Agents 的五种技术，就是把这些动作放回 Agent 循环中理解。</p>
        <figure className="article-figure">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/context-engineering-diagram.svg" alt="Deep Agents 上下文工程机制图" />
          <figcaption>核心机制：五个中间件挂在 agent 循环的固定位置上，上下文之外是一层可恢复的文件存储</figcaption>
        </figure>
        <h2>Offloading 处理突然挤进来的大块内容</h2>
        <p>工具结果最容易制造上下文尖峰。例如，一次市场数据查询可能返回数万行记录，网页抓取可能带回整篇文章，用户也可能粘贴一段很长的通话记录。它们进入模型之前没有必要完整展开。</p>
        <p>Deep Agents 的默认设置中，工具结果超过约 20,000 tokens，会在进入对话前被完整写入：</p>
        <pre>/large_tool_results/&#123;tool_call_id&#125;</pre>
        <p>模型看到的是文件路径，以及内容开头和结尾的一小段预览。超大用户消息采用更高的约 50,000 tokens 阈值，保存到：</p>
        <pre>/conversation_history/</pre>
        <p>这些数字是 LangChain 针对自家产品给出的默认设置，本轮没有在源码中逐项核对，不能当成跨框架的行业实测值。</p>
        <p>Offloading 的关键不在于“把大文本缩短”，而在于把“占用上下文”和“保存完整信息”拆开。模型只消耗预览所需的 token，原始结果仍留在文件系统中。以后需要某个具体数字时，Agent 再调用 <code>read_file</code>，按页读取相关内容。</p>
        <p>这与直接截断有本质区别。截断会永久丢掉没有保留的部分，Offloading 保留了可寻址的完整副本。预览负责让模型知道“这里还有材料，以及材料在哪里”，文件负责承担真正的信息存储。</p>
        <h2>Summarization 处理长期运行造成的缓慢增长</h2>
        <p>Offloading 能挡住单次大结果，却挡不住任务持续数小时后的累积。几十次搜索、笔记、工具响应和草稿仍会逐步抬高上下文占用。</p>
        <p>Deep Agents 的默认设置是在模型调用前检查 token 使用量。达到模型上下文窗口的 85% 后，由一次独立的 LLM 调用把较旧消息压缩成摘要。近期消息保持原样，模型会先看到摘要，再看到近期消息。</p>
        <p>被摘要的旧消息不会直接消失，而是写入：</p>
        <pre>/conversation_history/&#123;session_id&#125;.md</pre>
        <p>需要时可以读回来。这让压缩具备了可恢复性：Agent 平时依靠摘要继续工作，碰到精确细节时仍能回查原始记录。</p>
        <p>摘要也会循环产生。上下文再次增长时，新一轮摘要可以包含上一轮摘要和后续新增的旧消息。信息会逐层折叠，但每一层仍能追溯到落盘记录。</p>
        <p>Offloading 与 Summarization 的分工很清楚：</p>
        <ul>
          <li>Offloading 治尖峰，拦截一次性进入窗口的大块内容；</li>
          <li>Summarization 治缓升，压缩已经存在于窗口中的长期历史。</li>
        </ul>
        <p>二者还可以组合使用。某个工具结果先被卸载成预览，后续多轮任务逐渐积累摘要，原始内容仍保存在文件里。</p>
        <p>触发条件也不必永远绑定 85%。主题切换时主动压缩往往更有价值，因为新任务通常不需要上一阶段的大量中间过程。不过阈值与摘要提示词都需要按任务调整，长任务、代码任务和连续对话往往需要不同的压缩策略。</p>
        <h2>Skills 把知识从常驻上下文改成按需资源</h2>
        <p>把专业知识全部塞进 system prompt，模型每次调用都要承担这些内容。Skill 提供了一种分层加载方式。</p>
        <p>一个 Skill 是一个目录，里面可以包含：</p>
        <ul>
          <li><code>SKILL.md</code> 中的完整操作说明；</li>
          <li>脚本；</li>
          <li>参考资料；</li>
          <li>配套文件。</li>
        </ul>
        <p>Agent 启动时只读取每个 <code>SKILL.md</code> 的头部信息，之后每次模型调用只注入技能名称和简短描述。例如，主 Agent 始终能看到“季度业务复盘报告”“竞品分析”这样的技能菜单，但不会立即携带完整模板。</p>
        <p>当任务确实相关时，模型再通过 <code>read_file</code> 读取完整说明。渐进式披露由此分成三层：</p>
        <p>1. 启动时发现技能存在； 2. 调用时看见名称和描述，判断是否相关； 3. 真正使用时读取全文、脚本和参考资料。</p>
        <p>这样节省的不只是 token，也包括每次请求都要重复处理无关指令带来的延迟。十个 Skill 的常驻成本接近十条简短目录项，只有被选中的 Skill 才展开。</p>
        <p>Skills 适合承载“偶尔需要，但需要时必须完整遵循”的知识，例如品牌模板、发布流程、数据分析规范和特定平台的操作手册。它不适合持续参与每一步推理的核心约束。后者仍应留在稳定的系统规则或权限层中，否则模型可能还没加载 Skill 就已经做出关键动作。</p>
        <h2>Subagents 隔离的不是任务，而是过程噪声</h2>
        <p>Offloading 适合处理“结果体积已经很大”的情况。很多研究任务还有另一个特点：步骤很多，最终产物却很小。</p>
        <p>假设主 Agent 要研究五家公司，每家公司都要读取大报告、搜索几十条新闻、整理笔记。中间过程很吵，真正需要的结论可能只有三条。</p>
        <p>Subagent 会在独立上下文窗口中完成这部分工作。Deep Agents 允许为子 Agent 配置名称、描述、system prompt 和工具集合。主 Agent 只把一家公司的研究任务交给 <code>market-researcher</code>，子 Agent 阅读完整材料，最后返回三条简短结论。</p>
        <p>这里有一个值得注意的差异：主 Agent 连原始结果的预览都看不到。Offloading 后，主 Agent 至少知道文件路径和内容边界；Subagent 返回时，中间过程不进入主上下文，只有整理后的结果回来。</p>
        <p>隔离的主要对象包括：</p>
        <ul>
          <li>大段网页、文件和搜索结果；</li>
          <li>子任务中的试错过程；</li>
          <li>多个子任务并行产生的大量中间状态；</li>
          <li>与最终决策无关的推理材料。</li>
        </ul>
        <p>Subagent 还能按子任务分配不同模型、限制工具权限，并行执行彼此独立的研究工作。它适合边界明确、结果可压缩的任务，不适合需要主 Agent 持续掌握全部细节的开放式探索。否则，压缩掉的那些细节可能在后面变得必要。</p>
        <h2>Long-term memory 把跨会话状态放在用户手里</h2>
        <p>长期记忆解决的是另一个时间尺度的问题：当前运行结束后，Agent 留下了什么，下次还能带走什么。</p>
        <p>Deep Agents 把长期记忆表示为 markdown 文件。配置一个记忆路径后，MemoryMiddleware 负责三步：</p>
        <p>1. <strong>Load</strong>：运行开始时读取记忆文件； 2. <strong>Inject</strong>：每次模型调用时把内容注入 system prompt； 3. <strong>Update</strong>：Agent 学到值得保留的偏好后，更新文件。</p>
        <p>例如，用户要求报告使用项目符号而不是段落，这个偏好可以写入记忆文件。下一次运行时，模型仍然能看到这条规则。</p>
        <p>这里的“记忆”更接近可读、可编辑的配置文件，而非模型内部参数。Deep Agents 支持把同一份文件交给不同模型和供应商使用。用户可以查看、修改、删除或迁移它，也能决定哪些信息值得跨会话保留。</p>
        <p>所有权因此成为长期记忆设计中的关键边界。供应商托管的会话记忆方便，但数据位置、跨模型迁移和删除能力受限。文件式记忆牺牲了一部分自动化，换来可读、可控和可迁移。</p>
        <p>这里也需要保留一个工程上的保留意见：长期记忆被注入 system prompt，不等于模型一定会稳定遵守；记忆内容与当前任务指令冲突时，谁优先仍需要明确规则。文件归用户所有解决的是治理问题，不自动解决写入质量和冲突处理。</p>
        <p>五种技术放到一起，会形成一条完整的信息生命周期：</p>
        <ul>
          <li><strong>Offloading</strong> 决定哪些大块内容只留索引，不进入当前窗口；</li>
          <li><strong>Summarization</strong> 决定哪些旧过程可以折叠；</li>
          <li><strong>Skills</strong> 决定哪些专业知识按需展开；</li>
          <li><strong>Subagents</strong> 决定哪些中间过程留在隔离环境；</li>
          <li><strong>Long-term memory</strong> 决定哪些信息跨越会话继续存在。</li>
        </ul>
        <p>它们共同服务于一个目标：让模型在正确的时机看到正确粒度的内容。</p>
        <p>这套方法对构建长任务 Agent 很有启发，也有明确的边界。RAG 和文件搜索解决的是“需要什么，如何找到”，middleware 解决的是“找到以后，什么应该进入窗口，以什么形式进入”。二者缺一不可。只有检索没有上下文治理，Agent 仍然会在长任务中逐渐失焦；只有截断没有可恢复存储，压缩会把错误永久固化。</p>
        <p>从产品角度看，这五种能力已经形成一套可组合的 Agent 基础设施。Deep Agents 也有着明确的厂商利益位置：文章由 LangChain 官方发布，介绍自家开源产品，末尾挂着免费课程和直播注册入口。它的技术思路值得借鉴，但默认阈值与产品表述仍应放回具体任务里验证。</p>
        <p>真正值得继续追问的是：当 Agent 读取被摘要掉的内容、展开某个 Skill、接收子 Agent 的结论，或者更新长期记忆时，harness 是否记录了足够清晰的来源和边界？如果没有，主上下文虽然变干净了，决策依据却可能变得不可审计。上下文工程解决了模型“看得太多”的常见问题，下一步还要解决模型“凭什么这样判断”的问题。</p>
      </div>
    </ArticleShell>
  );
}
