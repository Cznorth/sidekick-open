# AGENTS.md

Instructions for coding agents (Codex, Claude Code, OpenCode, Pi, and others) working in or with this repository.

## If the user wants to deploy or build their own Sidekick

Read [`skills/sidekick-bootstrap/SKILL.md`](skills/sidekick-bootstrap/SKILL.md) and follow it phase by phase (Chinese: `SKILL.zh-CN.md`). A ready-to-paste starter prompt for users is in [`skills/sidekick-bootstrap/PROMPT.md`](skills/sidekick-bootstrap/PROMPT.md). It explains what already exists (the open-source Cortico runtime, this repo's design notes and reference core) and what you must build with the user (their own bot and World packages). Read [`docs/lessons.md`](docs/lessons.md) before wiring real devices.

Claude Code users can also install the skill by copying `skills/sidekick-bootstrap/` to `.claude/skills/` (project) or `~/.claude/skills/` (user).

## If you are changing this repository

- Node.js 22+. No dependencies. Run `npm test` and `npm run demo` before committing.
- English is the primary language. Keep the Chinese counterparts in sync: `README.md` ↔ `README.zh-CN.md`, `docs/design.md` ↔ `docs/design.zh-CN.md`, `docs/lessons.md` ↔ `docs/lessons.zh-CN.md`, `docs/release-review.md` ↔ `docs/release-review.zh-CN.md`, `skills/sidekick-bootstrap/SKILL.md` ↔ `SKILL.zh-CN.md`.
- Code comments and console output in `core/` are English.
- Privacy: no personal names, emails, phone numbers, IPs, hostnames, domains, server paths, tokens, or account names anywhere, including commit messages. Use generic placeholders. Follow the checklist in [`docs/release-review.md`](docs/release-review.md).
- Sample data is synthetic and written from scratch.
- Do not change the repository's visibility.
