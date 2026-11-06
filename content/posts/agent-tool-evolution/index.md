---
title: "Agent 工具调用演变史：从函数调用到代码编排"
description: "梳理现代大模型 Agent 工具调用从早期文本指令、函数调用、MCP 连接协议，到工具按需检索与代码编排的演进脉络，结合真实案例拆解两类上下文开销，并分析长流程失败恢复与安全重放的工程边界。"
slug: agent-tool-evolution
type: explainer
status: published
publishedAt: 2026-11-06
updatedAt: 2026-11-06
topics: [tool-calling, agent-architecture, agent-security]
tags: ["Agent 工具调用", "Function Calling", "MCP", "Code Mode", "Tool Search", "代码编排", "Agent Skills"]
level: intermediate
evidence: [source, opinion]
canonical: "https://wanghao-sunsky.github.io/posts/agent-tool-evolution/"
cover: ["工具调用", "如何演变", "从函数到代码"]
---

**Agent 工具调用**决定大模型怎么与外部数据库、API 和本地环境交互。只挂两三个简单工具时，单次调用很容易跑通；一旦接入大量外部接口、处理跨系统多步任务，开发者就会陆续遇到四个工程问题：怎么让模型稳定发出调用请求、怎么减少不同系统的接入适配工作、怎么控制工具定义和中间数据占用的上下文开销，以及长流程中断时怎么安全恢复。

回顾 2021 年末至今的现代 LLM Agent 工具使用路线，结构化函数调用和直接生成代码并不是谁淘汰谁的替代关系。两条路线几乎同期起步，分别应对调用链不同环节的痛点，并在近期的按需发现与代码编排方案中配合使用。下面顺着每次变化解决的问题，拆解调用链各层的职责与工程边界。

## 早期探索：从文本动作到函数调用，先把单次调用跑通

大语言模型本身不会直接发起网络请求或读写数据库。工具调用的基本过程一致：模型根据当前上下文生成特定格式的文本，外部宿主程序解析文本、执行操作，再把返回结果传回上下文，供模型决定下一步。早期探索的焦点在于：模型应该输出什么形式的文本来表示动作？

