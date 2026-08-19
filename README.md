# Codex OpenClaw Bridge

Codex OpenClaw Bridge is a thin, Windows-native Discord interface for a normal
local Codex installation. It is being built so Brian can collaborate with
Codex and OpenClaw colleagues in private Discord channels and threads while
retaining an independent Windows-side recovery path when OpenClaw or WSL is
unavailable.

## Status

The v0.1 specification is frozen and implementation is in progress. The
current branch is a Phase 2 foundation and is **not ready for Discord
credentials or normal operation yet**.

The implementation source of truth is:

- [`docs/SPEC-v0.1.md`](docs/SPEC-v0.1.md)
- [`docs/PROJECT-CONTEXT.md`](docs/PROJECT-CONTEXT.md)
- [`docs/DECISIONS.md`](docs/DECISIONS.md)
- [`docs/UPSTREAM-REVIEW-v0.1.md`](docs/UPSTREAM-REVIEW-v0.1.md)

## Design boundary

The Bridge is Discord plumbing, not another agent framework. Native Codex
remains the agent and retains its normal authentication, tools, sessions, and
history. v0.1 does not add a persona system, memory platform, workflow engine,
custom scheduler, transcript database, Docker runtime, Windows service
account, or Windows Task Scheduler job.

The application runs under Brian's normal Windows account. Its Windows tray
uses the current-user Run registry key for optional login startup.

## Borrowed foundation

This repository is a fork of
[`chadingTV/codex-discord`](https://github.com/chadingTV/codex-discord). The
fork retains its useful Discord, Codex App Server, session, approval,
attachment, history, queue, and Windows tray foundations. See [`NOTICE.md`](NOTICE.md)
and [`LICENSE`](LICENSE) for attribution and license terms.

The Phase 1 review found several behaviors that must be changed before v0.1 is
operational, including bot-authored message handling, Discord thread context,
STOP/RESUME governance, autonomous-loop controls, runbook-bounded authority,
and native-history safety. Those changes remain governed by the frozen
specification rather than by upstream defaults.

## Development baseline

- Windows-native runtime
- Node.js 22 or newer; Node.js 24 is the verified host target
- npm
- Git
- An authenticated native Codex CLI

Validation commands:

```powershell
npm ci
npm test
npm run build
npm audit --omit=dev
```

Do not place a Discord token in source, documentation, chat, or Git. When the
Discord setup phase begins, the token belongs only in the ignored local
`.env`, which normal upgrades must preserve.

## Repository

[`615Works-org/codex-openclaw-bridge`](https://github.com/615Works-org/codex-openclaw-bridge)
