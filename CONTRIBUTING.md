# Contributing

Thanks for your interest. This repository holds design notes, lessons, a deploy skill, and a small reference core for a Sidekick-style personal agent on [Cortico](https://github.com/Pal-AI-Lab/Cortico).

## What fits here

- Corrections and clarifications to the design notes and lessons.
- New lessons, written as **problem → what happened → rule**, generalized so they help someone with different devices.
- Improvements to the deploy skill that make it more accurate against the current Cortico release.
- Small, dependency-free changes to `core/` that make a pattern clearer, with a test.

Device adapters, apps, and deployment tooling for a specific setup belong in your own repository.

## How

1. Use Node.js 22+. Run `npm test` and `npm run demo`; both must pass.
2. Write English first and update the matching `*.zh-CN.md` file. If you cannot write Chinese, say so in the pull request and a maintainer will sync it.
3. Keep fixtures synthetic. Never include personal data, credentials, hostnames, IP addresses, or screenshots of a real instance.
4. Keep commits focused, with a short imperative subject line.

By contributing you agree that your contribution is licensed under the [MIT License](LICENSE).
