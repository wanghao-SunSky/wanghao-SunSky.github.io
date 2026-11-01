# SEO 与分发规范

站点：`https://wanghao-sunsky.github.io/`。仓库：`wanghao-SunSky/wanghao-SunSky.github.io`。核查日期：2026-11-01。

## 基本目标

SEO 的目标是让搜索具体技术问题的人找到准确答案。文章质量、清楚的问题定位和稳定地址优先于关键词数量。

参考：[Google SEO 入门指南](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)、[有帮助的可靠内容](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)。

## 关键词研究

每篇文章动笔前花 15 分钟做一次，结果写进研究简报。这是写作流程的第 1 步，标题、首段和小标题都从这里的结果出发。

1. 写下读者会怎么搜，中英文各 2–3 个，例如“agent 长期记忆”“agent memory”。
2. 看联想词：在 Google 和百度搜索框输入种子词，记下下拉提示。也可以用接口批量取（Google `suggestqueries.google.com/complete/search?client=firefox&q=`，百度 `suggestion.baidu.com/su?wd=`），这两个接口没有官方文档，只作参考。
3. 看搜索结果第一页：排在前面的是教程、源码还是新闻，已有答案缺什么。我们要补的就是缺的那块。
4. 选一个主关键词放进标题和描述，2–3 个相关词自然出现在小标题里。
5. 标出每个词的搜索意图（是什么 / 原理 / 怎么用 / 对比），文章的小标题至少覆盖主要的两种。
6. 查同名干扰。例如百度上“superagent”会联想到别家产品，主关键词就要写成“DeepSeek SuperAgent”。
7. 新词可能还没有联想词。这时用它所属的、已有联想词的大词兜底，例如新项目名搭配“DeepSeek Harness”“AI 编程 Agent”。

2026-11-01 取到的联想词（Google 和百度），可作为首批选题方向：

| 方向 | 联想词 |
| --- | --- |
| Agent 记忆 | agent 记忆系统设计、ai agent 长期记忆、agent 记忆系统 github、hermes agent 记忆系统 |
| Harness | harness engineering 是什么、harness engineering 中文、教程、实践 |
| 多 Agent | 多 agent 架构、多 agent 架构图 |
| 评测 | agent 评测体系、agent 评测框架搭建、agent 评测指标 |
| 工具与工作流 | claude code 工作流搭建、mcp 工具调用、mcp 怎么调用 |

联想词只说明有人在搜，不代表搜索量大小。

## 每篇文章

- 一个主问题，对应一个主要搜索意图。
- 标题：主关键词靠前，写清问题或结论，不夸大，中文 30 字以内。例：“Agent 长期记忆怎么设计：用一个开源 Demo 讲写入、检索和遗忘”。
- 描述：1–2 句，80–120 字，说明读者会得到什么，包含主关键词。
- 地址使用英文短 `slug`，发布后不改。
- H1 与标题一致；小标题按读者问题组织，例如“记忆为什么会过期”。
- 首段前 100 字回答“它是什么、能干什么”，并出现主关键词。
- 至少链接 2 篇相关文章或主题页。
- 图片有有意义的替代文本。
- 有发布日期、更新时间、作者和来源，并输出 `Article` 结构化数据。
- 有规范地址，并加入 sitemap 和 RSS。

标题和描述的字数是经验值，搜索引擎没有公布固定上限。

## 站点级

