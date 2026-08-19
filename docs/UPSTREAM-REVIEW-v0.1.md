# Codex OpenClaw Bridge — Upstream Review v0.1

**Status:** Phase 1 review complete  
**Review date:** 2026-08-19  
**Upstream:** [`chadingTV/codex-discord`](https://github.com/chadingTV/codex-discord)  
**Reviewed commit:** `dc1afb8e81077fc3e0cbac02c13c69a27d573b8b`  
**Governing specification:** `docs/SPEC-v0.1.md`

This report is an implementation handoff, not a change to the frozen specification. If this report and `SPEC-v0.1.md` ever conflict, the frozen specification wins.

## Recommendation

**Fork the upstream repository. Do not selectively transplant it and do not build a greenfield bridge.**

The upstream architecture is a strong match for v0.1: a compact Node/TypeScript Discord application drives the native Codex App Server, retains native Codex authentication and history, maps Discord channels to local project folders, streams responses, handles approvals and questions, stages attachments, and includes Windows launch and tray support. The necessary changes are substantial but concentrated at the Discord ingress, governance, history-safety, and runtime-hardening boundaries. Rebuilding the working core would add risk without improving the frozen design.

No licensing or structural problem prevents a clean fork. The repository license permits modification and distribution but adds a visible attribution requirement. The fork must preserve the license and visibly state that it is based on `codex-discord`, with the upstream URL.

The upstream must **not** be deployed unchanged. The blockers below must be corrected before it is treated as the v0.1 Bridge.

## Verification performed

- Inspected the complete source tree, tests, configuration, install scripts, Windows launcher, and tray implementation.
- Confirmed the review clone remained clean at the reviewed commit.
- On portable Node.js 22.23.2, `npm ci`, the production build, and all 80 tests in 8 test files passed.
- On this host's installed Node.js 24.19.0, `npm ci` failed because locked `better-sqlite3` 11.10.0 has no matching prebuilt Windows binary and fell back to a native build toolchain that is not installed.
- Exercised the upstream App Server client against the installed, logged-in Codex CLI 0.148.0. Initialization, rate-limit reading, and native thread listing succeeded. A live Codex turn was intentionally not created during this read-only review.
- Ran a production-only dependency audit. It reported 5 advisories: 3 high and 2 moderate, affecting `lodash`, `undici`, `ws`, `discord.js`, and `@discordjs/rest`.
- Confirmed Windows login startup uses the current user's `HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run` registry key. It does not use Windows Task Scheduler.

No Discord bot token was used. No OpenClaw, WSL, gbrain, or application code was modified.

## Reusable upstream foundation

Retain and adapt these parts of the fork:

- `discord.js` connectivity, guild command registration, message streaming, and attachment handling.
- Native `codex app-server` integration, native ChatGPT/Codex authentication, thread start/resume, streaming events, turn interruption, questions, and explicit approval/denial UI.
- Native Codex history discovery and the small Discord-channel-to-Codex-thread mapping database.
- Project-folder registration and path containment checks.
- Bounded concurrent-message queueing as a workload control. The queue size is not a bot-conversation turn limit.
- Windows-native launcher and tray behavior, including the per-user registry startup mechanism.
- Local `.env` loading and the existing `.gitignore` treatment of `.env`, databases, uploads, logs, and build output.
- Minimal operational messages and diagnostics rather than a new audit or transcript platform.

Do not add a persona layer, second memory system, workflow engine, custom scheduler, multi-agent framework, second transcript store, or project-specific MCP architecture.

## Material gaps against the frozen specification

| Priority | Area | Upstream behavior | Required v0.1 disposition |
|---|---|---|---|
| Blocker | Other bots | `message.author.bot` causes every bot-authored message to be discarded. | Ignore only the Bridge's own Discord identity. Accept valid OpenClaw bot messages in Discord areas the Bridge can access. |
| Blocker | Authorization and identity | Every accepted author must appear in static `ALLOWED_USER_IDS`; the prompt contains message text but omits author, message ID, reply target, mentions, and thread context. | Keep strong Brian-only control authorization where needed, but derive participant identity and routing from current Discord context. Do not require a static map of OpenClaw bots. |
| Blocker | Channel/thread routing | Project and session lookup uses only the exact `message.channelId`. A thread under a registered channel does not inherit its parent's project mapping. | Resolve a Discord thread to its own registration or its registered parent, and retain the actual thread as the conversation surface. |
| Blocker | Bot collaboration | Busy-session queueing requires a human button click, and there is no autonomous-exchange state. | Permit productive bot replies without a low turn limit while retaining safe backlog control and self-echo suppression. |
| Blocker | STOP/RESUME | Only `/stop` exists. There is no authoritative `@Codex STOP`, no paused state, no `RESUME`, and no STOP record. `stopSession()` calls `finishSession()`, which can immediately launch the next queued prompt. | Intercept Brian's STOP/RESUME at or near Discord ingress. STOP must suppress output, clear or freeze queued autonomous work, interrupt the active turn when feasible, record the event, and remain paused until deliberate RESUME. |
| Blocker | Loop governance | No approximately 15-minute no-Brian watchdog and no high emergency ceiling exist. | Track Brian participation and autonomous exchange activity, pause and surface state at the watchdog threshold, and add the separately configurable high ceiling whose exact value remains an implementation decision. |
| Blocker | Runbook authority | Persistent channel `auto_approve` and “Approve All” accept all Codex approval requests without tying them to an approved runbook. | Preserve explicit native approval UX. Remove or re-scope unbounded auto-approval so authorization cannot exceed Brian's approved runbook. Material deviations must return to Brian; native/OS prompts remain independent. |
| Blocker | Native history safety | Session deletion and `/clear-sessions` write directly to native Codex state databases and delete rollout files. | Do not make destructive native-history deletion the normal Bridge session-reset path. Prefer detaching the Discord mapping or using supported archive behavior; native history remains the gbrain source of truth. |
| Blocker | Runtime support | `engines` claims Node `>=20`, but the lockfile's native SQLite module does not install on this host's Node 24 without an extra compiler toolchain. | Modernize the dependency set or explicitly pin a supported Node line. Prefer compatibility with the installed standard Node runtime rather than adding Python/C++ solely for this package. |
| Blocker | Dependency security | The production audit currently reports 5 advisories, including 3 high severity. | Upgrade compatible production dependencies and regenerate the lockfile; rerun build, tests, and production audit before Discord credentials are introduced. |
| High | App Server protocol | Current read/list calls work with Codex CLI 0.148.0, but the client omits the documented `initialized` acknowledgement, opts into experimental APIs unnecessarily, uses legacy wire values for approval/sandbox settings, and hard-codes a provider and permission posture. | Conform to the current stable App Server protocol, add a protocol contract test, and inherit normal native Codex configuration/capabilities unless the frozen specification explicitly requires an override. |
| High | Recovery robustness | App Server and Discord reconnect/error paths exist only partially, and active in-memory work is not reconciled after process failure. | Verify predictable recovery and truthful status after Discord, App Server, Bridge, and Windows-login restarts without introducing a new orchestration subsystem. |
| High | Test coverage | Existing tests cover utilities, storage helpers, formatting, database operations, and two streaming cases. They do not cover message ingress, bot routing, thread inheritance, STOP/RESUME, queues after STOP, watchdogs, runbook scope, App Server protocol, or recovery. | Add focused unit/contract tests for each frozen behavior and then perform the specified live Discord and recovery tests. |

## Specific implementation boundaries

### Discord ingress and context

The ingress handler is the main adaptation point. Its first decision must distinguish the Bridge's own bot ID from other bots, not treat all bots as equivalent. Before a message becomes Codex input, construct a small factual envelope from Discord's live state: author identity, bot/human status, channel and thread identity, Discord message ID, reply target, and mentions. This is transport context, not a new memory or identity subsystem.

Activation should respect the frozen operating model: mentions and replies in shared private areas, with direct conversation permitted where the dedicated private context is unambiguous. Brian-only governance and machine-authority controls must not become an allowlist that blocks valid OpenClaw participants.

### STOP, RESUME, and autonomous loops

Governance must live outside model reasoning. STOP/RESUME parsing occurs before normal prompt forwarding. A stopped exchange cannot drain its queue or emit delayed streaming edits. The approximately 15-minute watchdog is based on uninterrupted autonomous activity without Brian participating, not on the total age of a normal human-led task. The high emergency ceiling is a separate backstop and its initial numeric value remains open under the frozen specification.

The upstream queue maximum of five pending prompts is acceptable as concurrent backlog protection; it must not be misused as the conversational loop ceiling.

### Approved runbooks

The useful upstream approval cards can remain for native Codex approval requests, but persistent channel-wide auto-approval cannot represent approved-runbook authority. v0.1 should start conservatively: retain approve/deny decisions and remove or disable unbounded “Approve All” behavior until it can be scoped to Brian's explicit runbook without inventing a workflow engine. The Bridge records only the minimal governance state needed to enforce the approved scope.

### Native Codex and history

The Bridge should use the App Server's supported thread APIs and native Codex history rather than editing Codex's state database directly. A Discord “new session” operation should normally detach or replace the channel mapping, leaving native history intact. This preserves normal Codex continuity and the later gbrain export source.

The [official OpenAI App Server documentation](https://learn.chatgpt.com/docs/app-server) confirms that thread start/resume, event streaming, approvals, and `turn/interrupt` are appropriate primitives for this integration. It also documents a stable API surface and optional permission/profile fields. The fork should not enable experimental APIs or hard-code a reduced tool posture without a demonstrated need.

### Windows runtime and startup

The upstream Windows approach is reusable and satisfies the “no Windows Task Scheduler” decision: it runs under Brian's account and uses the per-user Run registry key. During implementation, rename process/executable labels and verify that login startup actually launches the Bridge, survives WSL being stopped, and preserves `.env` through the fork's normal update path.

Do not add Docker, a Windows service account, or a second machine. Do not install a native compiler toolchain merely to preserve the old SQLite dependency if a compatible package update resolves Node 24 support.

## Implementation sequence

1. **Phase 2 — Fork and baseline hardening.** Fork the reviewed commit into `615Works-org/codex-openclaw-bridge`, retain an `upstream` remote, preserve visible attribution, rename product identifiers, update dependencies/runtime compatibility, and make the App Server client conform to the current stable protocol. Establish a green build/test/audit baseline before adding credentials.
2. **Phase 3 — Discord setup.** Brian performs only the human-required bot creation, token retrieval, privileged-intent enablement, and private-area permissions. Store the token only in the ignored local `.env`.
3. **Phase 4 — Brian ↔ Codex path.** Verify a normal native Codex thread through Discord, mentions/replies, attachments, explicit approvals, session continuity, and parent-channel/thread routing. Confirm native Codex tools are not deliberately reduced.
4. **Phase 5 — OpenClaw bot collaboration.** Implement self-only echo suppression, dynamic Discord context, and bot participation; test with one real OpenClaw colleague. Modify OpenClaw routing only if the live test demonstrates a need.
5. **Phase 6 — Governance.** Implement and test authoritative STOP/RESUME, queue suppression, active-turn interruption, watchdog, emergency ceiling, and runbook-bounded authority.
6. **Phase 7 — Recovery.** Verify Bridge/Codex availability with OpenClaw stopped, then with WSL stopped, plus Discord/App Server/Bridge restart behavior and Windows-login auto-start.
7. **Phase 8 — gbrain.** Inspect the installed gbrain only at this phase. Build the daily incremental history export as a native Codex scheduled task, not a Bridge scheduler and not Windows Task Scheduler. Advance only the last-successful checkpoint after confirmed ingestion.
8. **Phase 9 — Operate before expanding.** Run v0.1 and add infrastructure only in response to observed need.

## Required test additions before acceptance

- Other-bot message accepted; Bridge's own message ignored.
- Human and bot identity/context envelope contains author, message ID, reply target, mentions, and actual thread.
- Registered parent channel works from a Discord thread without a duplicate static bot map.
- Bot-to-bot multi-message exchange continues productively and does not self-echo.
- Brian participation resets the autonomous watchdog; an uninterrupted autonomous exchange pauses at approximately 15 minutes.
- Emergency ceiling pauses independently of the watchdog.
- `@Codex STOP` wins over normal input, prevents queued work from starting, suppresses later output, interrupts when feasible, and remains paused.
- `@Codex RESUME` deliberately clears the paused state.
- A runbook-approved action does not prompt merely because it changes the machine, while a material deviation does return to Brian; native/OS approvals still behave normally.
- New/reset Discord session does not delete native Codex history.
- Current supported Node install, production build, tests, and production-only audit are clean enough for operation.
- App Server initialization, thread start/resume, streamed turn, approval request, question request, interruption, and restart are contract-tested against the installed Codex CLI.
- Bridge remains usable with OpenClaw stopped and with WSL stopped.
- Windows login startup works under Brian's account and does not use Task Scheduler.

## Phase 1 conclusion

The deeper review did **not** uncover a material reason to abandon the fork. Phase 1 is complete, and the frozen default decision is confirmed: proceed with a clean, attributed fork, then harden and adapt it in the order above.
