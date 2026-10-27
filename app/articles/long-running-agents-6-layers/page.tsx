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
      prev={{ slug: "rag-vs-agentic-rag", title: "RAG 与 Agentic RAG 的分界不在检索次数，在\"证据够不够\"由谁说了算" }}
      next={{ slug: "bedrock-prompt-caching", title: "Agent 的 Prompt Caching：真正该优化的是上下文的重复读取" }}
    >
      <div>
        <p>一个 Agent 接到任务后，需要等待几小时、几天，甚至跨越服务器重启继续执行，问题就从模型能力转向了系统设计。《Build Long-Running Agents》围绕 Google ADK 的长时运行工作流，拆出了六层架构：Trigger、Runner、State、Resumable Workflow、Human Gate 和 Guards，分别负责唤醒、执行、记忆、恢复、授权和安全检查。</p>
        <p>这套架构最值得研究的地方，是它重新划分了 Agent 的责任边界：模型负责决定下一步做什么，外部系统负责让任务在正确的时间继续，持久化状态负责保存进度，执行工具负责确保重试不会造成重复副作用。长时运行 Agent 的可靠性，最终取决于这些机制能不能配合起来。</p>
        <p>假设要做一个演唱会抢票助手。用户告诉它想买什么场次、几张票、预算是多少，Agent 找到目标场次后进入候补队列。接下来，它要等待队列推进，等有票时重新检查价格和座位，再向用户确认预算，最后才执行购买。</p>
        <p>这个任务里有几个完全不同的问题：谁负责定时检查队列，进程退出后怎么恢复，用户之前确认的条件存在哪里，等待期间座位被别人买走怎么办，以及购买接口超时后，怎么避免再次扣款。</p>
        <p>单靠一个模型调用无法同时解决这些问题。把「请在十分钟后再检查」写进提示词，也不会凭空产生一个定时器。模型生成了等待的回复，并不代表后台已经安排了下一次执行。原本在对话中看起来连续的任务，到了工程层面，实际上是一组需要协调的独立操作。</p>
        <p><strong>第一步是让模型之外的东西掌握时间。</strong></p>
        <p>六层架构中的 Trigger 就是任务的唤醒机制。开发阶段可以用一次性定时器验证流程，生产环境则可以使用 Cloud Scheduler 定期调用 HTTP 接口，也可以通过 Pub/Sub 在事件发生时触发执行。Webhook 和用户主动点击同样可以调用这个接口。</p>
        <p>这里有个重要的设计：触发器不直接调用模型，而是向应用的唤醒端点发送请求，由服务端的 Runner 接管任务。</p>
        <p>例如，定时任务每隔一段时间调用 <code>/wake/&#123;user_id&#125;/&#123;session_id&#125;</code>，服务端根据用户和会话标识找到已有任务，再运行一次 Agent，让它检查当前队列状态。</p>
        <p>每次唤醒都只需要完成当下的一段工作。队列还没轮到用户，就保存最新进度并结束这次执行；下次触发时，再从持久化状态继续。</p>
        <p>这种方式与在一个工具调用内部写无限循环有明显区别。循环会占住当前执行过程，进程被杀掉后也无法自行恢复，还可能持续消耗模型调用额度。外部触发则把等待时间交给调度系统，Agent 只在需要工作时运行。</p>
        <p>不过，定时触发本身还不够。它只能保证系统有机会再次执行，不能保证执行的是正确的任务，更不能保证某个操作只发生一次。</p>
        <p><strong>第二步是让应用拥有自己的执行环境。</strong></p>
        <p>PDF 使用 Google Agent Development Kit（ADK）Python 2.13 作为实现基础。这里的 Runner 是负责驱动一次 Agent 执行的组件：加载或创建 Session，调用模型，执行工具，追加事件，并通过相应的存储服务持久化数据。</p>
        <p>开发时使用的 <code>adk web</code> 已经提供了运行环境，所以在浏览器里测试成功，并不代表部署到生产环境后就能继续工作。生产应用需要自己创建 Runner，并为它配置实际使用的 Session、Memory 和 Artifact 存储服务。</p>
        <p>示例使用 <code>DatabaseSessionService</code> 保存会话，使用 <code>VertexAiMemoryBankService</code> 管理长期记忆，并通过 <code>GcsArtifactService</code> 保存文件类产物。它们承担的是不同职责：会话记录执行历史，记忆服务保存可复用的信息，Artifact 服务保存任务产生的文件。</p>
        <p>Runner 也不能独立解决长时任务。它负责执行一次调用，不负责自动决定什么时候再次调用，更不能单凭自身保证进程重启后恢复到正确位置。</p>
        <p>因此，Runner 上面还需要调度机制，下面需要可靠的存储，中间则需要明确的工作流控制。</p>
        <p><strong>第三步是区分事件、状态和记忆。</strong></p>
        <p>长时运行任务最容易出现的一个问题，是把所有信息都当成聊天记录处理。</p>
        <p>PDF 将需要持久化的信息分成了三个层次。</p>
        <p>事件记录发生过什么，例如用户选择了哪个场次、工具返回了什么结果、Agent 做出了什么选择。状态记录任务当前需要使用的值，例如目标场次 ID、候补队列位置、票数和预算上限。记忆保存能够跨会话复用的信息，例如用户长期偏好的座位类型。</p>
        <p>三者的生命周期不同。事件是历史记录，状态是当前工作所需的数据，记忆则是经过提炼、希望在未来继续使用的信息。</p>
        <p>ADK 的状态还可以通过不同前缀区分作用范围：</p>
        <ul><li>普通键属于当前 Session，例如 <code>target_event_id</code> 和 <code>queue_position</code>。</li><li><code>user:</code> 开头的键跨越同一用户在应用中的多个 Session，例如 <code>user:seat_preference</code> 和 <code>user:budget_cap</code>。</li><li><code>app:</code> 开头的键属于整个应用，例如场馆规则。</li><li><code>temp:</code> 开头的键只在当前调用期间使用，不持久化。</li></ul>
        <p>例如，当前任务的排队位置应该放在 Session 状态中，而用户长期偏好的座位类型可以放进用户级状态或长期记忆。这样，即使用户之后重新开启一个会话，也不必从头收集所有偏好。</p>
        <p>持久化同样有不同选择。开发时可以使用 SQLite，生产环境可以采用 Cloud SQL 和 PostgreSQL，也可以选择托管的 Agent Engine Session 服务。PDF 将这些方式作为从本地实验走向生产部署的不同选项。</p>
        <p>长期记忆则可以通过 Vertex AI Memory Bank 或自定义 Markdown 存储实现。前者能够提炼和整合事实，并支持语义检索；自定义存储则由应用自己决定如何写入和读取。</p>
        <p>另外，任务运行数天，事件记录可能不断增长。ADK 的 <code>EventsCompactionConfig</code> 可以定期压缩较早的事件，并保留一定重叠内容，减少历史记录持续占用上下文窗口的问题。</p>
        <p>这里保存的东西越多，系统的恢复能力越强，但存储所有历史并不等于模型就能正确理解所有历史。事件压缩会改变模型能够直接看到的上下文，因此仍然需要区分哪些信息可以概括，哪些信息必须以结构化字段的形式完整保留。</p>
        <p><strong>第四步才是让工作流真正具备恢复能力。</strong></p>
        <p>这套架构的核心实现是可恢复工作流。PDF 使用 ADK 的 <code>Workflow</code>、<code>RequestInput</code> 和 <code>ResumabilityConfig</code>，把一个长任务拆成多个可以记录结果、暂停和恢复的节点。</p>
        <p>演唱会抢票流程可以拆成选场次、加入队列、检查队列位置、预算确认和购买几个节点。</p>
        <p>当队列还没有轮到用户时，<code>check_front</code> 节点查询最新的队列状态，将位置写入状态，然后通过 <code>RequestInput</code> 暂停当前流程，等待下一次唤醒。</p>
        <p>如果服务进程在等待期间被终止，恢复时可以加载原来的 Session 和工作流记录。已经完成的节点复用已记录的输出，需要重新确认外部现实的节点则重新执行。</p>
        <p>PDF 用 <code>rerun_on_resume</code> 控制节点恢复时的行为。<code>pick_show</code> 和 <code>queue_up</code> 这类已经完成的节点不应无故重复执行；<code>check_front</code> 则需要在恢复时重新查询队列，因为之前保存的位置可能已经过时。</p>
        <p>这就是长时运行任务与普通对话之间的关键差异：工作流需要知道哪些事情已经完成，哪些事情必须重新检查，哪些事情正在等待外部输入。</p>
        <p>对于不同类型的等待，ADK 还提供了不同的处理方式。</p>
        <p>如果工具启动了一个在外部运行的任务，例如视频渲染、批处理或退款处理，可以使用 <code>LongRunningFunctionTool</code> 表达长时间运行的工具调用。外部任务完成后，再将结果返回给原来的调用。</p>
        <p>如果等待的是用户回答或外部信号，则可以使用工作流节点配合 <code>RequestInput</code>，在后续运行时通过对应的 <code>interrupt_id</code> 获取恢复输入。</p>
        <p>两种方式解决的不是同一个问题。前者主要处理外部任务的异步执行，后者主要处理工作流需要暂停、等待输入再继续的场景。</p>
        <p><strong>第五步是让高风险操作停下来，等待人确认。</strong></p>
        <p>在购买节点之前，Agent 需要询问用户每张票的预算，复述确认票数和价格上限，并等待明确的同意。</p>
        <p>PDF 将预算确认作为独立的工作流节点。用户给出的预算写入 <code>user:budget_cap</code>，批准的票数写入 <code>approved_qty</code>，后续购买流程必须使用这些已经确认的条件。</p>
        <p>同样的原则可以用于发送邮件、发布内容和删除数据等不可轻易撤销的操作。工作流可以自动完成检索、整理和准备，但执行具有实际后果的动作之前，应当根据风险要求用户明确授权。</p>
        <p>这里还需要注意，用户同意的范围必须被保存下来。用户批准购买两张票，并不等于批准在座位变更后购买三张；同意某个价格，也不等于同意价格上涨后的新方案。</p>
        <p>但人工确认只能解决授权问题，不能解决数据过期和重复执行的问题。这就是最后一层 Guards 要处理的事情。</p>
        <p><strong>第六步是让系统在恢复和重试时依然守住边界。</strong></p>
        <p>长时任务会经历暂停、网络超时、服务器重启和接口错误。工作流恢复时，某个工具可能再次运行。更麻烦的是，调用方未必知道上一次操作究竟有没有成功。</p>
        <p>例如，购买请求已经到达票务服务，服务端完成了扣款，但响应在返回途中丢失。Agent 看到超时后重新发起请求，如果购买接口没有幂等机制，就有可能重复下单。</p>
        <p>PDF 为此设计了三道保护。</p>
        <p>第一道是预算确认节点，限制用户授权的购买范围。</p>
        <p>第二道是在购买工具执行之前进行实时检查。<code>purchase_guard</code> 重新查询座位是否仍然可用，核对票数是否与批准数量一致，并检查币种和实时价格是否符合预算。条件不满足时，就阻止购买工具执行。</p>
        <p>第三道是幂等键。示例根据 Session、座位 ID 和数量构造 <code>order_key</code>，先将键写入持久化状态，再把它传给卖票接口。重试时复用同一个键，让支持幂等的服务端将多次请求识别为同一笔业务操作。</p>
        <p>这三道保护各有分工。预算确认负责授权，实时检查负责判断当前条件是否仍然成立，幂等键负责处理同一业务操作的重复请求。</p>
        <p>PDF 将这套架构部署到 Google Cloud 时，使用 Cloud Run 运行 Agent 服务，用 Cloud Scheduler 或 Pub/Sub 触发执行，以 Cloud SQL 保存会话，并用 Vertex AI Memory Bank 或其他记忆方案管理长期信息，Cloud Storage 保存文件产物。</p>
        <p>从本地实验到生产环境，真正需要保留下来的不是某个特定云服务，而是这六层之间的责任关系。</p>
        <p>长时运行 Agent 的设计原则也由此变得清楚：每次唤醒都应该有明确的工作边界，每个需要恢复的节点都应该留下足够的信息，每次可能产生外部副作用的调用都应该考虑重复执行。</p>
        <p>这套架构把一个看起来连续的智能任务，拆成了可持久化、可恢复、可重新验证的执行过程。模型可以参与每一步决策，但时间、进度、授权和副作用必须由可检查的系统机制接住。</p>
        <p>有一个实现细节需要特别注意：幂等键并不能单独保证绝对不会重复扣款。它依赖下游服务正确实现幂等语义，并且需要保证同一笔业务操作在重试时始终使用同一个键。真实系统还需要考虑并发请求、键的作用域、过期策略，以及服务端成功执行但客户端未收到响应时的结果查询。</p>
        <p>同样，恢复工作流也不等于所有节点都可以安全重跑。已经完成的纯计算节点可以复用结果，需要读取最新外部状态的节点应重新执行，而购买、发送邮件和退款等有副作用的节点则必须依赖明确的业务状态与幂等机制。</p>
        <p>因此，真正适合长期运行的 Agent，应该把工作流恢复和业务操作的可靠性分开设计。前者负责知道任务走到哪里，后者负责确认每个动作到底发生了什么。两者都可靠，Agent 才能在进程退出、网络中断和外部状态变化之后继续工作。</p>
        <p>原材料：<a href="https://drive.google.com/file/d/18f4SUfj-_RqV2FXhnryOkJvzhMiUaHP-/view">原文 PDF（Google Drive）</a></p>
      </div>
    </ArticleShell>
  );
}
