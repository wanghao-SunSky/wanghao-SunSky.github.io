# 研究简报：agent-memory-is-not-vector-db

试跑日期：2026-11-01。材料：`wanghao-SunSky/memory-agent` 提交 `60194bf`（2026-10-29）。

## 选题

- 读者：做过 RAG、准备给 Agent 加长期记忆的后端或 AI 应用工程师。
- 读者问题：把对话存进向量库，Agent 就有长期记忆了吗？还缺什么？
- 一句话结论：向量库只解决“找相似内容”；长期记忆还要处理事实更新、旧版本、证据不足时不答和删除，这几件事要靠数据结构和确定性检查，不能全交给模型。
- 文章类型：case-study。
- 主题：agent-memory。
- 主关键词：agent 长期记忆。相关词：agent 记忆系统设计、agent 记忆系统 github。

## 选题评分

| 维度 | 分数 | 理由 |
| --- | ---: | --- |
| 读者需求 | 2 | Google 和百度联想词里都有“agent 记忆系统设计”“ai agent 长期记忆” |
| 新增价值 | 2 | 有可运行的开源代码、测试和固定样例评测 |
| 证据可得 | 2 | 源码、提示词、评测报告都在仓库里 |
| 主线相关 | 2 | Agent 工程主线 |
| 面试价值 | 2 | 能讲清取舍和边界 |

## 资料

| 类型 | 来源 | 用来证明什么 |
| --- | --- | --- |
| 代码 | `src/memory_agent/engine.py`、`schemas.py`、`prompts.py` | 三种更新操作、版本链、乐观锁 |
| 代码 | `src/memory_agent/recall.py` | 有效时间查询、引用检查、弃答 |
| 代码 | `src/memory_agent/deletion.py` | 删除范围和删除后的残留检查 |
| 代码 | `src/memory_agent/investigation.py` | Agent 调查的预算上限 |
| 实验 | `reports/evaluation-demo.json`、`reports/evaluation-live.json`、`evals/cases.json` | 8 个合成样例的结果 |

## 事实、推断和未知

- 已核实事实：见 [fact-check.md](fact-check.md)。
- 作者推断：这套设计适合单用户、单机演示规模；更大规模需要重新设计写入路径。
- 仍未知：真实用户对话上的准确率；并发和数据量上去以后的表现；模型提供商一侧的日志删除。

## 大纲

1. 结论：向量库只是长期记忆的一部分。
2. 场景：面试从 11 月 10 日改到 11 月 12 日。
3. 机制一：写入时判断新增、确认还是替换（ADD / NOOP / INVALIDATE）。
4. 机制二：旧版本不删，用有效时间查历史。
5. 机制三：回答必须引用本次检索到的记忆，否则弃答。
6. 机制四：删除整条版本链，然后检查还能不能搜到。
7. 证据：8 个样例的评测，和它不能说明什么。
8. 边界。
