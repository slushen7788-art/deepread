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
      prev={{ slug: "memcurrent-persistent-memory", title: "MemCurrent 真正解决的不是“记不住”，而是生产级 Agent 记忆该由谁写、何时写、怎么读" }}
    >
      <div>
        <p>Agents CLI 真正解决的不是“LangChain 用户也想用 Google 的部署和评测”，而是 Agent 开发工具链里一个更基础的结构性问题：框架越来越多样，但部署、评测、可观测和企业治理仍然需要一套统一入口。过去想让 ADK 之外的项目接入，通常只有三条路——分叉 CLI、在外面包一层脚本，或者整套重建。扩展系统把这三个选项替换成了一个更工程化的机制：允许组织直接覆盖命令、增加命令、规定命令的来源，同时保留版本锁定、冲突提示和可审计的安装记录。</p>
        <p>这也是这篇官方教程最值得看的地方。它没有把 LangChain 当作一个需要额外适配的特殊对象，而是把它变成扩展系统的一个实例；真正的主线是“统一命令面不再等于统一运行时”。</p>
        <p>Google 的 Agents CLI 最初围绕 ADK 设计，默认路径是：创建一个 ADK Agent，编写 Agent 逻辑，然后部署到 Cloud Run，并接入可观测和评测。文章提到，从想法到生产环境约三十分钟即可完成，但这属于 Google 自己的产品口径，不能当成普遍适用的开发速度承诺。</p>
        <p>问题在于，ADK 之外的 Agent 框架也越来越多。LangChain、LangGraph、Deep Agents，以及企业内部针对业务定制的框架，都有自己的状态管理、运行方式和评测对象。框架选择可以因项目而异，但部署、基础设施、CI/CD、评测、发布和登录这些生命周期能力，并不会因为项目使用不同框架就消失。</p>
        <p>如果 CLI 对 ADK 做了强假设，问题就不只是“不能运行 LangChain”，而是所有生命周期能力都跟着被绑住。早期文档中列出的框架耦合命令包括 <code>playground</code>、<code>run</code> 以及若干 <code>eval</code> 子命令，而部署、基础设施、发布、登录等命令相对独立。原文前段把后者概括为大约十八条，但后文实走的 <code>agents-cli info</code> 清单显示，LangChain 扩展实际覆盖的是六个命令：<code>eval.dataset</code>、<code>eval.generate</code>、<code>eval.optimize</code>、<code>playground</code>、<code>publish.gemini-enterprise</code> 和 <code>run</code>。也就是说，文章中“四个 eval 子命令”的说法与实走清单对不上，评测相关覆盖实际是三个，另一个是发布命令；本文以下以实走清单为准。</p>
        <figure className="article-figure">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/agentscli-diagram.svg" alt="Agents CLI 扩展系统架构图" />
          <figcaption>核心机制：扩展清单替换 6 条框架耦合命令，其余生命周期命令与契约层原样复用</figcaption>
        </figure>
        <p>扩展系统的基本形态很简单：任意 Git 仓库中的一个目录，目录里放一个 <code>agents-cli-extension.yaml</code> 清单。清单声明两件事。</p>
        <p>第一是 <code>override</code>，也就是覆盖内置命令。比如把 <code>playground</code> 从 ADK 的本地调试界面换成 LangGraph Studio，或者把 <code>deploy</code> 改成先执行 SBOM 扫描再部署。覆盖后的命令会接收用户参数，参数会原样传给扩展脚本，因此用户仍然用原来的 <code>agents-cli deploy</code> 调用，不需要记一套新命令。</p>
        <p>第二是 <code>add</code>，用于增加 CLI 原本没有的命令。例如增加一个只生成 SBOM 报告、但不部署的 <code>sbom-report</code>。覆盖和新增可以放在同一个扩展里。实际使用时，一个仓库可以通过 <code>#</code> 片段承载多个扩展，例如：</p>
        <pre>agents-cli extension add acme/platform-extensions#soc2-deploy</pre>
        <p>这和 Gemini CLI 的扩展思路类似：分发依靠 Git，而不是另建一个包注册中心。版本管理、权限控制、代码审查和发布节奏，继续使用团队已经熟悉的 Git 流程。企业平台团队可以维护一个内部的 <code>platform-extensions</code> 仓库，把部署合规、SSO 登录、模型风险流程等规则作为代码分发给所有项目。</p>
        <p>扩展有两种作用域。</p>
        <p>项目级是默认作用域。扩展清单、锁文件和 vendored 副本跟随项目仓库提交，队友检出项目后，CI 也能得到同样的命令行为。用户级则通过 <code>--global</code> 安装到主目录配置中，对这台机器上的所有项目生效，适合那些必须在项目创建前就存在的扩展，例如负责配置 <code>agents-cli create</code> 的框架初始化扩展。</p>
        <p>当项目级和用户级提供同一个命令时，项目级优先。系统不会偷偷合并两个扩展，也不会静默覆盖；冲突会在安装时或 <code>extension list</code> 中暴露。这个设计看似保守，实际上很重要，因为 CLI 扩展本质上是在改变命令执行路径，静默合并会让开发者误以为自己运行的是默认实现。</p>
        <p>扩展系统的第二个关键机制是锁文件纪律。</p>
        <p>安装扩展时，Git 引用会被解析成一个确定的 commit SHA，并写入锁文件。<code>agents-cli install</code> 只负责按照这个 SHA 恢复 vendored 工作副本，不会自动推进版本。这样做的目的和 <code>uv sync</code>、<code>npm install</code> 类似：同一个项目 commit，在本地和 CI 中应该恢复同一份扩展代码，而不是因为上游分支发生了变化，部署内容也跟着变化。</p>
        <p>版本推进必须显式执行 <code>agents-cli extension update</code>，而且会重新触发第三方信任确认。对于企业内部扩展，这比单纯“拉取最新代码”重要得多。扩展可以改变部署行为、拦截命令、注入企业政策，如果它的版本能够随构建自动漂移，那么代码审查和变更审批就失去意义。</p>
        <p>Google 还在工具输出上做了三层透明化处理。</p>
        <p>每次运行会打印被覆盖的命令及来源；帮助信息中，被覆盖的命令会带上类似 <code>[↑ langchain]</code> 或 <code>[↑ sbom-deploy]</code> 的标记；<code>agents-cli info</code> 则进一步列出每个扩展实际执行的命令向量。</p>
        <p>这三层设计并不是给人类用户看的装饰。Agents CLI 的 README 将它定位为“CLI 加 skills”，让编码助手在 Google Cloud 上完成 Agent 的构建、评测和部署。命令帮助、覆盖标记和错误说明，实际上构成了给机器读取的界面。一个编码助手如果不知道某个命令已经被扩展，就可能误以为输出异常；如果扩展没有明确拒绝不支持的操作，助手还可能反复重试同一条命令。</p>
        <p>LangChain 扩展很好地展示了这种思路。它不是一个只负责“把 LangChain 接进来”的适配器，而是一套项目模板。执行：</p>
        <pre>agents-cli create my-agent \
  --agent google/agents-cli/extensions/langchain/template@v1.8.0 \
  -d cloud_run</pre>
        <p>之后，生成的项目根目录自带 <code>agents-cli-extension.yaml</code>，项目本身就是扩展的安装结果。后续执行任何命令时，它会作为项目级扩展自动加载。</p>
        <p>这个模板同时服务于 LangChain、LangGraph 和 Deep Agents。现代 LangChain 1.0 及以后由 LangGraph 提供状态管理层，Agent 最终都编译成 <code>CompiledStateGraph</code>。因此，扩展机制并不需要分别实现三套运行适配器，只要围绕共同的图表示生成项目即可。</p>
        <p>生成项目不带 <code>google-adk</code> 依赖。它仍然保留 <code>app/</code>、<code>tests/</code>、<code>deployment/</code>、Terraform 模块、项目清单和 Dockerfile 等 ADK 项目中的通用骨架。不同之处主要有两个：根目录的扩展清单负责覆盖框架相关命令，<code>langgraph.json</code> 负责配置 LangGraph 的本地开发服务。</p>
        <p>这也解释了部署为什么不需要重写。</p>
        <p><code>deploy</code> 没有被 LangChain 扩展覆盖，仍然调用 <code>gcloud run deploy --source .</code>，Dockerfile 启动的也是同一类 FastAPI 应用：</p>
        <pre>CMD ["uv", "run", "uvicorn", "app.fast_api_app:app", "--host", "0.0.0.0", "--port", "8080"]</pre>
        <p>部署层识别的是 FastAPI 和 A2A 契约，并不关心应用内部是 ADK、LangGraph 还是别的 Agent 框架。框架无关性真正成立的位置不是 CLI 表面，而是服务契约层。只要 Agent 能以 FastAPI 应用暴露出来，Cloud Run 就不需要知道内部运行框架。</p>
        <p>评测链路采用了另一种组合方式。</p>
        <p><code>eval generate</code> 被 LangChain 扩展替换成能够驱动 LangGraph 图的实现，但它仍然输出标准的 <code>EvaluationDataset</code> 格式。后面的 <code>eval grade</code>、<code>eval compare</code> 和 <code>eval analyze</code> 继续使用原生命令，因为评测服务和评分规则消费的是统一数据结构，而不是某个框架特有的 Agent 对象。</p>
        <p>这里有两个命令被明确拒绝：<code>eval.dataset</code> 和 <code>eval.optimize</code>。它们依赖 ADK Agent 对象进行内省，在 LangChain 项目中没有对应对象。扩展没有伪造结果，也没有悄悄跳过，而是返回明确说明。</p>
        <p>这是整个设计里很值得借鉴的一点。能力开放不等于所有命令都必须“假装可用”。对于人和编码助手来说，可预测的失败比不稳定的结果更有价值。一个清楚说“当前扩展不支持这个操作”的系统，至少能够阻止调用方继续沿着错误路径重试。</p>
        <p>自定义部署策略则展示了扩展机制的第二种用途。清单可以覆盖 <code>deploy</code>，先执行 <code>syft</code> 生成 SBOM，再执行 <code>grype</code> 扫描；发现严重漏洞就停止，扫描通过后调用原生部署。</p>
        <p>清单中的 <code>run</code> 不是一段 Shell 字符串，而是命令向量：</p>
        <pre>commands:
  override:
    deploy:
      run: ["bash", "scripts/sbom_then_deploy.sh"]</pre>
        <p>因此，多个动作的串联要写在包装脚本里。脚本最后再次执行：</p>
        <pre>exec agents-cli deploy "$@"</pre>
        <p>这不会导致扩展无限递归，因为加载器在执行覆盖脚本时会设置：</p>
        <pre>AGENTS_CLI_DISABLE_OVERRIDES=1</pre>
        <p>递归调用因此会落到原生命令上。这个环境变量把“扩展覆盖层”和“原生实现”明确分开，避免包装器把自己再次套进去。</p>
        <p>清单本身采用严格校验，顶层只允许五个键，拼错字段不会静默失效，而会在安装时给出类似“是否想输入 <code>requires</code>”的提示。覆盖粒度也有边界：可以覆盖 <code>eval.generate</code> 这样的具体子命令，但不能覆盖整个 <code>eval</code> 命令组。这让平台团队能够精确修改行为，而不是接管一大片命令空间。</p>
        <p>这套系统的取舍也很清楚。</p>
        <p>它放弃了“每个框架由官方维护一套完整 CLI”的简单性，换来了框架和组织政策都能自行接入的开放性。它不再要求使用者 fork 工具，但要求使用者接受一个更复杂的命令解析层：命令可能被覆盖，扩展可能有不同作用域，版本需要显式推进，框架不支持的命令也可能被拒绝。</p>
        <p>更关键的是，它的开放范围仍然有边界。</p>
        <p>“任何框架”基本成立：只要框架能编译成统一的图，或者能通过模板适配成统一服务契约，就可以进入生命周期。“任何云”则不成立。部署目标仍然是 Cloud Run、GKE 或 Agent Runtime，评测和可观测仍依赖 Google 的服务，示例使用的是 Vertex AI 上的 Gemini。扩展系统打开的是框架边界，不是云平台边界。</p>
        <p>因此，这个系统最适合两类人。</p>
        <p>一类是需要在 ADK、LangChain、LangGraph 或内部框架之间切换的 Agent 开发团队。另一类是负责企业内部工具链的平台团队。后者可以把合规扫描、SSO 门禁、模型风险管理等要求编码进扩展，让规则随项目仓库进入 CI，而不是依赖开发人员记住某条内部操作规范。</p>
        <p>它不适合把“完全脱离 Google Cloud”也当作目标的人。扩展可以改变命令实现，却不会自动把部署、评测、日志和权限体系搬到其他云上。</p>
        <p>值得继续追问的问题是：扩展包能否安全地执行任意 Shell 命令？如果一个企业允许开发团队从任意 Git 仓库安装扩展，信任边界是否会从“项目依赖”扩大到“团队成员的 Git 访问权限”？这个问题不能只靠覆盖标记和锁文件解决。锁文件保证版本不漂移，透明输出保证行为可见，但它们都不能证明脚本本身安全。</p>
        <p>Google 目前的答案是把扩展系统标记为 experimental，v1.8.0 仍使用 <code>v1alpha1</code> 清单 schema，官方也承认定型前可能发生破坏性变更，并建议依赖方固定 CLI 版本。这个边界必须保留。扩展系统已经具备包管理器式工具链的形状，但还不是成熟的包管理器生态。</p>
        <p>真正有价值的结论因此不在“Agents CLI 支持 LangChain”，而在下面这个更具体的判断：</p>
        <blockquote>当 Agent 工具链开始拥有多个运行时、多个云目标和企业治理规则时，真正需要开放的不是代码里的某个适配器，而是命令面本身。把命令覆盖、显式拒绝、版本锁定和来源提示一起设计好，才可能让“可扩展”不至于变成“不可控”。</blockquote>
      </div>
    </ArticleShell>
  );
}
