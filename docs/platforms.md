# 平台调研

核查日期：2026-11-01。核查方法：用 curl 下载下方“来源”里的页面，在正文里搜索对应条款；X 帮助页对 curl 和 r.jina.ai 都返回 403，改读 web.archive.org 2026-10-05 的快照；Medium 帮助页通过 r.jina.ai 读取全文。标“官方”的是平台自己的页面；标“镜像”或“转载”的是第三方复制的平台规则，可信度较低；查不到的写“未核实”。平台规则会变，每次发文前重新看一眼发布页提示。

## 结论

首批发掘金、知乎、CSDN，加 X。第二批看思否、腾讯云开发者社区、InfoQ 写作社区。V2EX 只在有新作品或开源项目时发到“分享创造”节点，不用来搬文章。英文平台以后再看，dev.to 和 Medium 都支持 canonical，转载最省事。

所有中文平台的共同点：原创可以发，外链要克制，二维码、联系方式和课程推广最容易被判为导流。平台版本放完整正文，文末放一条网站或仓库链接，最稳妥。

## 首批平台

| 平台 | 已核实的规则 | 来源等级 | 对我们的做法 |
| --- | --- | --- | --- |
| 掘金 | 用户协议要求内容原创或已获授权（2025-12-24 生效版）。行为规范写明：与他文重合大于 40% 算抄袭；个人在其他平台的付费教程、视频教程、书籍推广算广告；文章内链接跳转钓鱼、木马网站会被删除并禁言 30 天。内容标准还把招聘、广告、SEO 推广列为不允许发布的内容 | 协议为官方；行为规范和内容标准来自掘金小册《如何使用掘金社区》的第三方镜像，官方小册页面需要登录，正文未读到 | 发和网站相同的正文，保留代码和图；文末放网站和仓库链接；不放付费内容推广。“与他文重合大于 40% 算抄袭”针对搬别人的文章，作者发自己的原创不在此列 |
| 知乎 | 机构号规范禁止多次发布含联系方式、推广链接的低质内容，禁止诱导点击链接；转载的治理公告禁止在头像、昵称、标题加导流信息 | 机构号规范为官方，但它管机构号；治理公告为转载；《知乎社区规范》主页返回 403，个人号外链规则未核实 | 先完整回答问题，再附一条链接；标题和简介不放链接 |
| CSDN | 创作规范把营销性第三方网址、以课程推广或引流为目的的文章、只有一个网址的文章列为违规；被投诉侵权会封号，解封要改为转载并注明出处 | CSDN 子站 huaweicloud.csdn.net 上的规范副本，非 blog.csdn.net 主站页面 | 选“原创”，正文完整；文末放链接；推广位只走 CSDN 自己的“推广管理” |
| X | 帮助页《About Articles》写明 Articles（长文）面向 Premium、Premium+ 订阅者，以及企业和机构账号 | 官方帮助页，读的是 web.archive.org 2026-10-05 快照（直连返回 403），订阅名称和价格可能已变 | 没订阅时只能发帖子和串推；长文放网站，X 上发要点加链接 |

## 第二批平台

| 平台 | 已核实的规则 | 来源等级 | 结论 |
| --- | --- | --- | --- |
| 思否 SegmentFault | 鼓励原创，转载不额外推荐；开头不放个人推荐和二维码；允许文末适当放个人链接；推荐要求 500 字以上；大量发布 SEO 推广链接算垃圾广告 | 官方 | 适合，链接放文末 |
| 腾讯云开发者社区 | 自媒体同步计划要求至少 20 篇原创技术文章，同步近 3 个月内容；原创分享计划要求社区首发，禁止商业推广、公众号二维码和联系方式；改编、翻译、整理他人作品不算原创 | 官方 | 攒够 20 篇后申请同步计划，省去手动搬运 |
| InfoQ 写作社区 | 写作社区介绍页写明可以把个人博客、公众号直接搬过来，但日常发文的审核规则未找到。中文站投稿有三种版权方案：独家约稿；作者保留版权、授权 InfoQ 首发（200 元/篇）；CC 协议全文转载（无稿费，保留原始出处） | 官方，社区日常规则未核实 | 可以发；精品文章可走中文站投稿 |
| V2EX | FAQ 和“链接搬运”页要求停止逐个搬运自己网站链接；独立作品发“分享创造”，营销内容发“推广” | 官方 | 只发开源项目或系列总结，不发单篇文章链接 |
| 博客园 | 社区规范禁止在头像、昵称、标题加推广信息，禁止诱导到第三方平台关注或注册。首页收录规则未核实 | 社区规范为官方 | 可选，优先级低于思否 |
| 微信公众号 | 正文外链权限和“阅读原文”的现行规则没找到官方说明。2016 年新榜报道称一般订阅号正文只能链接微信文章，所有账号可在“阅读原文”放一条外链 | 第三方，已过时 | 放第二批；上线前开号实测 |

