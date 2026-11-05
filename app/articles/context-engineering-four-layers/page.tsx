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
    <ArticleShell meta={meta} prev={{ slug: "message-threads", title: "Claude 消息线程：长会话越跑越慢，慢在每轮都要把历史再发一遍" }}>
      <div>
        <p>从 AWS Deep Insight 看多 Agent 隔离、文件系统通信、动态 Skill 加载与独立验证</p>
        <p>原文：<a href="https://aws.amazon.com/cn/blogs/machine-learning/four-layers-of-context-engineering-for-production-ai-agents-how-deep-insight-applies-them-in-working-code/?utm_source=chatgpt.com">Four layers of context engineering for production AI agents</a></p>
        <h2>一、Context Engineering 真正要解决的，不是上下文窗口太小</h2>
        <p>设计 Agent 时，我们经常会遇到一个问题：任务越复杂，Agent 的上下文就越容易膨胀。</p>
        <p>例如，让一个 Agent 完成一份销售数据分析报告，整个过程可能包括数据读取、数据清洗、探索性分析、统计计算、图表生成、结果验证，最后还要整理成 DOCX 文档。</p>
        <p>这些步骤看起来只是一个完整任务的不同阶段，但对 Agent 来说，每一步都会产生新的上下文。</p>
        <p>读取数据时产生执行结果，分析时生成代码和计算过程，画图时又会产生新的工具调用，最后还需要保留前面的分析结论用于报告生成。</p>
        <p>如果所有工作都由同一个 Agent 完成，那么这些信息就会不断进入同一个 Context Window。</p>
        <p>AWS 在 Deep Insight 的实践中给出了一个例子：一个看似普通的数据分析和报告生成任务，在大约 15 分钟的执行过程中，就可能消耗超过 150K Tokens。即使模型拥有 200K 的上下文窗口，也很容易在任务完成之前接近上限。</p>
        <p>但这里还有一个比上下文溢出更值得关注的问题：上下文并不是越完整，Agent 就越容易完成任务。</p>
        <p>随着历史消息不断累积，真正重要的信息会被大量执行细节包围。模型需要在越来越长的历史中寻找当前任务所需的内容，信息检索成本增加，过时信息也可能干扰后续判断。</p>
        <p>这就是 Context Engineering 需要解决的问题。</p>
        <p>Anthropic 在此前的上下文工程实践中已经讨论过信息选择、Just-in-time Context、工具输出控制和上下文压缩等方法。AWS 这篇文章进一步将这些实践组织成四个层次：架构隔离、Prompt 控制、工具外置和独立验证。</p>
        <p>这里的核心思想发生了一个变化。</p>
        <p>过去我们更多关注如何让模型在有限窗口中容纳更多信息，例如摘要、裁剪、压缩历史消息。</p>
        <p>而现在更值得思考的是：哪些信息根本不应该进入模型上下文？哪些信息应该被保存到外部？什么时候才需要重新加载？</p>
        <p>这实际上是在设计 Agent 系统的信息流，而不是单纯优化 Prompt。</p>
        <h2>二、架构层：多 Agent 的价值，是让不同任务拥有独立的上下文</h2>
        <p>最直接的解决办法，是把一个复杂任务拆分给多个 Agent。</p>
        <p>但多 Agent 并不天然意味着上下文管理更好。</p>
        <p>如果只是把一个 Agent 拆成几个子 Agent，然后每次调用都把完整对话历史传给它们，那么上下文膨胀的问题并没有消失，只是换了一个位置。</p>
        <p>Deep Insight 采用的是另一种方式：每个专业 Agent 拥有独立的 Context Window，协调者只接收它们完成工作后产生的必要信息。</p>
        <p>它的整体角色包括 Coordinator、Planner、Plan Reviewer、Supervisor，以及 Coder、Validator、Reporter、Tracker、Auditor 等专业 Agent。</p>
        <p>以数据分析任务为例，Coder 负责数据分析和图表生成，Validator 负责重新计算和验证，Reporter 负责生成报告，Tracker 负责跟踪任务进度，Auditor 负责检查最终产物。</p>
        <p>这些 Agent 不需要知道彼此执行过程中的所有细节，只需要获得自己完成当前任务所必需的信息。</p>
        <p>为了实现这一点，Deep Insight 使用了一个 <code>shared_state</code>，但它并没有把所有 Agent 的对话历史都放进去，而是只保留四类内容：</p>
        <ul><li><code>messages</code>：上一个 Agent 的最终消息，而不是完整对话。</li><li><code>clues</code>：不同 Agent 提交的压缩结果。</li><li><code>full_plan</code>：Planner 创建、Tracker 更新的任务清单。</li><li><code>history</code>：Agent 名称和消息的简要记录。</li></ul>
        <p>例如，Coder 完成某个分析阶段后，不需要把读取数据、执行代码、调试异常的所有消息交给 Supervisor，只需要把关键发现、完成状态以及生成文件的位置交出去。</p>
        <p>这种方式有一个很重要的设计含义：Agent 之间共享的是任务结果，而不是彼此的工作记忆。</p>
        <p>这也是多 Agent 隔离真正有价值的地方。</p>
        <p>一个 Agent 的上下文可以包含大量专业执行细节，但这些细节不需要全部暴露给协调者。协调者只需要知道当前任务是否完成、结果在哪里、下一步应该做什么。</p>
        <p>AWS 提到，在这种隔离方式下，即使是上下文消耗最大的 Coder，其 Token 使用量也控制在 25K 以内。</p>
        <p>不过，这里需要区分两个概念：上下文隔离不等于任务隔离。Agent 仍然需要共享计划、结果和必要的状态，否则系统就会变成多个互不知情的独立执行者。</p>
        <p>因此，合理的多 Agent 架构不是让每个 Agent 什么都不知道，而是明确规定它们应该知道什么。</p>
        <p>这也解释了为什么 <code>shared_state</code> 不应该成为另一个完整的消息历史仓库。它更像一个任务级共享状态，用于保存协作所必需的信息。</p>
        <h2>三、Prompt 层：限制 Agent 输出，本质上是在建立信息交接协议</h2>
        <p>即使每个 Agent 都有独立上下文，问题仍然没有完全解决。</p>
        <p>因为 Agent 最终还是需要向 Supervisor 返回结果。如果 Coder 每次都返回几千 Tokens 的分析过程，那么这些内容仍然会进入 Supervisor 的上下文。</p>
        <p>因此，Deep Insight 在 Prompt 中增加了明确的输出预算。</p>
        <p>例如：</p>
        <table><thead><tr><th>Agent</th><th>输出预算</th></tr></thead><tbody>
        <tr><td>Coder</td><td>1,000–1,500 Tokens</td></tr>
        <tr><td>Validator</td><td>800 Tokens</td></tr>
        <tr><td>Reporter</td><td>1,000 Tokens</td></tr>
        </tbody></table>
        <p>这里不是简单地要求模型回答得更简短，而是要求它按照统一的结构返回结果。</p>
        <p>具体包括 Status、Completed Tasks、Key Insights 和 Generated Files。</p>
        <p>Status 用于说明成功、部分成功还是失败；Completed Tasks 用于说明完成了计划中的哪些任务；Key Insights 保存重要发现及相关数据；Generated Files 则告诉下游 Agent 具体产物的位置。</p>
        <p>为什么要这么做？</p>
        <p>因为 Agent 之间的交接，本质上也是一次信息传递。如果每个 Agent 都用自由文本描述工作过程，下游 Agent 就需要重新理解、提取和判断这些内容。</p>
        <p>统一的输出结构相当于建立了一个交接协议。</p>
        <p>它让 Supervisor 不必阅读完整执行过程，也能知道当前阶段发生了什么。</p>
        <p>这里还有一个容易被忽略的细节：Deep Insight 要求 Coder 生成的每一段 Python 代码都必须是独立可执行的。</p>
        <p>例如，第一次执行脚本时读取数据并生成变量 <code>df</code>，第二次执行时不能直接假设 <code>df</code> 仍然存在，而是必须重新导入依赖，从文件或缓存中读取数据。</p>
        <p>看起来这是代码规范，但它实际上也是上下文管理策略。</p>
        <p>如果第二次脚本依赖第一次脚本创建的变量，Agent 就必须记住之前执行了什么、变量如何定义、执行环境处于什么状态。历史代码和执行过程就会变成后续推理的必要上下文。</p>
        <p>反过来，如果每次脚本都能够独立执行，那么之前的代码就不再需要保留在 Context Window 中。</p>
        <p>这意味着代码执行状态可以由外部文件维持，而不是依赖模型记忆。</p>
        <p>还有一个值得注意的设计：Supervisor 不允许在当前 Agent 的 Checklist 没有全部完成之前进入下一阶段。</p>
        <p>Planner 创建任务清单，Tracker 根据执行结果更新状态，Supervisor 根据状态决定是否继续。</p>
        <p>这里的 Prompt 不只是告诉模型应该如何回答，还承担了流程约束的作用。</p>
        <p>但需要注意，Checklist 只能表达任务进度，不能单独证明任务结果正确。完成状态与质量验证是两个不同的问题，Deep Insight 在第四层专门处理了后者。</p>
        <p>因此，Prompt 层真正解决的是两个问题：减少不必要的信息输出，以及让 Agent 的工作交接具备可识别的结构。</p>
        <h2>四、工具层：Only pointers in context, actual data in files</h2>
        <p>如果说前两层是在减少 Agent 之间的信息传递，那么第三层解决的是一个更直接的问题：有些内容即使只在一个 Agent 内部使用，也不应该全部进入上下文。</p>
        <p>例如 Coder 需要生成一段 100 行的 Python 脚本。</p>
        <p>如果系统使用传统的两个工具：</p>
        <ul><li><code>write_file</code>：写入 Python 代码。</li><li><code>execute_file</code>：执行 Python 文件。</li></ul>
        <p>那么代码本身很可能先作为一次工具调用的参数进入消息历史，之后执行结果又作为新的工具返回值进入上下文。</p>
        <p>一段 100 行代码，即使执行成功，也可能给后续推理留下大量不再需要的历史内容。</p>
        <p>Deep Insight 的处理方式是将这两个操作合并为一个 <code>write_and_execute_tool</code>。</p>
        <p>它接收代码和文件路径，在工具内部完成写入和执行，最后只向 Agent 返回执行摘要。</p>
        <p>例如：</p>
        <pre><code>Wrote 105 lines to analysis.py
