# Sidekick design notes

English · [简体中文](design.zh-CN.md)

## The smallest stable core, the widest changeable edge

The valuable part is not making the agent talk more. It is letting the agent see changes with the right permissions, remember decisions, hand off work it cannot finish, and explain where things are stuck when the user asks. The model judges and phrases; code enforces authentication, state transitions, idempotency, and permissions. Keeping "the owner changes the source with a strong coding model" does not mean the running agent may change its own configuration, install tools, or ship releases. Start with changes that have a regression scenario: let a coding model propose the patch, let a human review the change, and authorize high-risk actions separately.

## Worlds: events and tools are separate

A World is a replaceable capability boundary. Its ingress authenticates, limits size, and validates types first, then turns each item into an event with a stable ID, a source, and a wake policy. Live state goes into a queryable snapshot instead of pushing every change into the model. Event bodies are third-party data, not model instructions; tools go through their own permission checks. Separating source tags from model input helps against confusion but is not injection-proof: tool permissions and arguments must still be validated in code before execution.

`core/world.mjs` only routes, copies data, and adds the trust tag. Adapters validate the raw payload and source first; `accept` does atomic deduplication and enqueueing, and the demo uses an in-process set rather than a reliable queue. When you connect real devices, retest screen-on, screen-off, and network reconnect separately: a foreground service can still be frozen by the OS, and an existing connection object does not mean bytes arrive in time. Recovery should rebuild the connection, replay from a cursor, and deduplicate; it must not depend on restarting the UI.

## A million tokens is a ceiling, not the everyday prompt

Treat 1M tokens as the design ceiling of long-context models, not a size that must stay resident, a cache-hit guarantee, or a Sidekick benchmark. Keep the system segment, tool declarations, and history order stable; append new messages instead of rewriting the prefix; leave high-frequency raw events in intake. Reuse depends on the same endpoint, model, and actual serialized bytes; switching models, changing a tool schema, or a provider evicting its cache can all cause a cold start. Do not treat a periodic ping as a general keep-alive: whether to use one depends on the provider's policy, real cached input, time to first token, cost, and full fallback. At a soft watermark, write a handoff note; at a hard watermark, start a new session. Durable memory must not depend on cache lifetime.

## Nightly Dream and hybrid recall

The original system treats nightly consolidation as a maintenance job: first archive everything with a queryable reference, then merge duplicates and update stale information. Long-term facts, rules, and open items must be kept, and no new rules may be invented from historical text. Consolidation races with new daytime memories and task changes, so the commit compares both the memory revision and the task state; on conflict, reread and redo rather than overwrite the latest content. `consolidate` in `core/memory.mjs` demonstrates archive-then-CAS with an injectable store; a production store must compare both revisions in one atomic operation, and no write is allowed if archiving fails.

Recall authorizes first, then queries. Lexical search is good at exact terms and identifiers; semantic search finds the same topic phrased differently. Rank the two authorized candidate lists separately, fuse them with reciprocal rank fusion on the same stable reference, then cap the count and the injection budget. If the semantic backend is unavailable, lexical results alone are fine. The example only implements fusion; it does not create vectors or build an index. Post-filtering is a safety net, not a permission boundary: unauthorized documents should never reach the index query or an external vector service.

## `fastReply` while busy: the hot branch borrows context, not write access

When the main loop is already running, an eligible pure question is held instead of being pushed straight into the main queue. The original system starts from a snapshot of the main session's next request, keeps tool declaration order, closes in-flight tool calls with placeholder receipts, and appends the question. If the branch uses a different model, it can use a trimmed context, but do not promise a prefix hit on the main model. The branch may only run tools that are declared and truly read-only; the send action is caught by the host instead of executing as a real tool call. When a write is needed, an error happens, time runs out, or the main loop becomes idle, the branch hands the original message back. If it does answer, the chat front door sends the answer; the main loop later sees a tagged record but does not answer the same question again.

`core/fast-reply.mjs` shows prefix copying, separation of declarations from handlers, read-only execution, a round limit, and cancellation. It does not implement provider serialization, the tool-receipt protocol, or the message queue; those belong to the host. When wiring it in, arbitrate message ownership serially, allow exactly one outlet, and make tools honor cancellation. Tool labels must be declared by trusted code; read-only handlers should still use physically read-only access, and cancellation cannot forcibly stop an external request that does not cooperate.