- 首页说明作者、主题和推荐入口。
- 每个主题页有原创导读和阅读顺序。
- 关于页说明作者背景、写作范围和 GitHub 链接。
- 自动生成 `sitemap-index.xml`、RSS 和 `robots.txt`。Astro sitemap 插件构建时输出 `sitemap-index.xml` 和 `sitemap-0.xml`（[Astro sitemap 文档](https://docs.astro.build/en/guides/integrations-guide/sitemap/)）。
- 首次上线后抽查首页、一个主题页和一篇文章的抓取状态。

提交 sitemap 和请求编入索引只帮助搜索引擎发现地址，不保证收录或排名。

## 搜索引擎接入

### Google Search Console

1. 添加“网址前缀”资源 `https://wanghao-sunsky.github.io/`。`github.io` 的 DNS 不归我们管，不能做域名资源验证，改用 HTML 标签验证：把 `google-site-verification` meta 放进站点 `<head>`。
2. 提交 `https://wanghao-sunsky.github.io/sitemap-index.xml`。
3. 新文章上线后用“网址检查”确认可以编入索引。

### Bing Webmaster Tools 与 IndexNow

Bing Webmaster Tools 可以直接从已验证的 Search Console 导入站点，之后还会自动同步 Search Console 里新增的 sitemap（[Bing 添加和验证站点](https://www.bing.com/webmasters/help/add-and-verify-site-12184f8b)）。

IndexNow 用来在文章发布或更新时主动通知 Bing 等搜索引擎。（状态：未实现，网站上线并通过 Bing 验证后再接。）按 [Bing IndexNow 入门页](https://www.bing.com/indexnow/getstarted) 的四步做：

1. 生成 key：8–128 位，只能用字母、数字和连字符（[IndexNow 文档](https://www.indexnow.org/documentation)）。
2. 托管 key：把内容就是 key 的 UTF-8 文本文件 `<key>.txt` 放到站点根目录，也就是 Astro 的 `public/`。
3. 提交 URL：部署成功后，CI 把新增或更新的地址 POST 给 IndexNow，单次最多 10,000 条。返回 200 只表示收到，不表示收录。
4. 在 Bing Webmaster Tools 里确认 URL 已收到。

IndexNow 的 key 会作为公开文件挂在网站上，不算密钥。

### 百度搜索资源平台

状态：百度验证和 API 推送都未实现。验证 meta 已预留，读仓库变量 `BAIDU_SITE_VERIFICATION`。

按 [百度平台工具手册](https://ziyuan.baidu.com/college/courseinfo?id=267&page=1)：

- 验证：文件验证（验证文件放根目录）或 HTML 标签验证（放首页 `<head>`），验证通过后要一直保留。
- 提交：API 推送最快；sitemap 由百度周期性抓取，速度慢于 API 推送；也可以手动提交。API 推送的 token 是私密值，只放在 CI Secret 里。

**未核实**：百度能否正常抓取和收录 `github.io` 上的页面。上线后先提交 3 个地址，2–4 周后在平台看索引量。如果一直不收录，百度流量就靠 CSDN、知乎、掘金上的平台版本，到时再考虑自有域名加国内托管。

## GitHub 仓库

仓库本身也是搜索入口。GitHub 仓库搜索可以按名称、描述、Topics 和 README 匹配（[GitHub 仓库搜索说明](https://docs.github.com/en/search-github/searching-on-github/searching-for-repositories)）。

- 仓库名：`wanghao-SunSky.github.io`。
- About：中文主题加英文关键词，例如“中文 AI Agent 工程笔记：长期记忆、工具调用、评测与 Harness Engineering。Chinese AI Agent engineering notes.”Website 字段填站点地址。
- Topics：只能用小写字母、数字和连字符，单个不超过 50 字符，最多 20 个（[GitHub Topics 说明](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics)）。初始：`ai-agents`、`llm`、`agent-memory`、`rag`、`tool-calling`、`mcp`、`agent-evaluation`、`harness-engineering`、`claude-code`、`chinese`、`blog`、`astro`。每季度按关键词研究结果增删。
- README 首屏：一句话定位、网站链接、精选文章、主题入口、示例代码入口。
- 每篇示例代码的 README 链接回文章。
- 已有项目仓库（cs329z-chinese、memory-agent）的 README 加一行站点链接，文章也链接回这些仓库，互相导流。

## 平台版本与重复内容

Google 的规范化排障页说明，转载页往往和原文差异较大，不建议依赖 canonical 处理合作方转载；更有效的是让对方给转载页设 noindex（[Google 规范化排查](https://developers.google.com/search/docs/crawling-indexing/canonicalization-troubleshooting)）。

中文平台通常不给作者设置这类索引规则，因此：

- 掘金、知乎、CSDN 发和网站相同的正文，只换标题和文末链接。每篇多写三四个改写版，成本高，读者也看不出区别。
- 代价：平台页面可能比网站排名更高，在百度上平台版本还可能是主要流量来源。读者无论从哪进来都读到同一篇文章，署名和链接也都指回网站和 GitHub，对传播和面试影响不大，接受这个代价。
- 减少代价的做法：网站先上线 1–2 天并请求编入索引；平台文末写“首发于”并链接网站；网站页面保留更新记录和示例代码，平台版本不再同步小改动。
- 例外：某篇文章特别看重网站自己的排名时，平台只发前半篇加链接。默认不这样做。

各平台的外链和原创规则见 [platforms.md](platforms.md)。

## 推荐号和周刊

推荐号（例如 GitHubDaily）、项目周刊（例如 HelloGitHub、阮一峰《科技爱好者周刊》）和 V2EX“分享创造”节点推荐的是项目和成套资料，不推单篇文章。CS329Z 被 GitHubDaily 发帖前累计 8 个 star，发帖后增长最快；后续来源里 t.co 118 次访问、V2EX 27 次、Google 3 次（CS329Z 发布复盘，私有记录）。这是时间上的相关，不能逐颗确认来源。

只在下面几种情况投，大约每 1–3 个月一次：

- 开源了一个能运行的项目或示例仓库，例如 memory-agent。
- 一个系列写完 3 篇以上，可以作为一组推荐。
- 像 CS329Z 这样的整套教程或资料。

投稿时准备：一句话介绍、100–200 字简介、两张截图（一张整体、一张具体内容）、一个代表章节或文章链接、仓库链接。普通单篇文章只走网站、掘金、知乎、CSDN 和 X。

每次投稿都由作者手动提交，按渠道当时的投稿要求写，被不被选中不由我们决定。

## 分发记录

每次分发记录：

```yaml
slug: agent-memory-is-not-vector-db
site_url: https://wanghao-sunsky.github.io/posts/agent-memory-is-not-vector-db/
platform: juejin
version: adapted
published_at: 2026-11-16T20:00:00+08:00
post_url: ""
utm: "utm_source=juejin&utm_medium=community&utm_campaign=agent-memory"
metrics_checked_at: ""
notes: ""
```

UTM 参数只是标签。只有网站统计已经接入并测试成功时，才能用于区分来源。