Execution successful
Completed analysis of five categories</code></pre>
        <p>105 行代码留在文件中，Agent 的上下文只需要保留几行执行摘要。</p>
        <p>AWS 根据这个例子给出的估算是，单次脚本产生的上下文 Token 消耗减少约 95%。</p>
        <p>这里真正值得研究的不是工具合并本身，而是工具的输入输出边界。</p>
        <p>过去，工具往往被设计成一个执行动作的接口：输入参数，执行操作，返回结果。</p>
        <p>但在 Agent 系统中，工具还有另一个重要职责：决定什么信息需要返回给模型。</p>
        <p>如果工具执行的是一项复杂操作，那么它不一定需要把所有执行细节都返回给 Agent。它可以在执行层完成数据处理、筛选和持久化，只把当前决策真正需要的信息返回给模型。</p>
        <p>这与 Anthropic 在 Code Execution with MCP 中讨论的服务端过滤思路是一致的：尽可能在执行层处理数据，而不是把大量原始数据搬进模型上下文。</p>
        <p>不过，这种设计也有一个前提：不能为了减少 Token 而把错误信息一并隐藏。</p>
        <p>如果脚本执行失败，工具至少应该返回错误类型、关键异常信息、文件位置和必要的诊断线索。否则 Agent 虽然节省了上下文，却失去了定位问题的能力。</p>
        <h3>文件系统不只是存储介质，也可以成为 Agent 的通信总线</h3>
        <p>在 Deep Insight 中，文件外置并不局限于 Python 代码。</p>
        <p>它进一步把分析结果、计算元数据、验证结果和审计发现都放到了文件系统中。</p>
        <p>例如，Coder 完成分析后，将详细结果追加到 <code>all_results.txt</code>，Supervisor 只收到一条简短消息，说明分析已经完成，详细结果保存在指定文件中。</p>
        <p>Reporter 真正需要生成报告时，再读取这个文件。</p>
        <p>AWS 给出的示例中，Coder 原本需要传递的详细分析内容，可以被一条约 30 Tokens 的完成消息替代。</p>
        <p>更重要的是，不同文件承担了不同的生产和消费职责：</p>
        <table><thead><tr><th>文件</th><th>生产者</th><th>消费者</th><th>保存内容</th></tr></thead><tbody>
        <tr><td><code>all_results.txt</code></td><td>Coder</td><td>Reporter</td><td>详细分析结果</td></tr>
        <tr><td><code>calculation_metadata.json</code></td><td>Coder</td><td>Validator</td><td>计算值、公式和数据来源</td></tr>
        <tr><td><code>citations.json</code></td><td>Validator</td><td>Reporter</td><td>已验证的引用数据</td></tr>
        <tr><td><code>audit_findings.json</code></td><td>Auditor</td><td>Reporter</td><td>报告审计发现</td></tr>
        <tr><td><code>coder_analysis_utils.py</code></td><td>Coder</td><td>所有脚本</td><td>可复用的公共函数</td></tr>
        </tbody></table>
        <p>这实际上改变了 Agent 之间的协作方式。</p>
        <p>传统的多 Agent 系统通常通过消息传递结果。上游 Agent 把结果发给下游 Agent，协调者再决定如何继续。</p>
        <p>Deep Insight 则把一部分协作过程转移到了文件系统。</p>
        <p>Agent 只需要传递文件路径和必要的状态信息，真正的数据由消费者按需读取。</p>
        <p>这种设计很像软件系统中的生产者与消费者模式。</p>
        <p>生产者负责生成结构化产物，消费者根据自己的职责读取它，而不需要了解生产者完整的执行历史。</p>
        <p>例如，Validator 不需要知道 Coder 是如何一步步写出计算代码的，它只需要读取 <code>calculation_metadata.json</code>，获得计算公式、原始数据来源和预期结果，然后独立验证。</p>
        <p>Reporter 也不需要保留 Coder 的所有对话，只需要读取分析结果和已经验证的引用数据。</p>
        <p>这里的文件系统已经不只是一个缓存目录，而是承担了跨 Agent 状态共享、任务交接和结果追溯的职责。</p>
        <p>不过，这种架构在生产环境中还需要补充一些约束。</p>
        <p>首先，文件需要具备明确的任务归属，不能让不同用户或不同任务共享同一个可写目录。</p>
        <p>其次，多个 Agent 可能同时读取或更新文件，需要考虑原子写入、并发冲突和版本一致性。</p>
        <p>另外，文件路径本身也不代表数据可信。下游 Agent 还需要知道文件由谁生成、对应哪个任务、使用了什么版本，以及是否已经完成验证。</p>
        <p>因此，如果把这一模式迁移到更复杂的 Agent Runtime 中，我更倾向于把它理解为一种基于外部持久化产物的通信机制，而不是简单地让多个 Agent 共享一个文件夹。</p>
        <figure className="article-figure">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/images/context_file_bus.svg" alt="文件系统当通信总线：生产者写文件，消费者按需读" /><figcaption>Coder 写分析结果与计算元数据到文件，Validator、Reporter、Auditor 按职责读取</figcaption></figure>
        <h3>Skills：从启动时全部加载，变成执行时按需加载</h3>
        <p>工具层还有一个值得单独讨论的设计：Skills 的动态加载。</p>
        <p>当一个 Agent 拥有越来越多的专业能力时，System Prompt 很容易变得庞大。</p>
        <p>假设系统包含数据结构检查、README 生成、工具创建、Prompt 编写等多个 Skill。如果每次初始化 Agent 时都把所有 <code>SKILL.md</code> 的完整内容加载进去，那么即使当前任务只需要生成 README，也必须携带其他所有 Skill 的知识。</p>
        <p>Deep Insight 采用了两阶段加载机制。</p>
        <p>第一阶段是 Skill Discovery。</p>
        <p>系统初始化时扫描 Skill 目录，读取每个 Skill 的名称、描述和路径，形成一个简短的能力目录。文章给出的目录规模约为 500 Tokens。</p>
        <p>第二阶段是 Skill Loading。</p>
        <p>当 Agent 判断当前任务需要某个能力时，再调用 <code>skill_tool</code>，由 SkillLoader 读取对应的 <code>SKILL.md</code>，将完整操作规范加载到上下文。</p>
        <p>例如，用户要求创建 README，Agent 先从能力目录中发现 <code>readme-generator</code>，随后调用：</p>
        <pre><code>skill_tool(skill_name="readme-generator")</code></pre>
        <p>系统才会将完整的 README 生成规范返回给 Agent。</p>
        <p>AWS 给出的例子中，完整加载所有 Skill 需要超过 20K Tokens，而启动阶段只需要约 500 Tokens。需要使用时，再额外加载对应的几千 Tokens。</p>
        <p>文章据此给出了约 97% 的 System Prompt 体积缩减比例。</p>
        <p>这里值得注意的是，Skill 的动态加载和 RAG 虽然都涉及按需获取信息，但两者解决的问题并不完全相同。</p>
        <p>RAG 通常围绕用户问题检索相关知识片段，重点是从知识库中找到有用的信息。</p>
        <p>Skill 更像一套可以被激活的任务执行规范，除了知识本身，还可以规定使用条件、工具调用方式、操作步骤和约束。</p>
        <p>例如，一个 PDF Skill 不只是告诉 Agent PDF 是什么，还可以告诉它应该使用哪些工具、如何读取表格、如何处理页面以及如何检查输出结果。</p>
        <p>所以，Skill 不应该被理解为另一种文档检索，而是将专业知识和执行规则模块化，再通过任务触发机制按需加载。</p>
        <p>这也意味着 Skill 的设计需要关注两个问题：能力目录是否足够清晰，让 Agent 能够正确选择；完整 Skill 是否足够明确，让 Agent 加载之后能够可靠执行。</p>
        <p>如果目录描述不准确，Agent 可能根本不会加载正确的 Skill。即使加载成功，内容过长、规则冲突或工具权限不匹配，也会影响执行效果。</p>
        <p>动态加载解决的是不必要的预加载，并不意味着加载之后的内容就不再消耗上下文。</p>
        <h2>五、验证层：上下文隔离之后，如何保证结果可信？</h2>
        <p>前三层主要解决信息膨胀问题，但它们也带来了一个新的挑战。</p>
        <p>当 Agent 不再共享完整的执行历史，下游 Agent 就无法直接看到上游是如何得出结论的。</p>
        <p>假设 Coder 计算出了某个产品类别的销售额占比，并把结果写入 <code>all_results.txt</code>。</p>
        <p>Reporter 读取之后，就会把这个数据放进最终报告。</p>
        <p>但如果 Coder 的计算过程存在错误，Reporter 很可能会直接把错误带入最终产物。</p>
        <p>如果所有 Agent 都共享完整上下文，至少还有机会看到之前的计算过程。但上下文隔离之后，这种隐式的信息可见性就消失了。</p>
        <p>因此，Deep Insight 增加了独立验证机制。</p>
        <p>这里最值得关注的不是多增加了一个 Validator，而是它改变了验证的依据。</p>
        <p>Validator 不会简单地询问 Coder：「你的计算结果正确吗？」</p>
        <p>它会读取 Coder 留下的结构化计算元数据，重新执行计算，再将结果与原始数据进行比较。</p>
        <p>具体来说，Coder 在分析过程中通过公共模块 <code>coder_analysis_utils.py</code> 记录计算信息，包括：</p>
        <ul><li>计算结果及其标识。</li><li>计算描述和公式。</li><li>原始数据文件。</li><li>使用的数据列。</li><li>计算的重要性等级。</li></ul>
        <p>这些内容被写入 <code>calculation_metadata.json</code>。</p>
        <p>Validator 读取文件后，根据原始数据重新执行计算，并比较预期值与实际值。文章使用的数值判断标准是绝对误差小于 0.01。</p>
        <p>验证通过的结果再进入 <code>citations.json</code>，供 Reporter 生成报告时引用。</p>
        <p>这条链路很重要，因为它把 Agent 之间的信任关系从「相信上一个 Agent 的回答」，变成了「根据可追溯的计算依据独立验证」。</p>
        <h3>验证本身也需要预算</h3>
        <p>但如果让 Validator 重新计算所有内容，验证成本也可能非常高。</p>
        <p>Deep Insight 因此引入了计算重要性分级和抽样策略。</p>
        <p>例如：</p>
        <ul><li>计算数量超过 50 项时，验证全部高优先级计算，再抽取 10 项中优先级计算。</li><li>超过 20 项时，验证全部高优先级计算，再抽取 15 项中优先级计算。</li><li>不超过 20 项时，验证全部高、中优先级计算，再抽取 5 项低优先级计算。</li></ul>
        <p>这是一种风险导向的验证策略。</p>
        <p>并不是所有计算都需要投入相同的验证资源。对于最终报告中的核心结论、关键指标和高影响计算，应该优先验证；对于影响较小的中间计算，则可以根据成本进行抽样。</p>
        <p>当然，这套规则只是 Deep Insight 的具体实现，并不是适用于所有业务的通用标准。比如金融结算、支付金额、权限决策等场景，关键数据可能需要全部验证，不能直接套用这种抽样方式。</p>
        <h3>Auditor：验证计算结果，还要验证最终交付物</h3>
        <p>Validator 解决的是计算是否正确，但它并不能保证最终报告没有问题。</p>
        <p>因为 Reporter 在生成 DOCX 时，仍然可能引用错误、遗漏数据，或者把已经验证过的结果写错。</p>
        <p>因此，Deep Insight 又增加了 Auditor。</p>
        <p>Auditor 会读取最终 DOCX，并对照 <code>citations.json</code> 和 <code>calculation_metadata.json</code> 检查报告内容。</p>
        <p>如果发现引用问题，它不会直接修改原始验证数据，而是将问题记录到 <code>audit_findings.json</code>，再交给 Reporter 定向修复。</p>
        <p>文章还设置了最多两次修复重试。</p>
        <figure className="article-figure">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/images/context_validation_chain.svg" alt="验证链：信任从回答变成可追溯的证据" /><figcaption>Coder 记录计算元数据，Validator 重算比对，Auditor 审计最终产物，定向修复最多两次</figcaption></figure>
        <p>这里实际上形成了三种不同的质量责任：</p>
        <ul><li>Coder 对分析结果负责。</li><li>Validator 对计算依据和验证结果负责。</li><li>Auditor 对最终交付物是否符合验证依据负责。</li></ul>
        <p>这三个角色不能简单合并成一个「Review Agent」。</p>
        <p>因为它们验证的对象并不相同：一个负责生产结果，一个负责独立验证计算，一个负责审计最终产物。</p>
        <p>这种分工也让我想到一个更重要的工程原则：Agent 的输出应该能够被其他组件独立检查，而不是只能依赖生成它的 Agent 自己解释。</p>
        <p>这不仅适用于数据分析，也适用于代码生成、自动化操作和复杂业务审批。</p>
        <p>例如，代码 Agent 生成代码之后，可以通过测试结果验证行为；支付 Agent 发起交易之后，可以通过交易记录和账务状态验证结果；审批 Agent 生成审批建议之后，可以通过规则引擎和权限系统验证决策是否符合约束。</p>
        <p>验证的关键不是再找一个模型说一次「看起来没问题」，而是建立独立于原始生成过程的证据链。</p>
        <h2>六、上下文压缩和 Prompt Caching，仍然是必要的兜底机制</h2>
        <p>前面四层并不意味着可以完全不做上下文压缩。</p>
        <p>Deep Insight 仍然使用 Strands Agents SDK 提供的 <code>SummarizingConversationManager</code>。</p>
        <p>当上下文达到压缩条件时，系统会将较早的 50% 消息总结成一条摘要，同时保留最近 10 条消息。</p>
        <p>它还通过专门的摘要 Prompt，要求保留 <code>clues</code>、<code>plans</code> 和任务追踪状态。</p>
        <p>这说明四层上下文工程与 Compaction 并不是互相替代的关系。</p>
        <p>前面的架构隔离、输出控制和文件外置，主要是在减少不必要的信息进入 Context；Compaction 则负责处理那些仍然不可避免的历史信息。</p>
        <p>两者解决的问题不同。</p>
        <p>Prompt Caching 也有类似的定位。</p>
        <p>Deep Insight 根据 Agent 的调用频率和 Prompt 重复程度，选择性地启用缓存。对于 Supervisor、Coder、Reporter、Auditor 等重复调用较多的 Agent，缓存更容易产生收益；对于部分调用频率较低或输入变化较大的 Agent，则没有统一开启。</p>
        <p>文章给出的最高成本降低比例约为 90%。</p>
        <p>但需要区分：Prompt Caching 降低的是重复输入的处理成本，不是上下文窗口的实际占用量。即使一段内容命中缓存，它仍然属于当前请求的上下文。</p>
        <p>所以，缓存不能解决上下文膨胀，只能优化重复上下文带来的成本。</p>
        <p>到这里，Deep Insight 的四层设计才算完整：前面主动控制信息的产生和流动，最后再用摘要和缓存处理剩余的上下文成本。</p>
        <h2>七、把四层设计放在一起看：它实际上是在建立一套信息生命周期管理机制</h2>
        <p>如果把 Deep Insight 的实现放在一起，会发现这四层并不是互相独立的优化技巧，而是围绕信息在 Agent 系统中的生命周期展开的。</p>
        <p>一个信息从产生到被最终使用，大致经历几个阶段：</p>
        <p>首先，架构层决定信息应该属于哪个 Agent。不同角色拥有独立的上下文，避免所有执行历史都进入同一个窗口。</p>
        <p>其次，Prompt 层决定信息应该以什么形式交给下一个 Agent。通过 Token Budget 和统一输出结构，只保留任务状态、关键发现和产物引用。</p>
        <p>接着，工具层决定信息应该存放在哪里。代码、分析结果和计算元数据不再默认进入消息历史，而是写入外部文件，需要时再加载。</p>
        <p>最后，验证层决定这些信息是否可信。通过独立计算、引用校验和最终产物审计，避免上下文隔离之后出现错误传递。</p>
        <p>这四层解决的其实是四个不同的问题：</p>
        <table><thead><tr><th>层次</th><th>核心问题</th><th>控制对象</th></tr></thead><tbody>
        <tr><td>架构</td><td>谁应该看到这些信息？</td><td>信息的归属</td></tr>
        <tr><td>Prompt</td><td>应该传递多少信息？</td><td>信息的表达</td></tr>
        <tr><td>工具</td><td>信息应该存在哪里？</td><td>信息的存储与加载</td></tr>
        <tr><td>验证</td><td>信息是否可信？</td><td>信息的质量</td></tr>
        </tbody></table>
        <p>这也是我认为这篇文章最值得带走的部分。</p>
        <p>Context Engineering 不应该只被理解成一种 Prompt 技巧，它更接近 Agent Runtime 的基础设计能力。</p>
        <figure className="article-figure">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/images/context_four_layers.svg" alt="四层上下文工程：信息生命周期的四个问题" /><figcaption>架构定归属、Prompt 定表达、工具定存储与加载、验证定质量，压缩与缓存只是兜底</figcaption></figure>
        <h2>八、我的判断：下一阶段的 Agent 工程，重点是管理信息，而不是堆叠上下文</h2>
        <p>读完 Deep Insight，我最大的感受是，很多 Agent 系统在处理复杂任务时，仍然过度依赖对话历史。</p>
        <p>我们习惯把模型的消息历史当成任务状态的主要载体。</p>
        <p>Agent 做了什么、读取了什么、执行了什么、得出了什么结论，似乎都应该留在上下文里，以便模型在下一轮继续使用。</p>
        <p>但这其实混淆了两个概念：任务状态和对话历史。</p>
        <p>对话历史记录的是模型与工具之间发生过什么，任务状态记录的是当前任务已经完成什么、还需要什么、哪些结果已经产生。</p>
        <p>它们有交集，但并不是一回事。</p>
        <p>一个任务可能执行了几十次工具调用，但对于下一阶段来说，真正需要的信息只有当前进度、几个关键结论和一些文件路径。</p>
        <p>如果仍然要求模型通过阅读完整历史来恢复任务状态，那么上下文就会承担太多本不应该由它承担的职责。</p>
        <p>我认为 Deep Insight 的设计可以进一步抽象成三个工程原则。</p>
        <h3>1. 把 Context 当作工作空间，而不是永久存储</h3>
        <p>Context 最适合保存当前推理所需要的信息，而不是保存系统发生过的所有事情。</p>
        <p>代码、原始数据、执行日志、历史结果和任务状态，应该根据自身特点选择存储位置。</p>
        <p>例如，代码可以保存在文件系统，任务进度可以保存在数据库，执行日志可以进入日志系统，结构化计算结果可以保存为 JSON。</p>
        <p>模型只需要通过引用和必要的摘要访问这些信息。</p>
        <p>这也意味着，在设计 Agent 系统时，应该先回答一个问题：</p>
        <p>如果下一轮模型完全看不到上一轮的对话，它能否通过外部状态继续完成任务？</p>
        <p>如果答案是否定的，说明系统可能仍然把过多的任务状态放在了对话历史中。</p>
        <p>当然，并不是所有信息都适合外置。当前推理所依赖的关键约束、用户意图和决策依据，仍然需要在适当时机进入 Context。外置的目的是减少无关信息，而不是让模型在每次推理时都重新读取所有文件。</p>
        <h3>2. Agent 协作应该围绕产物和状态，而不是围绕消息</h3>
        <p>多 Agent 系统最容易出现的一种设计，就是让主 Agent 不断接收子 Agent 的完整回答，再把这些回答传递给其他 Agent。</p>
        <p>这种方式实现起来很直观，但系统规模变大之后，消息会逐渐成为主要的上下文负担。</p>
        <p>Deep Insight 提供了一个值得借鉴的方向：让 Agent 生产可复用的结构化产物，下游 Agent 根据职责读取。</p>
        <p>例如：</p>
        <ul><li>Planner 生产任务计划。</li><li>Coder 生产代码、分析结果和计算元数据。</li><li>Validator 生产验证报告和引用数据。</li><li>Reporter 生产最终文档。</li><li>Auditor 生产审计发现。</li></ul>
        <p>消息负责告诉系统发生了什么，产物负责保存真正需要使用的数据。</p>
        <p>这两者应该有明确的分工。</p>
        <p>不过，如果将文件系统通信扩展到多实例、分布式或多用户环境，我不会直接使用一个共享目录来承担全部状态管理。</p>
        <p>更合理的方式是将产物存储在对象存储或专用文件服务中，以数据库记录任务状态和产物元数据，通过任务 ID、版本号和权限控制建立关联。</p>
        <p>这样既能保留文件外置的优势，也能解决并发、权限、恢复和审计问题。</p>
        <h3>3. 上下文隔离越彻底，独立验证就越重要</h3>
        <p>这是四层设计中我认为最容易被低估的地方。</p>
        <p>很多人讨论多 Agent 时，会关注如何拆分角色、如何分配工具、如何让 Agent 并行工作。</p>
        <p>但拆分之后，真正需要考虑的是：不同 Agent 之间如何建立可信的协作关系？</p>
        <p>如果上游 Agent 生成了一个结果，下游 Agent 只能相信它，那么多 Agent 最终还是会形成一条错误传播链。</p>
        <p>Deep Insight 的 Validator 和 Auditor 说明了一种更可靠的方向：让每个关键结果都尽可能携带可检查的证据。</p>
        <p>例如，计算结果不仅要保存最终数值，还应该保存计算公式、数据来源和使用的字段。最终报告不仅要保存生成文件，还应该能够对照已经验证的引用数据进行审计。</p>
        <p>这样，下游组件就不需要依赖上游 Agent 的解释来判断结果是否可信。</p>
        <p>我认为这也是 Agent 从 Demo 走向生产系统时必须补齐的一环。</p>
        <h2>九、如果应用到自己的 Agent 系统，我会怎么取舍？</h2>
        <p>并不是所有 Agent 都需要 Deep Insight 这样的多层级架构。</p>
        <p>如果只是一个简单的知识问答 Agent，强行引入 Coordinator、Planner、Supervisor、Validator 和 Auditor，反而会增加系统复杂度。</p>
        <p>我更倾向于根据任务的执行周期、上下文规模和错误成本，逐步引入这些机制。</p>
        <p>例如，一个普通的 RAG 问答系统，首先需要解决的是检索结果控制、引用来源和对话历史管理，没有必要一开始就拆成多个 Agent。</p>
        <p>但如果是一个长期运行的文档处理 Agent，情况就不同了。</p>
        <p>它可能需要读取几十份文件，提取内容，生成分析结果，再创建报告。这时候就应该考虑将原始文件、提取结果和最终文档外置，Context 中只保留任务状态和必要摘要。</p>
        <p>如果进一步发展成多 Agent 工作流，那么可以增加独立上下文、结构化产物交接和任务状态管理。</p>
        <p>对于涉及金额计算、数据分析、权限操作等高风险任务，再引入独立验证和审计机制。</p>
        <p>我会按照下面的思路逐步演进：</p>
        <table><thead><tr><th>系统复杂度</th><th>优先引入的机制</th></tr></thead><tbody>
        <tr><td>简单问答 Agent</td><td>历史裁剪、检索控制、引用</td></tr>
        <tr><td>长任务 Agent</td><td>外部状态、文件产物、Checkpoint</td></tr>
        <tr><td>多 Agent 工作流</td><td>独立 Context、结构化交接、任务追踪</td></tr>
        <tr><td>生产级关键任务</td><td>独立验证、权限隔离、审计与恢复</td></tr>
        </tbody></table>
        <p>这里还有一个需要特别强调的地方：文件外置并不等于任务可恢复。</p>
        <p>真正的长任务恢复，还需要保存执行状态、任务输入、产物版本、Checkpoint 和失败位置。否则 Agent 虽然不需要保留完整对话，却可能在进程重启之后丢失任务进度。</p>
        <p>同样，<code>shared_state</code> 也不能直接替代持久化状态存储。它更适合承担一次工作流执行过程中的协作状态；跨进程、跨实例和跨会话的恢复，需要更可靠的持久化机制。</p>
        <p>所以，我不会直接照搬 Deep Insight 的 Agent 数量，而是会优先借鉴它对信息流的设计。</p>
        <h2>结语</h2>
        <p>过去我们优化 Agent，往往会先考虑模型能力、Prompt 质量、工具数量，以及上下文窗口是否足够大。</p>
        <p>但随着 Agent 开始承担越来越长、越来越复杂的任务，问题逐渐从模型能不能完成任务，转变成系统能不能持续、可靠地组织任务。</p>
        <p>Deep Insight 这篇文章给出的答案，不是继续扩大上下文，也不是不断对历史消息做摘要，而是把上下文管理拆成架构、Prompt、工具和验证四个层次。</p>
        <p>其中，我最认可的是两个方向。</p>
        <p>一个是把文件系统从简单的读写工具，提升为 Agent 之间共享结构化产物的通信机制。</p>
        <p>另一个是把结果验证从模型自我检查，转变为独立 Agent 基于原始数据和结构化证据进行验证。</p>
        <p>前者解决信息如何流动，后者解决信息是否可信。</p>
        <p>Agent 真正需要的不是记住所有发生过的事情，而是在需要的时候，能够找到正确的信息，理解它的来源，并且有能力验证它。</p>
        <p>这才是我理解的 Context Engineering。</p>
        <p>原文与延伸阅读</p>
        <ul><li><a href="https://aws.amazon.com/cn/blogs/machine-learning/four-layers-of-context-engineering-for-production-ai-agents-how-deep-insight-applies-them-in-working-code/?utm_source=chatgpt.com">AWS：Four layers of context engineering for production AI agents</a></li><li><a href="https://github.com/aws-samples/sample-deep-insight?utm_source=chatgpt.com">Deep Insight：开源参考实现</a></li><li><a href="https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents?utm_source=chatgpt.com">Anthropic：Effective Context Engineering for AI Agents</a></li><li><a href="https://www.anthropic.com/engineering/multi-agent-research-system?utm_source=chatgpt.com">Anthropic：How We Built Our Multi-Agent Research System</a></li></ul>
        <p>补充一个阅读判断： 这篇文章真正值得复用的不是四层模型的名称，而是它背后的设计转变——从依赖消息历史维持任务连续性，转向依赖外部状态、结构化产物和独立验证维持任务连续性。这个思路可以迁移到 LangGraph、自己实现的 Agent Loop，以及各种长任务自动化系统中。</p>
      </div>
    </ArticleShell>
  );
}
