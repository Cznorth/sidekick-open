# Release review

English · [简体中文](release-review.zh-CN.md)

This repository is licensed under the [MIT License](../LICENSE), `Copyright (c) 2026 Cznorth`. The license covers the files in this repository only: the design notes, lessons, the deploy skill, the re-written reference core, and the launch material. It does not cover, and this repository does not contain, the original project's deployment scripts, connectors, prompts, chat logs, database exports, Android app, or Windows agent. All sample copy and scenarios are synthetic.

The repository is currently private on GitHub. Changing its visibility is the maintainer's decision and is not part of any automated change.

## Before every push

Review what Git will actually publish (the diff and the history), not just the working tree. In particular check for:

- personal names, real names, emails, phone numbers, chat-app account numbers;
- IP addresses, internal hostnames and domains, server paths, ports tied to a real deployment;
- credentials, tokens, keys, cookies, OAuth files;
- real memories, chat history, attachments, screenshots, health or message content;
- committer metadata (use a neutral author for this repository).

A quick mechanical pass before committing:

```sh
git diff --cached | grep -nE '@|https?://|[0-9]{1,3}(\.[0-9]{1,3}){3}'
```

Every URL that remains should be a public project or documentation link. Re-run the check whenever launch material changes.

## Videos and posts

Videos and social posts use the public architecture and synthetic scenes; never screen-record a private instance. The repository URL `https://github.com/Cznorth/sidekick-open` may be shown on screen and in descriptions.
