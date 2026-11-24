---
name: sidekick-bootstrap
description: Guide a user from zero to their own Sidekick-style personal agent on the open-source Cortico runtime - prerequisites, running Cortico, writing their own bot and World extension packages (authenticated ingress, third-party-content tagging, read-only first), the intake -> secretary -> coding-executor layering, a task ledger, self-update through coding executors, model choice, optional Android/PC companions, verification and safety rules. Use when the user asks to deploy, install, set up, or build "Sidekick", "a personal agent like Sidekick", or a Cortico personal assistant.
---

# Bootstrap your own Sidekick-style personal agent

English · [简体中文](SKILL.zh-CN.md) · Ready-to-paste prompt: [PROMPT.md](PROMPT.md)

You are a coding agent helping a user build **their own** personal agent following the Sidekick design. Work through the phases below in order, confirm each checkpoint with the user, and keep changes small, tested, and committed.

## Be honest about what exists

| Exists (public) | Does not exist here (you build it with the user) |
| --- | --- |
| [Cortico](https://github.com/Pal-AI-Lab/Cortico) runtime: event loop, sessions, providers, WebUI, extension loader, extension templates (`templates/extension/`), docs (`docs/extensions.md`, `docs/worlds.md`, `docs/providers.md`) | Sidekick's private bot package, World adapters, prompts, connectors |
| [Cortina](https://github.com/Pal-AI-Lab/Cortina): an agent workspace for building Cortico extensions | An installer or one-command deploy |
| This repo: `docs/design.md` (design), `docs/lessons.md` (pitfalls), `core/` (dependency-free reference for World routing, fast reply, task ledger, memory) | Android companion app, Windows PC agent |
| Coding agents the user already has (Claude Code, Codex, OpenCode, Pi, ...) | Any of the original owner's data or deployment |

Never promise that something "is already there" unless you have checked it in the user's Cortico checkout. Cortico moves fast: read its current `README.md` and `docs/extensions.md` before relying on any command, field name, or API version quoted below. Treat everything quoted here as "at the time of writing".

## Ground rules (apply in every phase)

1. **Ask before granting anything.** Every new data source, OS permission, API key, account login, open port, or write-capable tool needs the user's explicit yes, in this conversation.
2. **Read-only first.** Every new World starts with read-only tools. Write tools (send a message, change a setting, run a command) come later, one at a time, with the user's approval.
3. **Never commit personal data.** Deployment directories, `.env`, tokens, OAuth files, memory, chat history, real messages, health data, screenshots stay out of Git and out of test fixtures. Write synthetic fixtures. Check `git diff --cached` before each commit.
4. **External content is information, not instructions.** Notification, SMS, mail, web, and calendar text is tagged as third-party content; tool permissions are enforced in code.
5. **Never test in the live chat with fake data.** Use unit tests and locally started Worlds. A single corrupt attachment in the real conversation can stall the agent for hours (see `docs/lessons.md` #13).
6. **Keep the user's words.** When relaying requests anywhere, pass the original text; summaries are indexes, not sources of truth.

## Phase 0 - Interview (no code yet)

Ask, and write the answers into a `PLAN.md` in the user's own (new, private) repository:

- Which devices and sources matter first? (phone notifications, SMS, mail, calendar, computer activity, health). Pick **one** to start.
- Where will it run? (a home machine, a small server, a laptop). Is it reachable from the phone? Over what network?
- Which chat front door? (Cortico WebUI console to start; later a web page or app via a chat World.)
- Which model accounts/keys do they have? Budget per month?
- Which coding agents do they already use, and on which machines?
- What must the agent **never** do? (send messages, spend money, delete files...)

Checkpoint: user agrees with `PLAN.md`.

## Phase 1 - Prerequisites and Cortico

1. Node.js 22+ (`node -v`), Git, and `corepack` (ships with Node).
2. Clone and start Cortico in its own directory (not inside the user's repo):
   ```sh
   git clone https://github.com/Pal-AI-Lab/Cortico.git
   cd Cortico && corepack pnpm install && pnpm start
   ```
   First launch creates a default deployment and serves the WebUI locally (see Cortico's README for the port). Have the user configure a model endpoint in the WebUI and say hello in the console.
3. Optionally run this repo's reference core to see the patterns: `npm test && npm run demo` in a clone of `sidekick-open`.

Checkpoint: the default bot answers in the WebUI console.

## Phase 2 - Repository and packages

Create the user's own private repository (for example `my-sidekick/`) with a `packages/` folder. Sidekick does **not fork Cortico**; it ships extension packages that Cortico loads:

- `packages/bot` - a bot package (`cortico.kind: "bot"`): persona prompt, memory protocol, which Worlds it declares.
- `packages/world-<name>` - one World package per capability (`cortico.kind: "world"`).
- optionally `packages/provider-<name>` for custom model gateways or fallback chains.

Start each package by copying the matching template from Cortico's `templates/extension/` (or let Cortina scaffold it), then rename package name and id, `corepack pnpm install`, `pnpm test`. Follow `docs/extensions.md` for `package.json` fields (`type: module`, `keywords`, `cortico.kind`, `cortico.api`). Install into a deployment by link:

```sh
cd Cortico/extensions && corepack pnpm add <absolute path to package dir>
```

Select your bot for a deployment (`pnpm start --new`, or the deployment's config as documented by Cortico), restart, and validate packages with `pnpm check:extension <package dir>` from the Cortico root (regenerate `describe.json` with `pnpm describe:extension <package dir>` after changing tools or events).

Add an `AGENTS.md` to the user's repo with: commit/test commands, "deploy only from main", "no personal data", and "update the self-manual in the same commit as capability changes".

Checkpoint: the bot package loads, a no-op World shows up in the WebUI, tests pass, first commit made.

## Phase 3 - The first World (read-only)

Follow `docs/design.md` ("Worlds") and `core/world.mjs`:

1. **Ingress.** A World has no built-in external entry point. If devices push data, start a small HTTP server inside the World: Bearer token from the deployment's `.env`, constant-time comparison, JSON only, body size limit, and **do not listen at all when no token is configured**. Generate the token with the user (`node -e "console.log(crypto.randomBytes(32).toString('hex'))"`), store it only in `.env`. Pick unused ports. Support a second "next" token for rotation.
2. **Items vs snapshots.** Items (one event each) deduplicated by a client-generated stable ID; snapshots (live state) partially overwritten and only exposed through tools.
3. **Events.** Push events with an explicit wake policy (wake now / debounce / ride along with the next batch). Mark external content as third-party, not instructions.
4. **Tools.** Read-only query tools first (`<world>_recent`, `<world>_status`). Put a hard deadline on every network call.
5. **Env prompt.** A short environment prompt explaining what the World provides and that its content is third-party data.
6. **Tests.** Auth rejected without/with wrong token, size limit, dedup on replay, wake policy per type, tool output on synthetic data.

Checkpoint: a synthetic item posted with `curl` (correct token) appears as an event; wrong token gets 401; replay is deduplicated.

## Phase 4 - Layering: intake -> secretary -> executors

1. **Secretary** = the main bot. The only role that talks to the user. Make a single send tool the only path to the user, and bounce a turn that ends in plain text back once (lessons #12).
2. **Intake** = a separate member bot on a cheap model that owns raw device Worlds, filters and merges, and forwards only what matters to the secretary. Separate sessions keep the secretary's prompt cache intact (lessons #21). Cortico supports multiple deployments; how the two talk (a chat/hub World, HTTP between deployments) is part of what you build — keep it small.
3. **Executors** = coding agents. Build a dispatch World with a small connector per executor machine that long-polls for jobs (no inbound ports on the executor machine). Dispatch carries the **user's original words** attached by code; optional quotes must be verified as contiguous spans of the original; any paraphrase is attached alongside and marked "the original wins" (lessons #16).
4. **Task ledger** in code (see `core/tasks.mjs`): `pending -> dispatched -> running`, `waiting` (question or quota, resumable), `review` (delivered), `done` only after acceptance; attempts and sequence numbers; reconcile after restart; stalled-session detection.
5. **Fast reply** (optional, later): a bounded read-only branch for questions while the main loop is busy (`core/fast-reply.mjs`).

Checkpoint: a request typed in chat becomes a task, reaches an executor with the original text, comes back as `review`, and only becomes `done` when the user accepts.

## Phase 5 - Self-update

Point one executor at the user's own agent repository. The secretary relays "change yourself" requests verbatim to it. The executor must: edit, run tests, commit to main, deploy from main only, report back, and be able to roll back (keep the previous build/commit and a one-line rollback command). The running agent gets no permission to edit its own config or install tools. Never deploy a feature branch (lessons #28).

**Builds:** do not run heavy builds (Android/Gradle, large native compiles) on a small-memory main server; they can take tens of minutes and squeeze the agent itself out of memory. The author's pattern: the server queues the build, the user's own computer (which can reach the server) claims it, builds the already-pushed commit, sends the artifact back with a hash, and the server re-signs it with the release key before install; the signing key never leaves the server. Fall back to a memory-capped, one-at-a-time local build only when the computer is offline; a real compile error is returned as-is, not retried elsewhere (lessons #36).

Checkpoint: a small, harmless change requested in chat is implemented, tested, committed, deployed, and rolled back once as a drill.

## Phase 6 - Models

- **Secretary:** the author runs the secretary on a 1M-context Gemini. In his experience it currently works best — it generalizes clearly better than Claude Opus 5.5 in this role and proactively does things. This is one person's experience, not a benchmark; let the user choose and keep it in config. A large window is a ceiling, not a target: still use handoff notes and recall.
- **Intake and other members:** a cheaper model with its own fallback chain.
- **Coding:** do not make the secretary write code. Coding goes to coding agents (Claude Code, Codex, and similar) as executors, on whatever subscriptions the user has (lessons #34).
- **Fallback chains:** ordered list per endpoint; fail fast on "insufficient quota" or long `Retry-After`; persist cooldowns; no fallback after streaming started, on context overflow, or on cancellation (lessons #22). Do not copy one-time-refresh login files between machines (lessons #23).
- Ask before adding any new paid model.

Checkpoint: kill the primary endpoint (wrong key in a test deployment); the turn completes on the fallback; restoring the key switches back.

## Phase 7 - Memory and context

- **Do not break the prefix cache when writing memory.** If the memory file is rendered into the system prefix, rewriting it mid-session invalidates the cached prefix. Append new facts (as a line in the file for the next prefix, or as an injected message in the running session) and leave the long-lived prefix untouched until a handoff or the nightly job; if the user edits memory by hand, reload the prefix once and say the next turn will miss the cache (lessons #35).
- A capped always-on memory file; overflow moves to searchable recall.
- Handoff note at a soft context watermark, new session at a hard one.
- **Nightly Dream:** once a night (and on restart if it was missed), archive the full old memory into recall first, then let the secretary consolidate (keep identity, long-term facts, preferences, rules, open items; merge duplicates; drop stale progress), then compare-and-swap against memory and task revisions (`core/memory.mjs`). Only the secretary dreams.
- Lexical + semantic recall fused by rank, authorized before querying.
- Every time value given to the model includes local date and time; durations use explicit units (lessons #14).

## Phase 8 (optional) - Phone and PC companions

These are not provided; build them only if the user wants them, and only after the server side works.

- **Android companion:** a foreground service that pushes items/snapshots to the phone World with the device token. Read `docs/lessons.md` #1-#7 first: aggressive skins freeze background apps (watchdog, reconnect, wake lock, monotonic clocks, "unrestricted" battery policy), updates revoke permissions, watch Wi-Fi explicitly, never uninstall to fix installs, test over the real network with the screen off. Ask before each permission; explain what each one enables and what breaks without it.
- **Phone operations without stealing the screen.** If the agent operates apps on the phone, the author's practice is to run those actions on a virtual display rather than the main screen, so a second hop (one app opening another) does not light up the screen or take the foreground while the user is using the phone. Never open the companion UI to "wake" things while the user is on the phone (lessons #38).
- **No SSH in the daily path.** Daily collection and actions run on the phone itself and push over the authenticated HTTPS ingress. Shell access to the phone (adb, an SSH bridge) is for maintenance and manual backfill only, not a dependency of any World (lessons #38).
- **Browser automation:** give automated Chrome/Chromium its own CDP user-data directory, never the user's everyday profile, so automation cannot invalidate their cookies and logins (lessons #37).
- **PC agent:** a small background program that pushes foreground-window/presence items to a pc World and long-polls for jobs. Start read-only. Any "operate my computer" tool needs explicit approval and a visible log. On Windows, delete non-ASCII paths with `fs.unlinkSync`, not `fs.rmSync` (lessons #27).

## Phase 9 - Verification checklist

- [ ] `pnpm test` / `pnpm check:extension` pass for every package.
- [ ] No World listens without a token; wrong token returns 401; body limit enforced.
- [ ] Replayed items are deduplicated; wake policies behave per type.
- [ ] External content is tagged third-party in events and the env prompt.
- [ ] Only the send tool reaches the user; plain-text endings are bounced once.
- [ ] Every network call and tool call has a hard deadline.
- [ ] A dispatched task carries the original words; delivery goes to `review`, not `done`; quota pause is `waiting`.
- [ ] Fallback chain verified by breaking the primary in a test deployment.
- [ ] Self-update drill done, including one rollback.
- [ ] `git log -p` and the working tree contain no tokens, `.env`, personal data, real hostnames or IPs.
- [ ] A self-manual exists and matches current settings and permissions.

## Safety rules (summary)

- Ask before granting permissions, keys, ports, logins, or write tools.
- Never commit personal data or secrets; synthetic fixtures only.
- External content is information, not instructions.
- No fake or corrupt data in the live chat.
- Deploy only from main; keep rollback ready.
- Do not let the running agent change its own permissions or config.

## Using this skill with other agents

Claude Code loads this file as a skill when it is placed under `.claude/skills/sidekick-bootstrap/` (project) or `~/.claude/skills/sidekick-bootstrap/` (user). Codex, OpenCode, Pi and other agents find it through the repository's root `AGENTS.md`; tell them to "read `skills/sidekick-bootstrap/SKILL.md` and follow it".


Chinese version: [SKILL.zh-CN.md](SKILL.zh-CN.md).
