# Lessons from running a personal agent

English · [简体中文](lessons.zh-CN.md)

These are pitfalls, experience, and habits from building and running Sidekick every day. They are generalized: product names are kept only where the behavior is vendor-specific. Each entry is written as **problem → what happened → rule**.

## Devices and the Android companion

### 1. Aggressive Android skins freeze background apps
- **Problem:** On HyperOS / MIUI (and similar skins), a companion app that only runs a notification listener stops receiving anything shortly after the screen turns off.
- **What happened:** Even with a foreground service and battery-optimization exemption, the process was frozen in its cgroup tens of seconds after screen-off. `dumpsys activity` still reported `isFrozen=false`; the real signal was the cgroup `cgroup.freeze` file. While frozen, packets to the app were dropped, the server-side TCP connection died while the app believed it was still connected, and alarm broadcasts were held back.
- **Rule:** Run a persistent foreground service. Hold a short wake lock whenever bytes arrive. Reconnect on screen-on, unlock, or opening the chat page if the link has been silent for ~30 s. Add an alarm-based watchdog (~5 min). Check the cgroup freeze file, not the activity manager, when debugging. Tell the user that only setting the app's battery policy to "unrestricted" (plus autostart) makes screen-off delivery reliable.

### 2. Timeouts stop when the phone sleeps
- **Problem:** Read timeouts and `wait()` calls never fired while the device was frozen or in deep sleep.
- **What happened:** Liveness checks based on those timers concluded the connection was fine long after it had died.
- **Rule:** Judge connection liveness with a monotonic clock that keeps counting through sleep (`elapsedRealtime` on Android) and compare against the last byte received.

### 3. Updating the app revokes permissions
- **Problem:** After every update install, some skins revoke all runtime permissions and the autostart flag.
- **What happened:** Data sources silently stopped (notifications, screenshots, location) and looked like a server bug.
- **Rule:** When a data source stops right after an update, suspect permissions first. Report each permission's state in the device snapshot (for example "photo access off") and push a device event when one is lost, so the agent can tell the user what to re-grant instead of guessing.

### 4. Listen to Wi-Fi explicitly
- **Problem:** The default-network callback missed Wi-Fi changes.
- **What happened:** When the phone joined a Wi-Fi network without internet access, the default network stayed cellular, so the app never saw the Wi-Fi event.
- **Rule:** Register a network callback that requests the Wi-Fi transport explicitly instead of relying on the default network.