## Task ledger: execution finished is not acceptance finished

In the original system, the chat hub owns tasks and runs; state is not preserved by the secretary retelling it. Executor results are returned verbatim. When the user must decide, the request and its options are recorded, and timeouts are announced by fixed logic rather than waiting for a model summary. A quota pause is `waiting`; it must not be closed as failed or done. After a process restart, reconcile from the ledger and run records; an old run must not overwrite a newer run or a state that was later changed by hand.

`core/tasks.mjs` makes this explicit with a smaller state machine: `pending → dispatched → running`; a question or a quota limit enters `waiting`, which is resumable; delivery enters `review`; only acceptance makes it `done`. Redispatch increments `attempt`, and events must be applied in contiguous `sequence` order within that attempt. The example is not the original table schema and provides no persistence; production wiring should write events and transitions in one transaction and send notifications through a retryable outbox. When transport reorders events, buffer or re-read the missing ones; do not treat a rejected event as consumed. Acceptance events may only come from an actually authorized reviewer.

## Memory shards and multiple bots: isolate data, do not open a group chat

Intake digests high-frequency, sensitive raw input; the secretary sees only useful summaries and dossiers it is authorized to query; task executors get only the brief needed for the task. Roles hold their own sessions, writable memory, and permissions; dossiers can be shared read-only where chosen. This way high-frequency collection does not reshuffle the secretary's hot context, and not every member automatically sees everything. Separate processes are not security isolation; that needs separate credentials, enforced ACLs, auditing, and explicit data flows. For long-term operation, access control and traceability come before the number of roles.

## Model choice

The secretary is the role that talks to the user, reads summaries, and decides what to dispatch. In the author's experience it currently works best on Gemini: compared with Claude Opus 5.5 it generalizes clearly better to situations the prompt never described, and it proactively does things instead of asking for permission twice. He considers it the best model for a personal agent right now. This is one person's daily-use impression, not a benchmark, and it will change as models change.

The other roles are chosen on cost and stability: intake runs on a cheap model with its own fallback chain, separate from the secretary so the two do not break each other's prompt cache; coding work goes to coding agents (Claude Code, Codex, OpenCode, Pi and similar) acting as executors. Every provider sits behind an ordered fallback chain, and a quota error switches to the next provider instead of waiting hours on `Retry-After`. Keep the choice in configuration, not in code.

## Compared with OpenClaw: choose a distribution model, not a straw man

[OpenClaw's architecture](https://docs.openclaw.ai/concepts/architecture) uses a Gateway to connect chat surfaces, clients, and device nodes; its [multi-agent docs](https://docs.openclaw.ai/concepts/multi-agent) describe separate workspaces, sessions, and routing, and its [memory docs](https://docs.openclaw.ai/concepts/memory) describe retrieval and consolidation. It is not missing multi-agent, device, or memory features. Sidekick makes a different trade-off: it models each person's devices, permissions, and work handoffs as Worlds whose source you can change, publishes portable mechanisms, and does not ship a personal deployment as a standard product. If you want to plug into a general ecosystem quickly, look at the Gateway route first; if you are willing to maintain your own and go deep into system boundaries, borrow the patterns here.

## Pitfalls in brief

The full list is in [lessons.md](lessons.md).

- **A large window is not memory.** A full context is expensive and has failure conditions. Write long-term facts into reviewable, recallable storage and cap what gets injected.
- **Not every change is a notification.** Keep the push threshold separate from storage; ordinary events ride along with the next batch, and only events that need a response wake the main loop.
- **Fast reply is not a second main line.** While a tool call is still in flight, do not invent its result, and do not let the branch run writes to "catch up".
- **Do not rely on the model to retell a message.** Store original instructions, execution receipts, and decisions; a summary is an index, not a source of truth.
- **An empty queue does not mean the work is done.** After a crash, reconcile tasks against runs; model retries, quota limits, and acceptance separately; a notification is not a transaction commit.
- **Write sample data from scratch.** Explain the design with synthetic tasks and an independent reference implementation; do not substitute redacted screenshots for data cleanup, and never use real chat history as fixtures.
