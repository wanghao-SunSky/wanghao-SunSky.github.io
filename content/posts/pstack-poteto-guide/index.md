---
title: "土豆姐与 pstack：AI 写代码快了百倍后，怎么敢信任它"
description: "结合 cursor/plugins/pstack 源码与 Lauren Tan（@poteto）演讲，讲清信任倒金字塔、代码库园艺学、四层技能架构与 3 阶段落地清单，文内附 6 章互动图解导读页。"
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
cover: ["pstack", "土豆姐的工程", "信任倒金字塔"]
---

最近在 AI 编程圈频繁刷屏的 **pstack** 和“土豆姐”，其实是同一套体系的两面：Lauren Tan（X 账号 `@poteto`，React Compiler 核心成员，曾在 Meta、Netflix 与 Cursor 工作，现为 SpaceXSI Grok Bot 工程负责人）把她日常高频使用编码 Agent 的方法论总结成演讲，并把整套工作流以插件形式开源在 [cursor/plugins/pstack](https://github.com/cursor/plugins/tree/main/pstack)。这套体系解决的痛点非常直接：当编码 Agent 写代码的速度远超人类阅读速度后，瓶颈已经从“能不能写出来”变成“怎么信任它、怎么敢放心并行”。

> 如果想边点边看、由宏观到微观逐层拆解，可以直接打开本文配套的 **[6 章互动图解导读页](/guides/pstack/)**（包含倒金字塔交互图、纠错升级推演、pstack 四层解剖、5 步任务沙盘和 3 阶段自查清单）。

网上关于土豆姐的讨论常常让人看晕，主要是把三件事混在一起讲了：她在 [AI Engineer CODE 2026 演讲《All Code Is Slop (Except Mine)》](https://ai.engineer/code/2026/talks/lauren-tan) 里讲的底层心法、开源仓库里 59 个技能与 22 个剧本的工具结构，以及她 4 天合入约 1,150 个 PR 做出游戏 [tibo.dog](https://x.com/poteto/status/2117004709198475365) 等极限案例。顺着“底层心法 → 工具结构 → 落地顺序”拆开，整套逻辑会清晰很多。

## 先解开三个看着最拧巴的“矛盾”

接触 pstack 的人，通常会被三句听起来互相打架的说法卡住：

| 表面上的矛盾 | 背后的真实逻辑 |
| --- | --- |
| 一边反对往 `AGENTS.md` 堆规则，一边自己写了 59 个 Markdown Skills | 她反对的是“AI 犯错就往文档加一条禁令”的补丁写法——文字规则跳过时不报错；pstack 的 Skills 封装的是通用工程流程，以及把文字教训转成代码检查的工具（例如 `/correct`、`/no-comments`）。 |
| 一边说“不相信 Plan Mode”，一边又极度强调前期架构 | 她反感的是脱离代码的纸面长文计划，容易让模型在抽象层编造根本不会发生的边缘风险；她改用 README / 教程倒推 API、用 `/architect` 画类型草图、用一次性原型拿实测数据定方案。 |
| 禁掉 99% 的代码注释，甚至质疑传统 Clean Code | 代码库本身就是下一个 Agent 最大的输入样本。AI 极擅长写“解释为什么这里打了补丁”的注释，后续 Agent 会把补丁当成既定规范疯狂复制。注释无法被机器强制执行，应该换成清晰的命名、测试或带修复指引的 Lint。 |

## 核心心法：信任倒金字塔与代码库园艺学

在《All Code Is Slop (Except Mine)》演讲中，Lauren Tan 用一座**信任倒金字塔**（Trust Inverted Pyramid）划分了工程师投入精力的优先级：

1. **代码库与 API 架构（最宽，投入最多）**：靠接口和模块设计让错误写法根本写不出来。例如她在内部桌面框架 Dune 中，直接在业务代码层禁用 React 的 `useEffect`，只允许框架底层使用；把 Electron 拆成 `electron-main` 与 `electron-renderer` 两个显式目录，用依赖分析器封死跨界导入。
2. **静态分析、类型、Lint、测试与验证（次宽）**：把反复出现的错误变成编译期或检查期红灯，并在报错信息里直接写明应该改用哪个文件或函数。报错本身就成了下一轮精准提示词。
3. **散文式文字规则（较窄）**：`AGENTS.md`、Skills、注释只留给机器判不了的主观取舍。按照 `/correct` 技能的纪律，一旦某条文字规则能升级为架构或 Lint 拦截，就立刻把对应的文档条目删掉。
4. **人工 Code Review（最窄）**：当团队一天合入几百个 PR 时，人类不可能逐行读完 Diff。评审重心必须收缩为两件事：确认产品意图有没有理解对，以及检查视频录屏、测试输出、状态图等**验证产物**。

配合倒金字塔的另一个概念叫**代码库园艺学（Gardening）**：在高频 Agent 开发下，代码库里的临时补丁和废弃写法就像杂草，下一个 Agent 打开仓库后会忠实模仿这些反模式。保持代码库干净、把每根拔掉的草都固化成机器检查，比反复口头叮嘱 Agent 有效得多。

## 拆解 pstack：单入口 + 四层分工

截至 2026 年 11 月，`cursor/plugins/pstack` 主分支包含 **59 个 Skills**（35 个功能技能 + 24 条原则）、**22 个 Playbooks** 和 **2 个 Subagents**（`poteto-agent`、`comment-sicko`）。数量看着唬人，但日常并不需要背命令，它靠四层结构把复杂度藏在后面：

1. **单入口路由（`/poteto-mode`）**：用户只描述目标、可判真假的验收条件和已知线索，由 `/poteto-mode` 匹配对应剧本。拿不准怎么提需求时，可以先问 `/poteto-help`。
2. **流程剧本（22 个 Playbooks）**：覆盖只读排查（`investigation`）、修 Bug（`bug-fix`）、性能调优（`perf-issue` / `hillclimb`）、新功能（`feature`）、原型对比（`prototype`）、PR 值守（`babysit`）与过夜自治（`autonomous-run` / `autopilot-full`）等场景。匹配后会把步骤原样写进 TodoList，跳过必须写明理由。
3. **能力技能（35 个功能 Skills）与 2 个子 Agent**：按步骤自动触发，高频核心集中在四段——摸底对齐（`/in-your-own-words`、`/how`、`/why`、`/teach`、`/recall`）、设计探索（`/architect`、`/arena`、`/swarm`）、编码清理（`/tdd`、`/no-comments`、`/unslop`）以及验证与进化（`/create-verification-skill`、`/create-formal-verification-skill`、`/statechart`、`/correct`）。委派子任务时统一走 `poteto-agent` 外壳，确保子 Agent 启动时读全规则不跑偏。
4. **工程原则（24 条 Principles）**：把“步骤”和“判断标准”解耦。原则按核心思维、架构纪律、验证铁律、委派自治和元原则分成 5 组，中途发现 Agent 走偏时，直接点名原则（如 `Attack the Premise` 或 `Laziness Protocol`）即可纠偏。

## 先扎深内环，再放大外环

pstack README 顶部写着一句话：*"If you want to go fast, go deep first."*

她在 2026 年 11 月 1 日公开的副业项目 [tibo.dog 技术复盘](https://x.com/poteto/status/2117043478140276847)（4 天约 1,150 个 PR）很直观地展示了这套“先建护栏再加速”的打法：每帧执行的热路径统一加 `.hot.ts` 后缀，配套 Lint 禁止堆内存分配（禁对象字面量、闭包和 `new`）以防 GC 卡顿；首包体积超过 124KB gzipped 直接构建失败；剧情、过场与暂停状态机用 TLA+ 建模并用 `/statechart` 画出状态图抓边界死角；所有音乐和像素素材全部代码生成，配合确定性模拟实现服务端重放校验。

把单兵内环（干净代码库 → 强类型与 Lint → 运行时与形式化双重验证 → 窄 PR 自证）打牢之后，外环自动化才成立：比如 Grok Bot 每次发版自动拉起项目模糊测试整个客户端，发现 Bug 直接开修并走完验证合入。相反，如果内环还在产出未经验证的代码，开 20 个并发 Agent 只会以 20 倍速堆积技术债。

另外值得注意她 2026 年 11 月的[最新观点调整](https://x.com/poteto/status/2117437607940681849)：她明确减少了纯抽象的多模型对抗评审（`/interrogate`），认为对着 Diff 空谈评审大多浪费 Token，更主张把大约 70% 的算力投入**运行时实证**（功能地图 Feature Map + 专用 CLI 驱动真应用）和**形式化验证**（TLA+ / Lean / 状态图），同时持续给 pstack 技能文本做减法。

## 用之前要知道的

- 本文基于 `cursor/plugins/pstack` 主分支源码、AI Engineer CODE 2026 演讲文字实录及 `@poteto` 公开帖子梳理；文中涉及的团队月合入 11,000 PR、0.5% 回滚率及 `tibo.dog` 帧率表现均来自作者本人公开披露，未做独立复测。
- `pstack` 原生面向 Cursor（并附带 Claude Code 适配层），部分能力（如 `/loop`、Cursor Automations）依赖宿主环境。普通团队没必要第一天全量照搬 59 个技能，更不必为了用形式化验证而强上 TLA+。

## 今天就能带走的 3 步落地法

1. **改提问习惯**：任务里把目标和“可判真假的验收条件”写清，复杂问题动工前先让 Agent 用大白话复述一遍；同一假设连修两次还失败，立刻停手证伪前提。
2. **收口验证与功能地图**：给项目收敛出一条统一验证命令，顺手给最核心的 3–5 个用户路径写一份功能地图（Feature Map），让每个 Agent 用同一套标准自证，而不是各自瞎猜。
3. **按“出现两次即建规则”做减法**：每当反复纠正 AI 犯同一类错，优先考虑改 API、加类型或写一条带修复指引的 Lint（并且先确认它能在历史坏代码上跑红），最后才轮到写文档。

完整互动版见 **[土豆姐与 pstack：6 章互动图解导读页](/guides/pstack/)**。

## 来源对照

- 源码仓库：[cursor/plugins/pstack](https://github.com/cursor/plugins/tree/main/pstack)（README、22 Playbooks、59 Skills、官方 Guide）
- 演讲实录：[All Code Is Slop (Except Mine) — AI Engineer CODE 2026](https://ai.engineer/code/2026/talks/lauren-tan)
- 公开复盘：`@poteto` 关于 [信任倒金字塔](https://x.com/poteto/status/2111133080526495985)、[tibo.dog 技术细节](https://x.com/poteto/status/2117043478140276847) 与 [减少对抗评审 / 转向实证与形式化验证](https://x.com/poteto/status/2117437607940681849) 的讨论
