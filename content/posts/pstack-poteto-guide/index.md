---
title: "拆解 pstack：当 Agent 写代码速度远超人工审阅，如何用工程约束建立信任"
description: "结合 cursor/plugins/pstack 源码与 Lauren Tan（@poteto）的技术复盘，拆解信任倒金字塔、带修复提示的 Lint、类型约束、四层技能结构与分阶段落地路径，附 6 章互动图解导读。"
slug: pstack-poteto-guide
type: explainer
status: published
publishedAt: 2026-11-26
updatedAt: 2026-11-26
topics: [agent-architecture, agent-evaluation]
tags: ["pstack", "Lauren Tan", "Agent 工程", "Harness Engineering", "形式化验证"]
level: intermediate
evidence: [source, opinion]
canonical: "https://wanghao-sunsky.github.io/posts/pstack-poteto-guide/"
cover: ["pstack", "工程约束", "信任倒金字塔"]
---

高频使用编码 Agent 后，开发团队很快会撞上一道新的瓶颈：模型生成和修改代码的速度远超人工阅读 Diff 的上限。当单人每天能发起几十个 PR、团队每月合入上万个变更时，靠人眼逐行盯防低级错误已经失灵。Lauren Tan（X 账号 `@poteto`，中文社区常称“土豆姐”，React Compiler 核心成员，曾在 Meta、Netflix 与 Cursor 工作，现为 SpaceXSI Grok Bot 工程负责人）开源在 [cursor/plugins/pstack](https://github.com/cursor/plugins/tree/main/pstack) 的 **pstack** 插件，正是围绕这个问题搭建的一套 Agent 工程工作流。

> 本文配套提供了 **[6 章互动图解导读页](/guides/pstack/)**，按“宏观定位 → 中观架构 → 微观实操”组织了倒金字塔拆解、静态检查推演、四层架构图与任务沙盘，可与正文对照阅读。

要看懂这套体系，可以把她在 [AI Engineer CODE 2026 演讲《All Code Is Slop (Except Mine)》](https://ai.engineer/code/2026/talks/lauren-tan) 中提出的工程约束、开源仓库里 59 个 Skills 与 22 个 Playbooks 的调度结构，以及 4 天合入约 1,150 个 PR 完成生存游戏 [tibo.dog](https://x.com/poteto/status/2117004709198475365) 的实操细节放在一条线上：先搞清楚为什么很多常规的 Agent 管理习惯在高频开发下会失效，再看怎样把校验逻辑下沉到类型、Lint 和运行时验证里。

## pstack 为什么反直觉：先厘清三组工程取舍

初次翻看 `pstack` 的仓库与演讲实录，很容易在三组看似冲突的做法上停住。把背后的工程边界摊开，逻辑就顺了：

| 表面上的冲突 | 背后的工程取舍 |
| --- | --- |
| 一边反对往 `AGENTS.md` 追加规则，一边维护了 59 个 Markdown Skills | 每次 Agent 犯错就往说明文档里塞一条“禁止做 X”，属于缺乏机器强制力的文字叮嘱，规则变长后很容易被模型漏读。`pstack` 的 Skills 封装的是可复用的标准工程动作（如复现、原型对比、运行时验证），以及把历史文字教训转化为静态检查的工具（如 `/correct`、`/no-comments`）。 |
| 一边质疑长篇 Plan Mode，一边要求动工前先定架构 | 脱离代码的长篇纸面计划容易过度规定实现细节，同时漏掉关键的数据结构与接口边界；对着抽象文档做评审，模型还会顺着假设推导并不存在的边缘风险。她的替代方案是用 README 与使用教程倒推调用方 API，用 `/architect` 敲定类型签名草图，遇到拿不准的交互直接写 2–3 个一次性原型（Prototype）实测对比。 |
| 要求删掉 99% 的代码注释，甚至反对传统的防御性写法 | 在高频 Agent 协作中，现有代码库是下一个 Agent 权重最高的少样本输入（Few-shot Examples）。模型常写一段注释来合理化某处临时补丁，后续 Agent 检索代码时会把这种权宜之计当成项目规范复制到其他模块。注释无法在编译期报错，应当替换为清晰的命名、可运行的断言或静态检查。 |

## 信任倒金字塔：如何用类型与带修复提示的 Lint 管住 Agent

在《All Code Is Slop (Except Mine)》演讲中，Lauren Tan 用一座**信任倒金字塔**（Trust Inverted Pyramid）划分了工程师投入精力的优先级：

1. **代码库与 API 架构**（顶层，最宽，投入最多）：从模块边界和接口设计上消除错误写法的生存空间。例如在 SpaceXSI 内部桌面框架 Dune 中，团队直接在业务代码层禁用了需要精细维护依赖项的 React `useEffect`，只允许在框架底层原语内部调用；同时吸取 Cursor 时期的教训，将 Electron 顶层目录显式拆分为 `electron-main` 与 `electron-renderer`，配合依赖分析器封死跨进程导入。
2. **静态分析、类型系统、Lint、测试与形式化验证**（次宽）：把重复出现的缺陷转化为编译期或检查期的确定性红灯，并在报错文本里直接写明替代方案。
3. **散文式文字规则**（较窄）：`AGENTS.md`、Skills 与必要注释只留给机器无法判定的领域背景和主观权衡。按照 `/correct` 技能的约定，只要某条文字规则能升级为架构约束或 Lint 规则，就立刻从文档中删除对应条目，避免稀释上下文注意力。
4. **人工 Code Review**（底层，最窄）：当团队每月合入约 11,000 个 PR 时，人工逐行排查低级错误已不现实。人工审查的重心应收敛到两件事：核对产品意图是否对齐，以及查验运行录屏、测试输出和状态图等**验证产物**。

很多团队把第 2 层的“静态检查与强类型”当成常规的代码风格校验，但在 `pstack` 的工作流里，这两项工具承担着**实时纠偏上下文**的作用。下面通过两个具体代码片段看看它们在工程里怎么写。

### 示例一：把口头禁令改成“带修复提示的 Lint”

假设 Agent 在写前端业务组件时，经常顺手写 `setTimeout` 等待渲染完成，埋下偶发的时序竞态。如果在 `AGENTS.md` 里写“禁止用 `setTimeout` 凑时序”，模型在长会话里照样会写。更稳妥的做法是在 ESLint 中配置 `no-restricted-syntax`，并在 `message` 字段里直接给出替代模块路径与函数签名：

```javascript
// eslint.config.js —— 在报错文本中直接写明替代 API 与文件路径
export default [
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.name='setTimeout']",
          message:
            "禁止在业务组件中直接调用 setTimeout 等待渲染。请改用 src/runtime/scheduler.ts 中的 scheduleAfterFrame(callback)，并在卸载时调用返回的 cancel()。",
        },
      ],
    },
  },
];
```

这条规则上线前需要先在历史故障提交上跑出红灯以确认有效。此后只要 Agent 再写出 `setTimeout`，Linter 报错就会把 `src/runtime/scheduler.ts` 和 `scheduleAfterFrame` 直接推入下一轮上下文，Agent 无需人工提醒就能在同一轮内完成替换。

### 示例二：用可辨识联合类型与 Branded Type 封死非法状态

另一类高频问题是模型喜欢用多个布尔值和可选字段拼凑状态，或者把同为 `string` 的不同业务 ID 传反。通过 TypeScript 类型约束可以把这类缺陷拦截在编译期：

```typescript
// 反例：宽松的可选字段组合，编译期无法阻止 { loading: true, error: "超时", data: [...] } 同时出现
interface LooseRequestState<T> {
  loading: boolean;
  error?: string;
  data?: T;
}

// 正例 1：可辨识联合类型（Discriminated Union），让非法状态组合无法通过编译
type FetchState<T> =
  | { status: "idle" }
  | { status: "loading"; startedAt: number }
  | { status: "error"; retryable: boolean; message: string }
  | { status: "success"; data: T };

// 正例 2：Branded Type，防止同为 string 的 UserId 与 OrderId 在传参时顺序颠倒
type UserId = string & { readonly __brand: unique symbol };
type OrderId = string & { readonly __brand: unique symbol };

function cancelOrder(userId: UserId, orderId: OrderId): void {
  // 若 Agent 误写为 cancelOrder(orderId, userId)，tsc 会直接报错阻断
}
```

配合倒金字塔的日常维护动作，Lauren Tan 称之为**代码库园艺**（Codebase Gardening）：由于 Agent 天生倾向于模仿仓库里的存量代码，留下一处未经清理的临时绕过逻辑，很快就会被后续 Agent 复制到其他模块。定期清理死代码、每拔掉一处反模式就补上一条机器检查，才能维持代码库的长期可维护性。

## pstack 的四层架构：59 个 Skills 与 22 个 Playbooks 如何协同

截至 2026 年 11 月，`cursor/plugins/pstack` 主分支包含 **59 个 Skills**（35 个功能技能 + 24 条工程原则）、**22 个 Playbooks** 和 **2 个 Subagents**（`poteto-agent`、`comment-sicko`）。为了避免使用者手工记忆几十条斜杠命令，`pstack` 采用了单入口加四层职责解耦的结构：

1. **单入口路由**（`/poteto-mode`）：使用者只需交代目标、可判真假的验收条件、期望查看的验证证据和已知线索，由 `/poteto-mode` 识别任务类别并挂载对应剧本。拿不准如何组织需求时，可先调用 `/poteto-help` 生成提示词草稿。
2. **流程剧本**（22 个 Playbooks）：覆盖只读排查（`investigation`）、缺陷修复（`bug-fix`）、性能调优（`perf-issue` / `hillclimb`）、新功能开发（`feature`）、一次性原型对比（`prototype`）、PR 值守（`babysit`）与过夜自动运行（`autonomous-run` / `autopilot-full`）等场景。命中剧本后，Agent 会先把标准步骤写入 TodoList，任何跳过动作都必须注明原因。
3. **能力技能与子 Agent**（35 个功能 Skills + 2 个 Subagents）：由剧本按步骤触发。核心技能分布在四个阶段——摸底对齐（`/in-your-own-words`、`/how`、`/why`、`/teach`、`/recall`）、设计探索（`/architect`、`/arena`、`/swarm`）、编码清理（`/tdd`、`/no-comments`、`/unslop`）以及验证与沉淀（`/create-verification-skill`、`/create-formal-verification-skill`、`/statechart`、`/correct`）。委派子任务时统一经过 `poteto-agent` 外壳，确保子 Agent 启动时读取完整原则索引；`comment-sicko` 则作为只读审查子 Agent，专门清理替补丁辩解的冗余注释。
4. **工程原则**（24 条 Principles）：将“执行步骤”与“判断标准”解耦。24 条原则按核心思维、架构纪律、验证纪律、委派自治和元原则分为 5 组。当 Agent 在执行中途偏离方向时，开发者直接点名原则名称（如 `Attack the Premise` 或 `Laziness Protocol`）即可拉回方向，无需重写长篇提示词。

## 从单兵内环到自动化外环：tibo.dog 与高频 PR 的工程护栏

`pstack` 仓库 README 顶部写着一句核心准则：*"If you want to go fast, go deep first."*

Lauren Tan 在 2026 年 11 月 1 日公开的业余项目 [tibo.dog 技术复盘](https://x.com/poteto/status/2117043478140276847)（4 天合入约 1,150 个 PR）具体展示了这套“先建护栏再提速”的做法：凡是每帧执行的热路径文件统一加 `.hot.ts` 后缀，配套 Lint 禁止堆内存分配（禁对象字面量、闭包和 `new`）以消除 GC 掉帧；首包体积超过 124KB gzipped 直接令构建失败；剧情、过场演出与暂停/失焦状态机使用 TLA+ 建模，并通过 `/statechart` 生成状态图排查死锁与竞态；所有芯片音乐和像素素材全部由代码生成，配合确定性模拟实现服务端重放校验。

把单机内环（干净代码库 → 强类型与 Lint → 运行时实证与形式化验证 → 小颗粒度 PR 自证）跑通之后，团队级外环自动化才具备基础：例如在 Grok Bot 项目中，每次切新版本都会自动拉起模糊测试遍历客户端界面，发现异常后自动定位、提 PR 并跑完验证链路合入，在团队月合入约 11,000 个 PR 的吞吐下把回滚率控制在约 0.5%。反过来，如果内环缺乏有效拦截，盲目开启多路并发只会成倍放大返工成本。

同时值得关注她在 2026 年 11 月披露的[近期策略调整](https://x.com/poteto/status/2117437607940681849)：她明显减少了纯抽象的多模型对抗代码评审（`/interrogate`），认为离开运行现场对着 Diff 空谈评审往往浪费 Token 且容易引发过度设计；目前她将大约 70% 的算力投入**运行时实证**（功能地图 Feature Map + 专用 CLI 驱动真实应用）和**形式化验证**（TLA+ / Lean / 状态图可视化），并持续删减压缩 `pstack` 的技能文本篇幅。

## 用之前要知道的

- 本文基于 `cursor/plugins/pstack` 主分支源码、AI Engineer CODE 2026 演讲实录及 `@poteto` 公开技术帖整理；文中涉及的团队月合入 11,000 个 PR、约 0.5% 回滚率及 `tibo.dog` 帧率数据均引自作者公开披露，未做独立复测。
- `pstack` 原生面向 Cursor（附带 Claude Code 适配层），部分自动化能力（如 `/loop`、Cursor Automations）依赖宿主环境。普通团队无需在第一天全量引入 59 个技能，也不必在简单 CRUD 业务上强行引入 TLA+。

## 循序渐进的 3 步落地建议

1. **收紧需求交代与止损纪律**：派任务时明确目标与“可判真假的验收条件”，复杂改动动手前先让 Agent 用自然语言复述底层问题（对应 `/in-your-own-words`）；同一假设连续修改两次仍未跑通时，立即停手写脚本证伪前提（对应 `Attack the Premise`）。
2. **收敛统一验证入口与功能地图**：为项目整理出一条统一的本地验证命令，并为核心的 3–5 条用户路径编写一份功能地图（Feature Map），让不同会话中的 Agent 遵循同一套验收标准。
3. **按“同类问题出现两次”升级静态检查**：每当在 Code Review 中第二次纠正同一类 AI 错误，优先考虑收紧模块 API、补充可辨识联合类型，或编写一条带修复指引的 Lint 规则（先在历史问题代码上确认能跑出红灯），最后才考虑往文档里加文字说明。

完整互动拆解见 **[pstack 与 Lauren Tan 的 Agent 工程实践：6 章互动图解导读页](/guides/pstack/)**。

## 来源对照

- 源码仓库：[cursor/plugins/pstack](https://github.com/cursor/plugins/tree/main/pstack)（README、22 Playbooks、59 Skills、官方 Guide）
- 演讲实录：[All Code Is Slop (Except Mine) — AI Engineer CODE 2026](https://ai.engineer/code/2026/talks/lauren-tan)
- 公开复盘：`@poteto` 关于 [信任倒金字塔](https://x.com/poteto/status/2111133080526495985)、[tibo.dog 技术细节](https://x.com/poteto/status/2117043478140276847) 与 [减少对抗评审 / 转向实证与形式化验证](https://x.com/poteto/status/2117437607940681849) 的技术讨论
