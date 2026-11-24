# Sidekick 发布文案包

以下是发布用文案，仓库链接统一写 https://github.com/Cznorth/sidekick-open （MIT 协议）。所有视频画面都是架构演示，不是私人实例录屏。

## 短视频：抖音 / 视频号 / 小红书

**封面**：我为什么只公开私人 Agent 的内核？

**正文**：我做 Sidekick，不是为了再做一个聊天框。设备和权限因人而异，所以我把接入做成可换的 World，把忙时快答限制为只读，把任务是否完成交给状态机，而不是交给一句「做好了」。我公开设计、踩坑记录和能本地跑的参考代码；私人数据与适配器都不公开。想从哪一部分开始改？仓库：https://github.com/Cznorth/sidekick-open

## B 站 / YouTube 中文

**标题**：我为什么不把自己的 Personal Agent 整套开源？｜Sidekick 设计拆解

**简介**：一套能替我接工具、记事情、跟踪执行的助手，最难复用的恰恰是我的权限、设备和工作习惯。所以这次公开能迁移的东西：World 适配边界、忙时只读快答、夜间归档与混合召回、秘书和执行器之间的任务账本。示例没有密钥，也不用联网：`npm run demo`。仓库里还有一份部署 Skill，可以直接交给 Coding Agent 带你搭自己的。仓库：https://github.com/Cznorth/sidekick-open

## X / Hacker News / YouTube English

**Title**: Sidekick: what I kept after building a personal agent for myself

**Post**: The least reusable part of my personal agent is the personal part. I'm sharing the patterns instead: replaceable Worlds for tools and events, read-only quick replies while the main loop is busy, scoped memory with nightly consolidation, and a task ledger that separates delivery from acceptance. The reference core runs locally with no model key or dependencies, and the repo ships a deploy skill you can hand to a coding agent. MIT licensed: https://github.com/Cznorth/sidekick-open

**HN discussion prompt**: How do you handle a new user question while an agent is already in a long-running turn? I'd especially like to compare the cancellation and message-ownership boundaries.

## 长文：公众号 / 知乎 / 博客

**标题**：做了一个贴身 Agent 以后，我决定只公开三样东西

个人 Agent 最难做的不是让它会聊，而是把现实世界接进去。手机在熄屏时会冻进程；工具执行十分钟，用户的追问不能跟着排队；执行器受到限额不应被误认为任务失败。再好的系统提示词，也不能替你做这些确定的决策。

我采用了三个边界。第一，设备和工具走各自的 World，事件贴上来源与信任标记，不用通用聊天历史囤所有原始数据。第二，主线的上下文保持稳定，快答借前缀但不借写权；长期信息另行归档和检索。第三，执行器把交付物带回来，任务账本记着它在等配额、等人决定，还是已经验收。

所以我公开设计理念、踩坑经验和脱敏的参考核心，而不是把我的个人部署包装成通用产品。使用通用工具没有错；如果你也想把权限和行为真正改到自己满意，可能更值得拥有一个足够小、能持续改源码的内核。仓库：https://github.com/Cznorth/sidekick-open
