# SunSky 的 AI Agent 工程笔记

中文 AI Agent 工程博客。我读 Agent 源码、做实验和做项目时，把判断写成文章，每篇都写明证据来自哪里：读了哪个提交的源码、跑没跑过、哪些是我的观点。

在线阅读：**[wanghao-sunsky.github.io](https://wanghao-sunsky.github.io/)** · [RSS](https://wanghao-sunsky.github.io/rss.xml) · 作者 [SunSky](https://github.com/wanghao-SunSky)（[X @sunsky1125](https://x.com/sunsky1125)）

Chinese notes on AI Agent engineering: agent architecture, tool calling, agent memory, evaluation and security. Source-code walkthroughs of coding agents, experiments and project notes, starting with DeepSeek SuperAgent.

## 写什么

| 主题 | 内容 |
| --- | --- |
| Agent 架构 | Agent 循环、规划、执行与状态，编码 Agent 源码解读 |
| 工具调用 | 工具权限、预算、失败处理，MCP 和 function calling |
| Agent 记忆 | 长期记忆怎么写入、检索、更新和遗忘，和 RAG 的区别 |
| 评测 | 评测设计、回归测试、可靠性，Harness Engineering |
| Agent 安全 | 提示词注入、权限边界、谁的话算命令 |

文章列表见[网站首页](https://wanghao-sunsky.github.io/)。发现事实错误欢迎提 Issue，更正会写在文章末尾。

## 仓库结构

| 路径 | 用途 |
| --- | --- |
| `content/posts/<slug>/index.md` | 文章正文（Markdown） |
| `src/` | Astro 网站：页面、布局、样式、站点和作者信息 |
| `public/og/` | 每篇文章的分享图 |
| `scripts/` | 构建前的内容检查、分享图生成 |
| `docs/` | 写作发布流程、SEO 与分发、平台调研、网站设计规范 |
| `templates/` | 文章、研究简报、发布检查、面试卡模板 |

## 本地运行

需要 Node 22.12 或更高版本。

```bash
npm install
npm run dev      # 本地预览 http://localhost:4321/
npm run og       # 重新生成分享图（需要本机安装 Chrome）
npm run build    # 内容检查后构建到 dist/
```

推送到 `main` 后，GitHub Actions 构建并部署到 GitHub Pages。访问统计用 Cloudflare Web Analytics，不用 Cookie。

## 写作和发布流程

先发在本站，再把同一篇正文发到掘金、知乎、CSDN，X 发短版串推。完整流程见 [pipeline.md](docs/pipeline.md)，SEO 做法见 [seo-distribution.md](docs/seo-distribution.md)，引用和纠错规则见 [editorial-policy.md](docs/editorial-policy.md)。文章由 AI 辅助起草，作者核查事实并定稿。

## 许可

文章采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans)，转载请注明作者和原文链接；网站代码采用 MIT。
