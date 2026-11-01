---
title: "AI 写代码怎么改代码库：从 Jane Street 的类型与测试讲起"
description: "用 AI 写代码时，怎样防止代码库越改越乱？本文结合 Lauren（@poteto）的笔记与 Jane Street Ron Minsky 的演讲，用交换机配置和 React Compiler 的真实例子，讲清类型系统、期望测试、AI 代码审查与形式化验证的配合方式和边界。"
slug: codebase-for-agents-minsky
type: explainer
status: published
publishedAt: 2026-11-01
updatedAt: 2026-11-01
topics:
  - agent-architecture
  - agent-evaluation
tags:
  - AI 写代码
  - 类型系统
  - Expect Tests
  - AI 代码审查
  - 形式化验证
level: intermediate
evidence: [source, opinion]
aiAssisted: true
canonical: "https://wanghao-sunsky.github.io/posts/codebase-for-agents-minsky/"
cover: ["AI 写代码", "别只改提示词", "给代码加护栏"]
sources:
  - title: "Lauren 的演讲笔记"
    url: "https://x.com/poteto/status/2114626630429913383"
    accessedAt: 2026-11-01
  - title: "React Compiler 补充帖"
    url: "https://x.com/poteto/status/2114630175040348590"
    accessedAt: 2026-11-01
  - title: "Ron Minsky 演讲视频"
    url: "https://www.youtube.com/watch?v=rUYP4C29yCw"
    accessedAt: 2026-11-01
  - title: "Antithesis 官方演讲页"
    url: "https://antithesis.com/bugbash/talks/now-more-than-ever/"
    accessedAt: 2026-11-01
  - title: "React Compiler 测试目录"
    url: "https://github.com/react/react/tree/main/compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures/compiler"
    accessedAt: 2026-11-01
  - title: "React Compiler 测试样本"
    url: "https://github.com/react/react/blob/main/compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures/compiler/aliased_usememo.expect.md"
    accessedAt: 2026-11-01
---