### 5. Restarting after an update is not guaranteed
- **Problem:** After an over-the-top install, the collector did not come back until the user opened the app.
- **What happened:** On some skins the package-replaced broadcast was skipped by the vendor's startup policy before the app ever ran. Adding another broadcast receiver changed nothing.
- **Rule:** Restore collection from a boot/package-replaced receiver without opening UI, then verify the process and foreground service are actually running (look at the system's broadcast history). If a vendor policy blocks it, say so; do not declare it fixed because a fallback restart happened to work.

### 6. Never uninstall the companion to "fix" an install
- **Problem:** Installs failed with signature mismatches or `INSTALL_FAILED_USER_RESTRICTED`.
- **What happened:** Uninstalling would wipe local data and every permission grant; `adb install` was blocked by the vendor.
- **Rule:** Sign every build with one fixed key and compare the certificate hash before installing; on mismatch, stop. Never uninstall, downgrade, or clear data to get around it. When `adb install` is restricted, push the APK and open it with the system installer. Do not open the app's UI while the user is using the phone.

### 7. USB debugging lies about sleep behavior
- **Problem:** Everything worked while testing over `adb reverse`.
- **What happened:** Data arriving over USB kept the device responsive; over Wi-Fi or cellular with the screen off it froze.
- **Rule:** Test screen-on, screen-off, and network-switch scenarios over the real network path before calling a connectivity fix done.

## Ingress and events

### 8. Worlds need their own authenticated ingress
- **Problem:** A World has no ready-made external entry point.
- **What happened:** Each device-facing World grew a small HTTP server.
- **Rule:** One small server per World: Bearer token compared in constant time, JSON only, request size limit, and no listening at all when the token is not configured. Rotate tokens with a second "next" token accepted in parallel until every client has switched.

### 9. Items and snapshots are different things
- **Problem:** Pushing every state change into the model floods the context.
- **What happened:** Battery, screen, and app-usage updates crowded out messages that mattered.
- **Rule:** Split input into **items** (notifications, messages, calls: one event each, deduplicated by a client-generated stable ID) and **snapshots** (live state, usage, calendar: partial overwrite, read only through tools). Choose a wake policy per type: wake now, debounce, or ride along with the next batch. Ride-along events should not wait forever; flush them after a few minutes.

### 10. External content is information, not instructions
- **Problem:** Notifications, SMS, mail, web pages, and calendar text are written by third parties.
- **What happened:** Any of them can contain text that looks like an instruction to the agent.
- **Rule:** Tag every external event body as third-party content and say so in the prompt. Enforce tool permissions and argument checks in code; tagging reduces confusion but is not an injection defense.

### 11. Every network call needs a hard deadline
- **Problem:** One web fetch hung.
- **What happened:** The tool call never returned and the whole agent loop froze behind it.
- **Rule:** Put a hard deadline on every outbound request and on every tool call, independent of the library's own timeouts.

## Chat and the secretary

### 12. The user only sees what is explicitly sent
- **Problem:** Models often write their answer as plain assistant text.
- **What happened:** That text went nowhere; the user saw silence.
- **Rule:** Make the send tool the only path to the user. At the end of a turn, if it ended in plain text, bounce it back once with a reminder (not repeatedly). If the send tool returns a failure, require a corrected resend before the turn may end; a vanished streaming draft does not mean the message arrived.

### 13. Never test with fake data in the live chat
- **Problem:** A verification message was sent into the real conversation with a hand-built image.
- **What happened:** The PNG had a bad chunk checksum. One provider returned 400, the fallback failed to parse it, and because every message stays in context, the secretary could not complete a single turn for about four and a half hours.
- **Rule:** Verify with tests and locally started Worlds, not the live chat. If an image must be sent, use one that really decodes. Validate attachments at the server and reject corrupt ones; strip images a model refuses instead of retrying forever.

### 14. Time is always local date + time + explicit unit
- **Problem:** Models misread relative times and bare units.
- **What happened:** A lead time of `1m` was taken as one month instead of one minute.
- **Rule:** Every time value given to a model carries the local date and time. Durations use explicit units (`w`, `d`, `h`, `min`); reject an ambiguous bare `m`.

### 15. Long turns need checkpoints, not a wall
- **Problem:** A hard round limit cut real work in half; too high a limit let a stuck loop burn quota.
- **What happened:** Turns either stopped mid-task or spun silently.
- **Rule:** Use a soft checkpoint (report progress and next step to the user, then continue) and keep the hard limit only as an emergency stop. If a turn is interrupted on a tool receipt, resume from the next step without replaying actions that already ran, and tell the user about the gap honestly.

## Delegating to coding executors

### 16. Relay the user's own words
- **Problem:** A cheap model rewriting the request lost or invented requirements.
- **What happened:** Executors built the wrong thing from paraphrases.
- **Rule:** The code, not the model, attaches the user's original message to the task. The secretary may select quotes, but code verifies each quote is a contiguous span of the original and rejects the whole relay otherwise. An optional paraphrase is attached alongside, marked "the original wins", and shown to the user for checking.

### 17. Long decisions get a summary, with a code fallback
- **Problem:** Executors return long plans and questions that the user must decide on a phone.
- **What happened:** Waiting for the model to summarize sometimes meant waiting forever when the model was stuck.
- **Rule:** Above a length threshold, ask the secretary for a short summary and send it with code-generated options and a link to the full text. If no summary arrives within a fixed time, code sends the beginning itself. Make that timeout longer than the provider retry chain, or the retries eat it.

### 18. Finished is not accepted
- **Problem:** "The executor ended" was treated as "the task is done".
- **What happened:** Half-done work disappeared from view; quota pauses were closed as failures; a restarted hub let an old failed run flip a task back to failed.
- **Rule:** Keep a task ledger in code. Quota limits and questions are `waiting`; delivery is `review`; only user (or authorized) acceptance is `done`. Flag sessions that report running but produce no output for several minutes. Reconcile tasks against runs after restarts, and never let a stale run overwrite a newer one.

### 19. Self-update is a relay, not a privilege
- **Problem:** Users want "add this feature" to just work.
- **What happened:** The working pattern was the secretary relaying the request verbatim to a coding executor that owns the agent's own repository.
- **Rule:** The executor edits, runs tests, commits, deploys from main, and can roll back. The running agent itself gets no permission to edit its config or install tools. "That feature doesn't exist yet" means "not built yet", not "impossible"; the only real blocker is when every executor is offline.

### 20. A goal stays open until it is done
- **Problem:** The secretary kept asking the user to re-confirm steps of a request already given.
- **What happened:** Users had to repeat themselves, or older requests were silently dropped.
- **Rule:** A stated goal stays active until finished, cancelled, or replaced. Investigation, implementation, fixes, and verification are steps of that goal; only a changed goal, widened authorization, or something only the user can physically do needs the user.

## Models, context, and memory

### 21. Keep intake and secretary contexts separate
- **Problem:** Raw device data mixed into the secretary's session.
- **What happened:** High-frequency events kept rewriting the hot context and broke the prompt cache, and the expensive model paid for noise.
- **Rule:** Raw data goes to an intake bot on a cheap model with its own session; only what matters is forwarded. Keep the tool list order stable (World tools first, own tools after); reordering invalidates the cached prefix.

### 22. Fallback chains, not retries
- **Problem:** Quota errors and outages are routine across providers.
- **What happened:** Honoring a `Retry-After` of several hours froze the agent; a broken provider was retried on every request.
- **Rule:** Configure an ordered fallback list per endpoint. Fail fast on "insufficient quota" and on long `Retry-After`; persist cooldowns so a restart does not hit the dead provider again; demote a failed provider for a few minutes. Do not fall back after output has started streaming, on context overflow (hand that to compaction), or on user cancellation. Do not pass one provider's encrypted reasoning to another.

### 23. One-time refresh tokens cannot be shared
- **Problem:** The same subscription login was copied to a second endpoint and a second machine.
- **What happened:** Both refreshed independently; each refresh invalidated the other's token.
- **Rule:** Log in once per machine; additional endpoints borrow the existing login instead of copying the auth file.

### 24. Map tool-name drift
- **Problem:** Some models call tool names from their own training (`WebFetch`) instead of the declared ones (`web_fetch`).
- **What happened:** The runtime answered "unknown tool" and the agent could not read the page.
- **Rule:** Normalize returned tool names against the tools declared for this turn (case-insensitive, then an alias table); never map to a tool that was not declared.

### 25. Quick answers run on a read-only hot branch
- **Problem:** A simple status question waited behind a forty-minute turn.
- **What happened:** Users assumed the agent was dead.
- **Rule:** Answer pure questions on a bounded branch that copies the main prefix, may only run read-only tools, has a short deadline, and hands the message back to the main loop if it needs a write. See `core/fast-reply.mjs`.

### 26. Memory needs a cap and a nightly job
- **Problem:** Core memory grows until it crowds out the conversation.
- **What happened:** Old lines pushed out current context; a nightly rewrite could overwrite a task update made at the same moment.
- **Rule:** Hard-cap the always-on memory file and move the oldest lines to searchable recall automatically. At night, archive the full old memory first, then consolidate, then compare-and-swap against both memory and task revisions. Hand off to a new session at a soft context watermark with a written handoff note.

## Engineering and operations

### 27. Windows Node and non-ASCII paths
- **Problem:** File deletion on Windows with Node 24.
- **What happened:** `fs.rmSync(path, { force: true })` on a path with Chinese characters deleted nothing and reported nothing; in another case the process exited.
- **Rule:** Use `fs.unlinkSync` for files that may have non-ASCII names, and verify deletion.

### 28. Deploy only from main
- **Problem:** A feature branch was synced straight to the server.
- **What happened:** The next deploy from main silently removed that feature.
- **Rule:** Merge first, then deploy from main. Worktrees are fine for development, never as a deploy source.

### 29. Release checks are mechanical
- **Problem:** A new app build was missing commits that the previous build had.
- **What happened:** Builds were cut from a side branch.
- **Rule:** Release only from main and tag the exact commit. Before building, check that every commit of the previous release is contained in the new one and that the new one is not behind; fail instead of building. Release notes are a diff between versions, not just the latest change.

### 30. Generated config is overwritten
- **Problem:** Hand edits to a member bot's config disappeared.
- **What happened:** The hub regenerates those sections on every start.
- **Rule:** Change the generator, not its output, and say in the docs which sections are owned by code.

### 31. Keep a self-manual in the same commit
- **Problem:** Users ask the agent about itself: permissions, battery, where data comes from.
- **What happened:** Without a source, the agent guessed.
- **Rule:** Keep a factual self-manual the agent can search, one self-contained section per topic, and update it in the same commit that changes settings, permissions, collection, or capability boundaries.

### 32. Notify once
- **Problem:** Deploy and quota notifications repeated.
- **What happened:** The user got the same message several times per event and started ignoring them.
- **Rule:** Deduplicate notifications by event and tier (one per deploy, one per quota threshold per window), and drop messages the user said they do not want.

### 33. Personal data never enters the repository
- **Problem:** Real messages and health data make convenient test fixtures.
- **What happened:** Nothing leaked, because the rule was kept from day one.
- **Rule:** Deployment directories, keys, memory, and real health, SMS, or mail content stay out of Git and out of fixtures. Write synthetic fixtures from scratch. Review the diff and history before every push.
