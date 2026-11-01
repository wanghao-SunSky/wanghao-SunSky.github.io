# 试跑：用写作 Agent 写 memory-agent 文章

日期：2026-11-01。按 [tech-article-writer](../../../.agents/skills/tech-article-writer/SKILL.md) 的 8 个步骤跑了一遍，材料是 `wanghao-SunSky/memory-agent` 提交 `60194bf`。样稿状态是 `draft`，还没有经过作者审阅。

| 步骤 | 产出 | 状态 |
| --- | --- | --- |
| 1. 研究简报 | [brief.md](brief.md) | 完成 |
| 2. 定结构（dbs-content） | 大纲写在简报末尾 | 完成，未单独输出诊断报告 |
| 3. 写初稿（dbs-plain-writing） | [article.md](article.md) | 完成 |
| 4. 事实核查 | [fact-check.md](fact-check.md) | 22 条全部对上源码或报告；无上下文试读未做 |
| 5. AI 腔检查（dbs-ai-check） | [ai-check.md](ai-check.md) | 命中 4 处，未修改，等作者决定 |
| 6. 开头与标题（dbs-content-value） | 见下文 | 完成 |
| 7. 平台版本 | [platforms/](platforms/README.md) | 知乎、X 已写；掘金、CSDN 用正文 |
| 8. 格式检查 | 见下文 | 0 error |

## 开头诊断（dbs-content-value）

读者看到标题和第一段，会以为这篇要讲“向量库之外，长期记忆还要做什么”。做过 RAG、正打算给 Agent 加记忆的人会继续读，因为第一段直接列出了他们迟早会遇到的三个问题。没做过 Agent 的人会离开，这是预期内的，文章不是写给他们的。

最有价值的内容是“面试改期”的例子和删除后验证。例子在第二节，读者能很快看到；删除验证在后半段，只有读到那里的人才能看到。

修改方向：

- 第一段的三连问可以换成“面试改期”这个例子，用例子直接带出问题。代价是第一段变长。
- 标题可以把“删除”提前，这是同类文章里少见的部分。

候选标题：

1. Agent 长期记忆怎么设计：向量库之外的更新、历史和删除（当前）
2. 给 Agent 加长期记忆，只用向量库会出什么问题
3. Agent 记忆系统设计：事实改了、证据不够、用户要删除时怎么办

描述：Agent 长期记忆不只是把对话存进向量库。本文用一个开源 Demo 讲事实怎么更新、旧版本怎么保留、证据不足时怎么弃答，以及删除后怎么检查。

## 格式检查结果

```text
$ npx -y autocorrect-node --lint .       # AutoCorrect 2.14.0
首次运行：15 个 error，都是中英文之间缺空格、链接后多余空格
执行 --fix 后再次 lint：0 个 error

$ npx -y @lint-md/cli 'docs/**/*.md' README.md AGENTS.md '.agents/**/*.md'   # lint-md 2.5.0
0 个问题
```

lint-md 对 `templates/` 报了 11 个 error：标题末尾的占位符 `<slug>` 和故意留空的列表项。这些是模板占位，检查时排除 `templates/`。

## 试跑发现的问题

- **dbs-content 不完全适合技术文章。** 它的形式匹配表和原则偏向自媒体（短视频、小红书、“先有产品后有内容”），技术文章用得上的只有“表达效率”和“认知落差”两项。流程里保留这一步，只取这两项判断。
- **dbs-ai-check 不改写。** 这是它的设计，适合作者自己改。如果作者想让 Agent 直接改，要在第 5 步之后加一步，由作者逐条回答 skill 的追问。
- **X 每条帖子在上限以内。** X 开发者文档写明单帖上限 280，中日韩字符每个计 2，链接按 23 计（[Counting characters](https://docs.x.com/fundamentals/counting-characters)）。按这个规则估算，4 条分别约 205、202、164、198。官方推荐用 twitter-text 库精确计数，本次没用，发帖前以编辑器显示为准。
- **star 数不写进文章。** 2026-11-01 用 GitHub API 和网页查询 memory-agent，star 数都是 0，和之前说的 46 不一致，原因没有查清。文章和推文都没有引用 star 数。
- **无上下文试读没做。** 正式发布前要补。