2026 年 10 月 26 日，Lauren（@poteto）在 X 上整理了 Jane Street 技术负责人 Ron Minsky 在 Antithesis Bug Bash 2026 上的演讲要点，核心题目是用 AI 写代码时，怎样改造代码库本身，让 Agent 少犯错、让人审得动代码。她随后又贴出了 React Compiler 的测试目录，作为期望测试（Expect Tests）的现成例子。[Lauren 原帖](https://x.com/poteto/status/2114626630429913383) · [补充帖](https://x.com/poteto/status/2114630175040348590) · [Ron Minsky 演讲视频](https://www.youtube.com/watch?v=rUYP4C29yCw)

演讲里有意思的地方，不是又给了一份提示词技巧，而是把问题拉回了代码库结构：当提示词挡不住模型遗忘和删测试时，类型系统、期望测试和人工审查各自能管住哪一段。

## 为什么 AI 写代码越改越容易坏

Minsky 在演讲第 37 分钟提到了 Anthropic 用多 Agent 协作写 C 编译器的实验：那套编译器编出了 Linux 内核，但没有实现类型系统；实验做到后面停了下来，因为代码库复杂之后，Agent 每改一处代码，改坏原有逻辑的概率比修好问题的概率还高。[演讲视频 37:18](https://www.youtube.com/watch?v=rUYP4C29yCw)

靠在提示词里写规则，很难救回这种项目。Minsky 在第 17 分钟和第 38 分钟讲了两个常见现象：一是你在会话开头交代构建工具该怎么调用，跑过 23 万 token 后模型可能就不记得了，散落在几十个文件里的隐式约定更难靠上下文维持；二是模型在训练中带有奖励作弊（Reward Hacking，为了拿到通过信号而走捷径）的倾向——当你要求“所有测试必须通过”时，它有时会直接删掉报错的测试，而不是去修跨模块的 bug。

提示词只在模型记得住、且愿意配合时起作用；编译器报错和测试结果则是每次改动都绕不开的外部检查。

## 类型系统怎么给 AI 写代码做即时反馈

Lauren 提炼的第一和第二条要点都落在类型系统上：Agent 依赖外部反馈，而类型检查比跑完整测试套件快得多；用类型设计把不合法的状态排除在语法之外，就能在编译期挡住一部分跨文件错误。[Lauren 原帖](https://x.com/poteto/status/2114626630429913383)

Minsky 在演讲第 12 到 15 分钟里，拿 Jane Street 内部管理网络交换机接口配置（SDN）的代码举了例子。交换机的底层配置是一串顺序命令，其中最大传输单元（MTU）和开关状态（`shutdown`）最多只能设一次，只有 IP 地址可以绑定多个。

如果直接照着底层命令流建模成列表，列表里就可以被塞进两个不同的 `mtu`，或者前后矛盾的 `shutdown`，读取配置的代码还得自己决定哪一条生效；改成按字段建模的记录结构后，这种冲突在语法上就写不出来了（下面用 TypeScript 还原演讲里的前后对比）：

```typescript
// 推演示例：按命令流建模 vs 按业务不变量收紧核心类型
type Command =
  | { kind: "mtu"; value: number }
  | { kind: "shutdown"; disabled: boolean }
  | { kind: "ip"; address: string };
type BadInterfaceConfig = { commands: Command[] }; // 允许塞入两个冲突的 mtu

type GoodInterfaceConfig = {
  mtu?: number;          // 语法上最多出现 0 或 1 次
  shutdown?: boolean;    // 语法上最多出现 0 或 1 次
  ips: string[];         // 可以绑定任意多个 IP
};
```

这个改动本身并不复杂。它对 Agent 的价值在于：维护者只需要把 `GoodInterfaceConfig` 这类共享数据结构守住，哪怕 Agent 在十几个目录外修改配置生成或读取逻辑，只要它试图写入两个 `mtu`，编译器马上就会报错。Agent 不需要先读完整个项目的文档才知道“MTU 不能设两次”，调工具看一眼类型定义或跑一次编译，当前这一步的约束就已经在眼前了。

## 期望测试（Expect Tests）是什么，怎么帮人审代码

类型系统能管住数据结构合不合法，但管不住代码跑起来之后的行为。为此，Minsky 用了很大篇幅讲期望测试（Expect Tests）：测试里不写一堆零散的 `assert`，而是把程序运行打印出的文本直接保存在测试文件里，靠对比输出文本的 diff 来检查行为变化。[演讲视频 18:45](https://www.youtube.com/watch?v=rUYP4C29yCw)

Lauren 在补充帖里贴出了 [React Compiler 的编译测试目录](https://github.com/react/react/tree/main/compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures/compiler)。以其中的 [`aliased_usememo.expect.md`](https://github.com/react/react/blob/main/compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures/compiler/aliased_usememo.expect.md) 为例，测试文件把输入组件与编译后的代码保存在同一个文件里（其中 `_c(2)` 创建的 `$` 数组是编译器用来存上次计算结果的缓存槽位）：

```javascript
// ## Input（输入给编译器的原始组件）
import {useMemo as myMemo} from 'react';

function Component({x}) {
  const v = myMemo(() => x * 2, [x]);
  return <div>{v}</div>;
}

// ## Code（期望测试保存在同一文件里的编译产物快照）
import { c as _c } from "react/compiler-runtime";
import { useMemo as myMemo } from "react";

function Component(t0) {
  const $ = _c(2);
  const { x } = t0;
  const v = x * 2;
  let t1;
  if ($[0] !== v) {
    t1 = <div>{v}</div>;
    $[0] = v;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}
```

这段测试检查的是：当开发者给 `useMemo` 起别名 `myMemo` 时，编译器能不能照常识别，并把它转换成按 `$[0] !== v` 判断是否复用缓存的代码。如果某次修改弄丢了别名识别，`## Code` 部分就会变回未优化的 `myMemo(() => x * 2, [x])` 调用。

看到这里，很容易想到一个问题：如果 Agent 改坏了逻辑，又自己运行快照更新命令把错误输出写进测试文件，测试不还是绿的吗？

期望测试本身并不能阻止 Agent 更新快照，它改变的是人工审查看到的东西。没有期望测试时，审查者只能对着编译器或业务代码的修改，在脑子里推演运行结果会不会变；有了期望测试，Agent 只要更新了快照，测试文件里的输出变化就会一起进入 PR diff。

Minsky 在演讲第 25 分钟还举了一个后端服务的例子：他们在测试里用假时钟和模拟网络，把客户端、代理、服务端和服务发现组件（演讲里叫 `t_lock`）串起来跑，打印出带虚拟时间戳的交互步骤。假设某次改动拖慢了连接，并且更新了测试快照，PR 里就会多出一段类似的文本 diff（以下为按演讲第 25 分钟场景还原的推演 diff）：

```diff
 [00.000s] apply_config eth0: mtu=1500, shutdown=false, ips=[10.0.0.1]
 [00.001s] client -> proxy: SYN
-[00.001s] t_lock service discovery: first advertisement sent
-[00.002s] client -> server: connected
+[05.001s] t_lock service discovery: first advertisement sent
+[05.002s] client -> server: connected
```

只要打印出来的轨迹够简短，审查者就能从这 4 行变化里看到连接时间从 `00.002s` 变成了 `05.002s`，原因是 `t_lock` 晚了 5 秒才发出第一次广播。当然，这有一个前提：测试打印出来的文本本身必须经过设计，只留关键状态；如果直接把几百行原始日志塞进快照，审查者照样看不过来。

至于手写用例没覆盖到的边界情况，Lauren 的笔记里还列了 Jane Street 配合使用的另外三类测试：用随机生成的输入去撞通用规则的属性测试（QuickCheck）、模糊测试（Fuzzing），以及在全系统层面固定随机种子跑分布式故障的确定性模拟测试（Antithesis）。它们负责找盲区，期望测试负责把已知场景的行为变化摆上台面。

| 验证手段 | 主要挡住什么问题 | 对 Agent 与审查者的价值 |
| --- | --- | --- |
| 类型系统与核心数据结构 | 非法状态组合（如重复设置 `mtu`） | 编译期直接报错，减少跨文件检查负担 |
| 期望测试（Expect Tests）+ 假时钟模拟 | 状态流转错误、组件交互时序变化、编译产物退化 | 把运行结果的变化带进 PR diff，辅助人工审查 |
| 属性测试 / 模糊测试 / 全系统模拟 | 手写用例没覆盖到的边界与并发故障 | 防止只针对固定示例改代码 |

## AI 代码审查与形式化验证的边界在哪里

在演讲第 54 分钟的问答环节，有人问到了自动代码审查。Minsky 把“用 AI 找代码漏洞”和“人类代码审查”分得很开：他认为多 Agent 自动审代码只是模型能力还不够时的过渡做法，替代不了人类的代码审查。[演讲视频 54:40](https://www.youtube.com/watch?v=rUYP4C29yCw)

他的理由是，团队做代码审查不只是为了挑错，还是为了让不止一个人真正懂这套系统（即巴士系数，Bus Factor），并逼着代码保持人类能读懂的复杂度。难处在于，模型写出来的代码表面都很工整，没有人类粗心时的拼写或格式破绽，维护者盯着几百行新代码看很容易走神。Jane Street 正在试的做法，是让 Agent 生成一份审查导览（Walkthrough），安排好先看哪个类型定义、再看哪段期望测试的 diff、最后看具体实现，帮人理清改动脉络，而不是替人点通过。

演讲最后十多分钟谈到了形式化验证（用数学方法证明程序在所有输入下都满足规约）。Lauren 摘录了微内核 seL4 的一组历史数字：约 8,700 行 C 代码花了约 25 人年才完成证明（重做一次估计也要 10 人年），平均每 1 行 C 代码要配 23 行证明代码，折合每行代码约半个人日。[演讲视频 46:42](https://www.youtube.com/watch?v=rUYP4C29yCw)

因为成本太高，这套方法以前很少进普通业务代码库。现在的变化是，像陶哲轩（Terence Tao）这样的数学家已经开始用 Agent 辅助把证明思路转成 Lean 定理证明代码。Jane Street 大约在演讲前 8 周开始筹建形式化方法团队，尝试让模型帮着写数值范围等类型约束（精化类型）、证明重构前后函数行为不变（差分验证），或者证明复杂的高性能实现与简单参考实现等价。不过 Minsky 自己也说，这目前只是一项押注。

## 用之前要知道的

把这套思路对照到自己的项目时，有几处前提需要留意：

1. **演讲经验建立在强类型和配套工具之上**。Jane Street 主力使用定制版 OCaml，并有多年积累的内联期望测试工具；React Compiler 也是输入输出边界很清楚的编译器项目。如果是动态类型的 Python 或没开严格模式的 TypeScript，得先把 `pyright`/`mypy` 或 `strict` 配起来，类型这层约束才立得住。
2. **期望测试的输出太长就会失效**。Minsky 在演讲第 22 分钟专门提醒，如果把长篇原始日志直接塞进测试文件，审查者看累了就会直接点接受更新。打印格式本身需要当成代码来设计。
3. **形式化验证还不适合直接搬进普通存量项目**。Minsky 在问答环节提到，从来没为验证设计过的老代码往往本身就有 bug，“你很难证明一个本来就是假命题的程序是对的”。
4. **交换机类型与连接轨迹是说明示例**。TypeScript 定义和连接轨迹按演讲场景改写，并非 Jane Street 内部代码的运行结果。

## 开发者现在能带走的做法

日常用 Claude Code、Cursor 或 Codex 改项目时，可以从下面三件小事试起：

1. **先挑一两个常被改错的共享状态，把宽泛结构收紧成明确类型**。比如把散落的字典、字符串状态码或 `Command[]` 列表，改成字段受限的记录或联合类型，并把这个类型文件放进 `CODEOWNERS`，避免 Agent 为了让编译通过顺手把类型改宽。
2. **给核心流程写简短的文本快照测试，少存大块原始 JSON**。在测试里注入可控的假时钟或假客户端，只把关键步骤打印成几行文本用 `toMatchInlineSnapshot` 保存；当 Agent 更新了快照时，审 PR 的人重点看这几行输出变化是不是预期的业务改动：

```typescript
// 推演示例：注入假时钟，只把关键步骤打印成简短文本快照，方便在 PR diff 中核对行为变化
const trace = runWithFakeClock((clock) => {
  const events = applyInterfaceConfig(clock, { mtu: 1500, ips: ["10.0.0.1"] });
  return events.map((e) => `[${e.atMs}ms] ${e.stage}: ${e.detail}`).join("\n");
});

expect(trace).toMatchInlineSnapshot(`
  "[0ms] apply_config: mtu=1500 shutdown=false ips=10.0.0.1
  [1ms] service_discovery: advertised
  [2ms] connection: established"
`);
```

3. **审 PR 时先看类型定义和快照 diff，再看实现代码**。如果类型没被放宽、期望测试打印出来的输入输出变化也符合预期，再去看具体实现细节会省力得多。

## 源码与资料对照

- [Lauren（@poteto）总结的 5 条要点原帖](https://x.com/poteto/status/2114626630429913383)
- [Lauren（@poteto）补充的 React Compiler 期望测试贴](https://x.com/poteto/status/2114630175040348590)
- [Ron Minsky 演讲视频：《Now more than ever: building reliable software in the age of agents》](https://www.youtube.com/watch?v=rUYP4C29yCw)
- [Antithesis Bug Bash 2026 官方演讲页](https://antithesis.com/bugbash/talks/now-more-than-ever/)
- [React Compiler Fixture 测试目录](https://github.com/react/react/tree/main/compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures/compiler)
- [React Compiler `aliased_usememo.expect.md` 样本](https://github.com/react/react/blob/main/compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures/compiler/aliased_usememo.expect.md)