2021 年 12 月，OpenAI 在 [WebGPT](https://arxiv.org/abs/2112.09332) 中让 GPT-3 在文本浏览环境里输出搜索、点击和滚动指令，收集网页引用来回答问题。2022 年 10 月提出的 [ReAct](https://arxiv.org/abs/2210.03629)（发表于 ICLR 2023）将这一过程归纳为“推理（Reasoning）与动作（Acting）交替”的范式：模型先生成推理步骤，再输出动作指令，读取环境反馈后修正后续行动。2023 年 2 月的 [Toolformer](https://arxiv.org/abs/2302.04761) 则从自监督训练入手，让模型学习何时调用计算器、问答或翻译 API，以及如何把结果整合进生成文本。

几乎在同一阶段，另一条路线已经出现：让模型直接生成代码作为动作。2022 年 11 月的 [PAL（Program-aided Language Models）](https://arxiv.org/abs/2211.10435) 让模型将中间推理步骤写成程序，交由 Python 解释器计算，主要用于数学与符号推理任务。到了 2024 年 2 月，[CodeAct](https://arxiv.org/abs/2402.01030) 进一步提出用可执行 Python 代码统一表达 Agent 动作，将多轮交互的控制流写进脚本，交由解释器运行并根据执行反馈修改。

在工程应用中，为了减轻宿主程序自行解析自由文本的负担，接口层率先走向结构化。2023 年 6 月，OpenAI 推出 [Function Calling](https://openai.com/index/function-calling-and-other-api-updates/)，将函数描述与结构化参数调用作为 API 能力提供：开发者传入函数说明与参数结构，模型输出更便于程序解析的函数名和 JSON 参数，实际执行仍由应用端代码完成。

需要注意，2023 年的 Function Calling 并不等同于严格的 Schema 保证，模型输出仍可能缺漏字段或出现类型偏差；2024 年 8 月，OpenAI 又推出 [Structured Outputs](https://openai.com/index/introducing-structured-outputs-in-the-api/)（提供 `strict: true` 选项），在支持的 Schema 范围内进一步约束输出结构。即便如此，工程上仍需做好参数与业务校验，不能仅凭 JSON 可解析就认为业务操作正确。2024 年 6 月发布的评测基准 [tau-bench](https://arxiv.org/abs/2406.12045) 将用户对话、领域规则（如航空退改签、零售退货条件）和 API 操作放在同一任务中检查最终数据库状态，结果表明：即便模型单次生成的调用语法合法，在多步交互和复杂业务规则约束下，连续多次运行均保持正确状态变更的可靠性依然有限。

## MCP 解决了什么，又暴露了哪些上下文开销？

在统一连接标准出现之前，不同 AI 应用与外部数据源的对接往往各自实现。同一个代码仓库、聊天软件或数据库接口，在不同宿主应用或 Agent 框架下常需重复编写工具封装与桥接逻辑。

2024 年 11 月，Anthropic 发布了 [MCP（Model Context Protocol）](https://www.anthropic.com/news/model-context-protocol)。理解 MCP 的关键是看清它在调用链中的层级：**MCP 统一的是 AI 宿主应用与外部数据源、工具服务之间的连接协议，它负责连接层，并不取代模型输出层的 Function Calling**。

接入 MCP Server 后，宿主应用按统一协议向 Server 查询工具、发起调用并接收结果；而在宿主与模型交互时，常见做法仍是将这些 MCP 工具转换为模型 API 支持的工具定义格式传入上下文。

MCP 降低了接入外部系统的成本，也让开发者更容易在同一个 Agent 上挂载多个 MCP Server。当挂载的工具数量大幅增加，且宿主采用“会话初始全量加载工具定义、每次调用结果原样回传对话历史”的常见实现时，上下文会在两个不同环节产生明显开销：

1. **工具定义占用（输入端开销）**：若在会话启动时把所有可用工具的名称、说明和参数 Schema 一次性放入上下文，工具越多，初始提示词消耗的 Token 就越多，模型在相近工具间选错的可能性也会增加。
2. **中间数据回流（执行端开销）**：若在多步调用中把每次工具返回的原始数据完整放回对话历史（History），当任务涉及读取长文档或拉取多条记录时，哪怕后续步骤只需其中几个字段，完整的中间结果也会持续堆积在上下文中。

这两类开销分别发生在工具发现阶段和流程执行阶段，对应的优化思路也由此分开。

## 按需发现与代码编排：分别处理两类上下文成本

围绕上述两类开销，2025 年下半年至 2026 年初，部分模型厂商与基础设施团队尝试了按需发现与代码编排方案。例如 Anthropic 在 2025 年 11 月发布的 [Advanced tool use](https://www.anthropic.com/research/advanced-tool-use) 中，同时介绍了 Tool Search、Programmatic Tool Calling 和 Tool Use Examples，分别对应工具检索、组合执行和参数使用惯例。

### 用 Tool Search 与渐进披露降低定义开销

单次任务通常只用到工具库中的少数接口，没有必要在会话初始阶段加载全部工具定义。

**Tool Search（工具搜索）** 将全量预加载改为按需检索。宿主初始只向模型暴露少量核心工具和一个搜索工具；当模型遇到需要特定领域工具的步骤时，先通过搜索工具按关键词或语义检索出相关的工具定义，再加载到当前上下文中调用。

这种“渐进披露（Progressive Disclosure）”思路同样用于程序性知识的组织。2025 年 10 月 Anthropic 介绍的 [Agent Skills](https://www.anthropic.com/research/equipping-agents-for-the-real-world-with-agent-skills) 用目录组织操作说明、脚本与参考资源：初始上下文中只放各 Skill 的名称与简短描述，只有当模型判断任务需要某项技能时，才按需读取完整的 `SKILL.md` 及关联文件。这里需要区分：Skill 是供模型按需读取的程序性知识包，并非替代 MCP 或 Function Calling 的通信协议。此外，即便通过检索拿到了工具的 JSON Schema，面对包含复杂内部约定的接口时，仅靠字段类型定义仍容易传错参数，[Advanced tool use](https://www.anthropic.com/research/advanced-tool-use) 引入的 Tool Use Examples（调用示例）正是为了用具体样本补足 Schema 难以表达的参数用法。

### 用代码编排减少中间结果回流与多轮往返

在普通的 Function Calling 模式下，宿主程序当然可以预先把固定流程封装成复合工具，或在宿主侧编写逻辑裁剪返回结果；固定封装未必能覆盖任务临时需要的新组合，裁剪结果也不一定能省去跨工具的数据搬运。面对需要模型根据任务临时组合多个工具的场景，代码编排把组合逻辑动态交给模型：让模型生成一段代码，在受控沙箱中串联工具调用与数据处理。

以 Anthropic 在 2025 年 11 月的 [Code execution with MCP](https://www.anthropic.com/research/code-execution-with-mcp) 中给出的公开场景为例：“从 Google Drive 下载一份会议纪要，并将其内容写入 Salesforce 对应的销售记录中。”

在标准的逐轮工具调用流程中，虽然模型支持并行调用互不依赖的工具，但遇到后一步依赖前一步返回数据的操作，只能分轮往返：

1. 模型发起调用：`gdrive.getDocument(documentId: "abc123")`。
2. 宿主执行后，若直接将完整的会议纪要传回对话历史，上下文中就会多出一整段原始文本。
3. 模型读取纪要后，需要在下一次输出中把这段文本再次写入参数，发起第二次调用：`salesforce.updateRecord(..., data: { Notes: "完整的会议纪要内容..." })`。

假设这是一份较长的文档，相同内容不仅在上下文中进出两次，模型在重新生成长参数时还可能出现遗漏。

如果采用代码编排——例如 Anthropic 的 **Programmatic Tool Calling** 或 Cloudflare 在 2025 年 9 月提出的 [Cloudflare Code Mode](https://blog.cloudflare.com/code-mode/)（将 MCP 工具映射为 TypeScript API）——模型不再分轮输出 JSON 调用，而是编写一段代码交由沙箱执行（以下为依据官方文章简化的示意代码）：

```typescript
// 示意代码：在沙箱内直接传递数据，原始长文本不回流模型对话历史
const doc = await gdrive.getDocument({ documentId: "abc123" });
await salesforce.updateRecord({
  objectType: "SalesMeeting",
  recordId: "00Q5f000001abcXYZ",
  data: { Notes: doc.content }
});
console.log("Updated Salesforce record successfully.");
```

代码执行期间，`doc.content` 直接在沙箱内存中从 Google Drive 接口传给 Salesforce 接口，最终返回给模型上下文的只有确认信息。当任务需要“拉取多条记录 → 按条件过滤 → 汇总结果”时，循环和过滤也可以直接在沙箱脚本内完成。

需要注意，Anthropic 的 Programmatic Tool Calling 与 Cloudflare 的 Code Mode 虽然思路相近，但各自的沙箱实现、工具绑定方式与接口约定并不相同，并非同一套标准（且当前 [Cloudflare Code Mode 文档](https://developers.cloudflare.com/agents/tools/codemode/) 仍标注为实验性功能）。同时，代码编排主要把可预先表达的确定性控制流放进脚本；如果流程中途需要模型对某条返回内容做语义判断，依然需要把数据传回模型处理。

### 模型可见入口会“只剩一个工具”吗？看 Cloudflare API 的双入口设计

社区在讨论代码编排时，常将其概括为“把所有工具收敛成一个 `exec(code)` 入口”。这种说法反映了模型可见入口的收敛，但如果直接把成百上千个底层接口藏在单一的 `exec(code)` 背后，马上会遇到接口发现问题：模型如果不清楚内部 SDK 的函数名与参数结构，就写不出正确的调用代码；而如果把全部 SDK 类型声明预先塞进上下文，又会回到工具定义占用过高的问题。

Cloudflare 在 2026 年 2 月发布的 [Cloudflare API Code Mode](https://blog.cloudflare.com/code-mode-mcp/) 展示了按需发现与代码执行配合的实际做法。为了接入 Cloudflare 全量 API，官方实现并没有只留一个工具，而是向模型提供了 **`search()` 和 `execute()` 两个工具入口**：

1. 模型先调用 `search()`，编写查询代码在 OpenAPI 规范数据中按需检索当前任务涉及的接口路径、参数与类型信息。
2. 拿到所需接口的具体定义后，模型再调用 `execute()`，在隔离沙箱中编写代码完成实际的 API 调用与结果处理。

因为固定只暴露 `search()` 和 `execute()` 两个入口，入口工具定义本身的占用约为 1,000 Tokens（注：该数字仅指入口定义占用的上下文量级，不含检索返回、代码生成及整个会话的总开销）。可见，代码编排并没有消除底层的具体工具、鉴权配置和接口说明，也没有替代 MCP 连接；它是在连接层之上，用搜索入口解决接口发现，用代码执行入口解决多步组合。

将这几类方案放在调用链的不同层级对照，各自的作用范围如下：

| 机制 / 方案 | 代表节点与时间 | 作用在哪一层 | 解决的具体问题 | 尚未解决的边界 |
| --- | --- | --- | --- | --- |
| **Function Calling / Structured Outputs** | [OpenAI Function Calling (2023.06)](https://openai.com/index/function-calling-and-other-api-updates/) / [Structured Outputs (2024.08)](https://openai.com/index/introducing-structured-outputs-in-the-api/) | 模型输出协议层 | 让模型输出便于解析的函数名与 JSON 参数；`strict` 模式进一步提供 Schema 约束 | 不负责外部系统统一接入；参数合法不等于业务正确，逐轮原样回传易堆积中间结果 |
| **MCP** | [Anthropic (2024.11)](https://www.anthropic.com/news/model-context-protocol) | 宿主与外部系统连接层 | 统一宿主应用与外部数据源、工具服务的连接协议，减少重复适配工作 | 采用全量加载定义或原样回传结果的实现时，挂载大量工具会导致上下文开销上升 |
| **Tool Search / 渐进披露** | [Agent Skills (2025.10)](https://www.anthropic.com/research/equipping-agents-for-the-real-world-with-agent-skills) / [Tool Search (2025.11)](https://www.anthropic.com/research/advanced-tool-use) | 上下文工具与知识检索层 | 按需搜索加载工具定义或操作指南，降低会话初始的工具说明开销 | 仅减少定义与说明占用；工具执行后的中间数据传递与多轮往返仍需处理 |
| **Code Mode / 代码编排** | [PAL (2022.11)](https://arxiv.org/abs/2211.10435) / [CodeAct (2024.02)](https://arxiv.org/abs/2402.01030) / [Cloudflare & Anthropic (2025.09–2026.02)](https://blog.cloudflare.com/code-mode-mcp/) | 动作表达与沙箱执行层 | 在沙箱代码中动态完成循环、过滤与数据传递，减少中间结果回流和交互轮次 | 需语义判断的步骤仍要回到模型；多步脚本中途中断时的状态恢复更复杂 |

## 为什么到了长流程与代码编排，失败恢复依然棘手？

单次调用也可能在远端成功、本地却收不到响应。长流程或代码脚本进一步增加了恢复难度：一次执行可能依次包含查询记录、修改配置、发送通知和触发部署，中断后需要分清哪些步骤已完成；宿主能否逐步记录结果，取决于具体实现。如果执行到中途因网络超时、接口限流或进程崩溃而中断，宿主程序不能简单地把整个脚本从头重跑一遍——因为前面已经执行的写操作可能已经在外部系统中生效了。

2026 年 3 月发表的综述 [The Evolution of Tool Use in LLM Agents](https://arxiv.org/abs/2603.22862) 指出，当前 LLM Agent 工具使用的研究与工程重心已从单次调用扩展到长流程编排、开放环境交互与安全可靠执行。在针对长流程崩溃恢复的探索中，2026 年 10 月发布的实验性持久运行框架 [Pi Durable](https://earendil.com/posts/pi-durable/) 展示了持久化重放的约束边界。

讨论“持久化执行（Durable Execution）”或“确定性重放”时，一个常见误区是认为框架能够自动保证所有外部操作都“恰好执行一次（Exactly-once）”。如果远端写入已经成功，本地却没来得及记录结果，框架就不能仅凭本地记录判断是否需要重试。要避免重复操作，还需要外部接口的幂等能力或可核实的执行记录。

[Pi Durable 官方介绍](https://earendil.com/posts/pi-durable/)给出的实际处理机制包含两个步骤：

1. **先持久化意图，再执行调用**：在真正调用工具前，先把任务意图（Intent）保存下来。
2. **区分工具是否可安全重放**：当进程从崩溃中恢复时，如果发现某次工具调用只记录了意图、尚未记录完成结果，就无法仅凭这条记录确认远端操作是否完成。此时框架 **不会盲目重跑所有工具**，而是检查该工具是否被显式声明为“可安全重放（Safe to replay）”。

官方直接以只读查询 `search_issues` 和部署操作 `deploy` 做了对比：

- 对于 `search_issues` 这类只读工具，重复调用不会改变外部状态，可声明为安全重放，恢复时由框架自动重新调用。

- 对于 `deploy`（触发部署）这类有外部副作用的操作，中断时远端服务可能已经开始部署，只是响应尚未写回本地。如果框架自动重跑，就会造成重复部署。因此，未声明为安全重放的工具在崩溃恢复后**不会自动重跑**，而是向模型报告该次调用在执行期间中断，由模型或上层逻辑结合后续检查来决定如何处理。

可见，无论是采用传统 Function Calling 还是 Code Mode，只要长流程中包含修改外部状态的工具，沙箱和持久化框架都不能替代接口层面的容错设计。

## 用之前要知道的：选型与落地建议

结合工具调用链各层的职责与边界，在实际项目中设计 Agent 工具层时可以参考以下三条原则：

1. **工具数量不多、单次返回简短、每步依赖模型语义判断时，优先用原生 Function Calling。** 如果任务工具集规模有限，或者每一步都需要模型阅读上一步的文本内容再做语义决策，直接使用 Function Calling（配合并行调用与 Structured Outputs 的 `strict` 模式）链路最清晰；固定流程的复合动作也可以直接在宿主侧封装成普通函数。
2. **接入大规模工具集或完整 API 平台时，分别评估定义开销与数据流转开销。** 如果初始工具定义占用了过多上下文，可引入 Tool Search 或类似 Cloudflare `search()` 的检索入口按需加载说明；如果多步任务中存在大量无需模型逐字阅读的中间数据传递、循环或条件过滤，再引入代码编排（如 Programmatic Tool Calling 或 `execute()` 沙箱）将确定性数据处理留在执行环境中。同时要注意，代码沙箱仅提供运行隔离，不会自动实现最小权限控制或保证业务逻辑正确。
3. **按外部副作用与恢复需求划分工具边界，不盲目对长流程做自动重试。** 无论在宿主层还是代码沙箱内调用工具，都应明确区分只读查询与有副作用的变更操作。只读接口可配置自动重试或重放；对于修改数据、触发部署或发送外部通知等写操作，应根据业务风险配合接口幂等标识（Idempotency Key）、远端状态查询或人工确认机制，避免在网络超时或进程恢复时因直接重跑整个脚本而造成重复变更。
