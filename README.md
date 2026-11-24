# Sidekick: a personal agent you can rewrite

English · [简体中文](README.zh-CN.md) · [Design notes](docs/design.md) · [Lessons](docs/lessons.md) · [Deploy skill](skills/deploy-sidekick/SKILL.md) · [Launch copy](launch/copy.md)

**One front door. Permissions on your terms. Source you can keep changing.** Sidekick is a personal agent built as extension packages on the open-source agent runtime [Cortico](https://github.com/Pal-AI-Lab/Cortico). This repository shares what is portable: the design, the pitfalls we hit, a runnable reference core, and an agent-facing skill that walks you through building your own. It is not an installer for the original deployment.

General-purpose assistants are useful out of the box. Personal workflows, however, span devices, OS permissions, and private context. A platform cannot assume broad access or build the last mile for every user. Sidekick's bet is a small agent loop, replaceable Worlds for data and tools, and source-level customization with a capable coding model. Reviewable changes, tests, and rollback still matter; self-evolution is not an excuse for unreviewed deployment.

![Worlds route external events, the main Agent owns its context, quick answers run read-only, and executors report through a task ledger](docs/architecture.svg)

| Problem | Design |
| --- | --- |
| Each new integration changes the agent | Worlds package events and scoped tools behind explicit boundaries |
| Raw device data floods the main conversation | A cheap intake model filters raw data; only what matters reaches the secretary |
| Questions stall behind long turns | A bounded, read-only `fastReply` branch can reuse the main request prefix or hand back to the main loop |
| A large window turns into a noisy archive | Keep a hot prefix and role-scoped memory; consolidate at night and combine lexical with semantic retrieval |
| Dispatched tasks disappear into chat | Track waiting, review, and completion separately in a task ledger |
| "Add a feature" requires the owner to code | The secretary relays the user's own words to a coding executor that edits, tests, commits, and can roll back |

## Layering

```
raw device data (phone, mail, computer, health)
   │  intake: a cheap model filters, merges, forwards only what matters
   ▼
secretary: the main bot, the only one that talks to the user, dispatches work
   │  task brief + the user's original words
   ▼
coding executors (Claude Code, Codex, OpenCode, Pi, ...): edit, test, commit, deploy
```

**Model choice (author's experience, not a benchmark).** The secretary currently runs on Gemini. In the author's day-to-day use, Gemini generalizes clearly better than Claude Opus 5.5 for this role and proactively does things without being asked twice; he considers it the best model for a personal agent right now. Intake runs on cheaper models with a fallback chain; heavy code changes go to coding agents as executors. Your mileage will differ: keep the provider swappable.

## Run the reference core

Use Node.js 22 or later. No dependencies, network access, or model keys are needed:

```sh
npm run demo
npm test
```

The synthetic workshop example routes a deduplicated event, pauses and resumes a task after a quota limit, reviews the result, answers a read-only question, and archives old notes before consolidation. The reference core re-expresses the design without copying deployment code. It does not include device adapters, real data, a model gateway, or durable storage. The [design notes](docs/design.md) distinguish the original system from the example.

## Build your own

Hand [`skills/deploy-sidekick/SKILL.md`](skills/deploy-sidekick/SKILL.md) to a coding agent (Claude Code picks it up as a skill; Codex and others find it through [`AGENTS.md`](AGENTS.md)). It guides you from zero to your own Sidekick-style agent on Cortico: what already exists, what you must build, the order to build it in, verification, and safety rules. Read [docs/lessons.md](docs/lessons.md) before you wire real devices.

## What is in this repository

| Path | Content |
| --- | --- |
| `docs/design.md` / `docs/design.zh-CN.md` | Design notes (English / Chinese) |
| `docs/lessons.md` / `docs/lessons.zh-CN.md` | Pitfalls and habits, each as problem → what happened → rule |
| `docs/architecture.svg` | Architecture diagram |
| `core/` | Dependency-free reference core and tests |
| `skills/deploy-sidekick/` | Agent-facing deploy/install skill |
| `launch/` | Video storyboard, motion source and launch copy (synthetic material only) |

Not included: the private device adapters, Android companion app, Windows agent, prompts, deployment config, or any personal data.

## Contributing and license

See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/release-review.md](docs/release-review.md). Licensed under the [MIT License](LICENSE).
