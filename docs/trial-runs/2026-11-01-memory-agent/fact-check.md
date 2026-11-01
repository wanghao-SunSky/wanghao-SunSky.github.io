# 事实核查：agent-memory-is-not-vector-db

核查日期：2026-11-01。对象：`memory-agent` 提交 `60194bf`。路径相对于该仓库根目录。

| 正文说法 | 出处 | 结果 |
| --- | --- | --- |
| 抽取主体、属性、值、完整事实 | `src/memory_agent/prompts.py` 第 11 行（`EXTRACT_SYSTEM` 规则 2） | 一致 |
| 相对时间按参考日历换算，换算不了保留原文不猜 | `prompts.py` 第 14 行（规则 4） | 一致 |
| 只有三种操作 ADD、NOOP、INVALIDATE | `src/memory_agent/schemas.py` 第 27 行 | 一致 |
| “只有同一主体、同一属性才算矛盾；不确定时选 ADD” | `prompts.py` 第 27 行 | 原文引用 |
| 修改前比较版本号，被改过就回滚重试 | `src/memory_agent/engine.py` 第 201–204 行 | 一致 |
| 旧事实标为 superseded 并写结束时间，新版本同一条链 | `engine.py` 第 216–225 行 | 一致 |
| 作废时记录作废时间（expired_at） | `engine.py` 第 219 行 | 一致 |
| as_of 按事件有效时间查，不能还原系统当时的认知 | `src/memory_agent/recall.py` 第 50–52 行；README“边界”一节 | 一致 |
| 抽取时记录事实从哪天开始成立，没说时用本轮时间 | `schemas.py` 第 17 行；`engine.py` 第 184–187 行 | 一致 |
| 回答时模型能看到已作废的旧版本 | `recall.py` 第 103、131–133 行 | 一致 |
| 引用编号不在本次检索结果里就丢掉，丢完为空则弃答 | `recall.py` 第 34–39 行 | 一致 |
| 引用检查不能证明每句话都被支持 | `recall.py` 第 35 行注释；README“边界” | 一致 |
| Agent 工具：查记忆、查旧版本、查来源 | `src/memory_agent/investigation.py` 第 106、119、129 行 | 一致 |
| 最多 6 次请求、8 次工具调用、16,000 token，45 秒取消 | `investigation.py` 第 24–27 行 | 一致 |
| 删除所有版本和检索键，来源正文清空、保留哈希，取消排队的抽取任务，审计日志清掉正文 | `src/memory_agent/deletion.py` 第 40–62 行 | 一致 |
| 删除后检查残留行、关键词、向量近邻、正常检索路径，命中必须为 0 | `deletion.py` 第 84–120 行，第 75 行 | 一致 |
| 同一对话的其他事实保留并列出 | `deletion.py` 第 55–58 行；`ui.py` 第 44 行 | 一致 |
| 8 个合成样例覆盖的场景 | `evals/cases.json` E01–E08 | 一致 |
| 规则模式 8/8、8/8 | `reports/evaluation-demo.json`，run_at 2026-10-29 | 一致 |
| DeepSeek 8/8、8/8；查询中位数 391.85 ms 和 3230.4 ms | `reports/evaluation-live.json`，run_at 2026-10-29，model deepseek-chat | 一致，正文写“约 0.39 秒”“约 3.2 秒” |
| 写入在事务内调用模型，未做生产负载验证；删除不覆盖备份和提供商日志 | README“边界” | 一致 |
| 没有提示词注入评测 | 在 `tests/`、`src/` 中搜索 inject、注入，只命中测试模型注入（`llm.py` 第 1 行），没有相关评测 | 一致 |

未核实：无。

## 无上下文试读

本次试跑没有做。流程里要求开一个没有上下文的 Agent 只读正文、列出读不懂的地方，留到正式发布前做。

## 格式检查

见 [README.md](README.md) 的“格式检查结果”。
