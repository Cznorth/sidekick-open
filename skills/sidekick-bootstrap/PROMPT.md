# Bootstrap prompt / 引导 Prompt

Paste one of these into your own Claude Code, Codex, or other coding agent, in an empty working directory. The agent will follow the skill to get Cortico running and connect your first custom World.

把下面任一段粘给你自己的 Claude Code、Codex 或其他 Coding Agent（在一个空的工作目录里）。它会按 Skill 带你把 Cortico 跑起来，并接入第一个自定义 World。

## English

```text
I want to build my own Sidekick-style personal agent on the open-source Cortico runtime.

1. Clone https://github.com/Cznorth/sidekick-open (or use my local copy if I give you a path) and read, in order:
   AGENTS.md, skills/sidekick-bootstrap/SKILL.md, docs/design.md, docs/lessons.md.
   Run `npm test` and `npm run demo` there to confirm the reference core works.
2. Follow skills/sidekick-bootstrap/SKILL.md phase by phase. In this session, take me through:
   - Phase 0: interview me and write PLAN.md in a new private repository for my agent;
   - Phase 1: clone https://github.com/Pal-AI-Lab/Cortico in its own directory, start it, and help me configure a model endpoint in the WebUI;
   - Phase 2: create my bot package and one World package from Cortico's templates/extension/, link-install them, and pass `pnpm check:extension`;
   - Phase 3: make that World read-only with a Bearer-token ingress, deduplicated items, explicit wake policies and third-party-content tagging, with tests;
   then stop at the Phase 3 checkpoint and show me the curl test.
3. Rules: ask me before any permission, key, login, open port, or write-capable tool. Never commit secrets or personal data; use synthetic fixtures only. Never test with fake data in a live chat. Verify every Cortico command and field against its current docs instead of trusting the skill text. Tell me plainly what exists and what we are building ourselves.
4. Commit after each checkpoint with a short message, and summarize what is done and what comes next.
```

## 中文

```text
我想在开源的 Cortico 运行时上，搭一个我自己的 Sidekick 式个人 Agent。

1. 克隆 https://github.com/Cznorth/sidekick-open （如果我给了本地路径就用本地的），按顺序读：
   AGENTS.md、skills/sidekick-bootstrap/SKILL.md（中文对照 SKILL.zh-CN.md）、docs/design.zh-CN.md、docs/lessons.zh-CN.md。
   在那里跑 `npm test` 和 `npm run demo`，确认参考核心能跑。
2. 按 skills/sidekick-bootstrap/SKILL.md 一个阶段一个阶段来。这次会话带我做完：
   - 阶段 0：访谈我，在给我的 Agent 新建的私有仓库里写 PLAN.md；
   - 阶段 1：在单独目录克隆 https://github.com/Pal-AI-Lab/Cortico 并启动，帮我在 WebUI 里配好模型端点；
   - 阶段 2：用 Cortico 的 templates/extension/ 建我的 bot 包和一个 World 包，以 link 方式安装，通过 `pnpm check:extension`；
   - 阶段 3：把这个 World 做成只读：Bearer 令牌入口、条目去重、明确的唤醒策略、第三方内容标记，并写好测试；
   做到阶段 3 的检查点就停下，给我看 curl 测试结果。
3. 规矩：授予任何权限、密钥、登录、开放端口或写工具前先问我。密钥和个人数据永不提交，夹具只用合成数据。不在正式聊天里用假数据测试。Cortico 的命令和字段以它当前的文档为准，不要照抄 Skill 里的写法。老实告诉我哪些是现成的、哪些要我们自己写。
4. 每到一个检查点就提交一次（提交信息简短），并总结做完了什么、下一步是什么。用中文和我沟通。
```