## 英文平台（以后用）

| 平台 | 已核实的规则 | 来源 |
| --- | --- | --- |
| dev.to | front matter 写 `canonical_url`，或在编辑器设置里填 Canonical URL；RSS 导入可默认把源地址设为 canonical | 官方帮助页 |
| Medium | 《Importing a post to Medium》：导入工具自动回填原发布日期并加 canonical，只能导入自己有权使用的内容。《Set a canonical link》：作者可在 More settings → Advanced Settings 勾选“This story was originally published elsewhere”手动填写 | 官方帮助页，经 r.jina.ai 读取全文 |

## 对 SEO 的影响

Google 的规范化排障页说，转载伙伴的页面差异往往较大，不建议依赖 canonical，更有效的是让对方 noindex。中文平台不给作者设置 canonical 或 noindex，所以：

- 默认全文发，接受平台页可能排名更高，做法见 [seo-distribution.md](seo-distribution.md)“平台版本与重复内容”。
- 个别特别看重网站排名的文章，平台只发前半篇加链接。
- dev.to 和 Medium 能设 canonical，全文转载不影响网站。

百度能否收录 github.io 没有实测。本机用百度爬虫的 UA 访问 github.io 返回 200，只能说明 GitHub 没有按 UA 拦截，不代表百度真实爬虫能抓到。中文搜索流量前期主要靠平台带，网站上线后在百度站长平台实际验证。

## 来源

- X Articles：https://help.x.com/en/using-x/articles
- 掘金用户协议：https://lf3-cdn-tos.draftstatic.com/obj/ies-hotsoon-draft/juejin/86857833-55f6-4d9e-9897-45cfe9a42be4.html
- 掘金行为规范与内容标准（镜像，第 11、13 节）：https://dext7r.github.io/juejinBooksSpider/如何使用掘金社区/ ；官方小册 https://juejin.cn/book/6844733795329900551 正文需登录
- 知乎机构号规范：https://www.zhihu.com/org_use_norm；知乎社区规范 https://www.zhihu.com/term/community 返回 403
- 知乎导流治理公告（转载）：https://www.st-lt.com/553.html
- CSDN 创作规范：https://huaweicloud.csdn.net/63a567cab878a5454594682e.html
- CSDN 博客帮助：https://huaweicloud.csdn.net/63a56667b878a54545946421.html
- 思否编辑规则：https://segmentfault.com/a/1190000020142376；推荐规范 https://segmentfault.com/a/1190000023408159；管理规定 https://segmentfault.com/tos/community
- 腾讯云：https://developer.cloud.tencent.com/support-plan；https://developer.cloud.tencent.cn/original-sharing
- InfoQ 投稿指南：https://www.infoq.cn/article/ZvNQL4PvYQFuiw7wCo3U；另一页 https://www.infoq.cn/article/tCGSdvI40tBu0c6xmulb 未找到原创或转载条款
- V2EX：https://www.v2ex.com/faq ；https://www.v2ex.com/help/spam ；https://www.v2ex.com/help/node
- 博客园：https://about.cnblogs.com/guidelines
- Cloudflare Web Analytics 产品页（不用 Cookie 或 localStorage，不做指纹识别）：https://www.cloudflare.com/web-analytics/
- 公众号（第三方，2016）：https://www.newrank.cn/report/detail/14
- dev.to：https://dev.to/help/writing-editing-scheduling
- Medium：https://help.medium.com/hc/en-us/articles/214550207-Importing-a-post-to-Medium ；https://help.medium.com/hc/en-us/articles/360033930293-Set-a-canonical-link
- Google 规范化排障：https://developers.google.com/search/docs/crawling-indexing/canonicalization-troubleshooting
