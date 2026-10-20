import type { Metadata } from "next";
import ArticleShell from "@/components/ArticleShell";
import metaJson from "./meta.json";
import type { ArticleMeta } from "@/lib/types";

const meta = metaJson as ArticleMeta;
export const metadata: Metadata = {
  title: meta.title,
  description: meta.excerpt,
  openGraph: { title: meta.title, description: meta.excerpt, type: "article" },
};

export default function Page() {
  return (
    <ArticleShell
      meta={meta}
      prev={{ slug: "agent-harness-who-decides-done", title: "Agent Harness 真正设计的，是谁有资格宣布任务完成" }}
    >
      <div>
        <p>Browser Agent 真正解决的是：没有合适 API、网页结构又不稳定时，如何让程序根据当前页面决定下一步，而不是提前把每个点击和输入都写死。</p>
        <p>它最值得看的不是模型能操作浏览器，而是模型、运行框架和浏览器被拆成了三个职责明确的层。模型负责判断，Harness 负责提供上下文、调用工具、维持循环和限制运行，浏览器负责保存标签页、Cookie 与登录状态。这个分层决定了一个关键事实：Browser Agent 并没有消除自动化中的不确定性，只是把不确定性从“流程怎么写”转移到了“这次运行怎么判断”。</p>
        <p>官方给出的基本循环很直接：</p>
        <pre>观察页面 → 选择动作 → 执行动作 → 检查结果 → 再次观察</pre>
        <p>页面变化后必须重新观察。菜单展开、弹窗遮住表单、搜索结果替换旧内容，都意味着上一轮拿到的页面信息已经过期。只让模型记住先前状态，然后继续操作，很容易出现“动作是基于旧页面做出的”这种时序错误。</p>
        <figure className="article-figure">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/browser-agent-diagram.svg" alt="Browser Agent 核心机制图" />
          <figcaption>Browser Agent 核心机制：循环四步、三层分工与三种承载形态</figcaption>
        </figure>
        <p>模型读取页面主要有两条路线。DOM 或无障碍树提供元素名称、角色和状态，适合定位按钮、输入框等结构化控件；截图则让视觉模型直接理解渲染结果，适合 canvas 等缺少可用标签的界面。两者可以组合，但各有边界：截图缩放后，小控件的坐标可能不再可靠；结构化页面信息再完整，也看不到无法被页面结构表达的视觉内容。</p>
        <p>Browser Use 提供的开源 Python 库也沿用了这三层结构：<code>Agent(task=..., llm=..., browser=...)</code> 中，任务、模型和浏览器环境可以分别选择；<code>agent.run()</code> 返回执行历史，再由 <code>final_result()</code> 取得结果。仓库还提供 CLI，让 Claude Code、Codex、Cursor 等已有 coding agent 接入浏览器能力；全托管 Cloud 则同时提供 agent 和浏览器。</p>
        <p>这三种形态解决的是不同层次的问题。Python 库适合把浏览器操作嵌入已有应用，自定义工具和结构化输出；CLI 适合给已有 agent 增加浏览器工具；Cloud 适合不想维护浏览器环境与运行基础设施的应用。开源库采用 MIT 许可，Python 库本身免费，但模型推理、Cloud 浏览器以及失败后的重试仍会产生费用。仓库材料里的云端浏览器按浏览器小时计费，模型调用另算，因此“任务完成了”不等于“这次运行足够便宜”。</p>
        <p>认证也不是浏览器环境建立之后就不再存在。仓库提供了复用本地 Chrome profile 和云端 profile sync 的方式，后者只同步 Cookie，不包含 local storage、IndexedDB 和扩展。复用会话可以减少重复登录，但会话过期、一次性验证码和多因素认证仍可能要求人工介入。自动化流程必须把“等待人完成认证”当成正常状态，而不是异常。</p>
        <p>我做过一个网页自动化工具，走的是另一条路线：先录制操作，编辑成逻辑流程图，再由任务执行器回放，Chrome 插件、Electron 客户端、任务执行器和 AI 服务器分别承担接入、编辑与执行。它和 Browser Agent 解决的是同一类问题——把人的网页操作转成程序可执行流程——但决策位置不同：录制回放把路径提前固化，Browser Agent 在运行时根据页面重新选择动作。</p>
        <p>因此，固定报表下载、字段位置稳定、每次都必须走同一条路径的流程，脚本通常更合适；跨站点找资料、页面结构经常变化、事先很难列出完整步骤的任务，才值得让 agent 判断。这里真正需要验收的不是 agent 有没有返回“完成”，而是保存记录、确认页面和源数据是否一致。JSON 格式正确，只能证明结构可解析，不能证明字段值正确。</p>
        <p>不过官方科普把模型能力和产品入口放得太近了。文末的 Cloud 注册额度属于厂商推广，不是 Browser Agent 的机制。更关键的能力反而落在 Harness 周围：限制可访问页面、敏感操作审批、时间和成本上限、结果验证、失败后重试前的状态检查。仓库材料没有展示 Cloud 内部具体如何完成这些控制，因此不能仅凭产品具备 agent 能力，就推断风险已经被工程化解决。</p>
        <p>Prompt Injection 尤其说明了这一点。页面内容既可能提供完成任务所需的信息，也可能包含要求 agent 偏离目标的指令。把页面当作不可信输入、缩小账号权限、敏感动作单独审批，这些措施能降低风险，但不能代替验证。Browser Agent 输出一个看似完整的流程，不等于输出可信结果。</p>
        <p>真正实用的起点也不是直接让它申请职位或完成购买，而是选择一个只读任务，先定义允许访问的页面、返回字段和成功条件，再设置时间、步骤或成本限制。之后重复运行，对照源页面检查结果，并分别记录人工修正与失败重试。验证机制跑通之后，再扩大站点和任务范围。</p>
        <p>Browser Agent 能不能把一次已经验证成功的判断路径保存下来，下次优先复用，失败时再重新判断？如果可以，它就不必在每一步都付出模型判断的不确定性，录制回放与 agent 决策也能组合起来。现有材料还不足以回答这个问题，但它恰好决定了 Browser Agent 最终是一个更灵活的探索工具，还是能稳定进入生产工作流的执行器。</p>
      </div>
    </ArticleShell>
  );
}
