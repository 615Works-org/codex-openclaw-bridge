# Codex OpenClaw Bridge — v0.1 Decisions

This file summarizes settled architectural decisions from `SPEC-v0.1.md`. It does not create requirements; the frozen specification remains authoritative.

## Settled decisions

### Product boundary

- Native Codex is the agent. The Bridge is thin Discord plumbing, not an agent, persona, memory system, workflow engine, scheduler, hierarchy, or orchestration platform.
- Native Codex retains its normal installed capabilities and toolset.
- Discord is the shared collaboration surface with Brian and the existing OpenClaw AI colleagues.
- v0.1 favors native capabilities, existing platform capabilities, and borrowed code over new infrastructure.

### Starting point and repository

- Begin by deeply reviewing and then, by default, forking `chadingTV/codex-discord`; selectively reuse instead only if review finds a material problem with a clean fork.
- Name the fork/project `codex-openclaw-bridge`.
- The intended GitHub home is `615Works-org/codex-openclaw-bridge`.
- Preserve useful upstream behavior wherever practical, including Discord connectivity, Codex App Server integration, native authentication, persistent sessions/threads, Windows compatibility, approvals, queues, stop behavior, attachments, and Codex history access.

### Runtime and recovery

- Run as a Windows-native application/process under Brian's normal Windows account.
- Do not run in Docker, WSL, under a dedicated Windows service identity, or on another machine merely for isolation.
- Start automatically with Brian's Windows login.
- The Bridge and Windows-side Codex must remain available when OpenClaw or WSL is stopped or unhealthy; this must be tested.
- Total Windows-host failure is outside v0.1 recovery scope.
- Tailscale is not part of routine Discord communication.

### Credentials

- Store the Discord bot token in a local `.env` that is ignored by Git.
- Never commit, document, paste into ChatGPT, or post the token to Discord.
- Preserve `.env` across normal upgrades and reinstalls; only a permanent purge may remove it.
- Brian creates the Discord bot, retrieves the token, and grants access to desired private Discord areas.

### Discord behavior and identity

- Support mentions, private channels, and threads from day one.
- Rely primarily on Discord permissions rather than adding a parallel Bridge authorization system.
- Understand channel, thread, author, message ID, reply target, and mentions.
- Ignore the Bridge's own messages, but do not globally ignore other bot-authored messages.
- Derive identity and routing dynamically from current Discord context rather than requiring a giant static bot map.
- Allow useful multi-message bot-to-bot discussions without a low arbitrary turn limit.

### Loop and emergency governance

- Prevent self-echo.
- Pause and surface an uninterrupted autonomous bot exchange after an initial target of approximately 15 minutes without Brian participating; tune after real use.
- Maintain a deliberately high consecutive autonomous-message ceiling only as a catastrophic runaway safeguard.
- Brian's `@Codex STOP` is authoritative, acts at or near the transport layer, stops further Bridge messages and autonomous exchange, interrupts active Codex work when feasible, records the command, and remains paused until deliberate `@Codex RESUME`.

### Approved-runbook authority

- Discord communication alone is not machine authorization.
- Brian may approve an entire runbook; all actions inside that runbook are then authorized without repeated approval merely because they change the machine.
- Codex may collaborate, challenge recommendations, resolve normal questions, and exercise reasonable judgment inside the approved plan.
- Escalate material deviations, material scope enlargement, unexpected destructive consequences, inadequately covered situations, and proposed deviations that deserve Brian's decision.
- Native Codex, Windows, and OS security prompts remain independent of runbook governance.

### History, logging, and gbrain

- Do not build a custom audit platform or duplicate complete conversations for logging. Use native Codex history/state plus minimal Bridge troubleshooting diagnostics.
- Native Codex history/session data is the source of truth for gbrain; do not create a second transcript database.
- Once daily, if relevant OpenClaw work has occurred since the previous successful export, export the new relevant history to gbrain.
- Use native Codex scheduling/automation. Do not use Windows Task Scheduler or build a scheduler into the Bridge.
- Inspect the installed gbrain before implementation and prefer its existing CLI, MCP interface, or supported import mechanism. A small formatting adapter is acceptable if necessary.
- Keep only minimal synchronization state such as the last successful checkpoint. Advance it only after successful ingestion; if gbrain or WSL is unavailable, leave it unchanged so a later run catches up.

### Explicit v0.1 exclusions

- No new persona, memory system, vector database, workflow engine, custom scheduler, Windows Task Scheduler, Docker, Windows service account, Windows Credential Manager integration, bespoke audit database, giant static Discord identity map, low bot turn limit, Discord shell-command interface, project-specific custom MCP architecture, cross-server Discord administration, voice interface, elaborate slash-command platform, or second OpenClaw-like agent household without demonstrated need.
- No special `AGENTS.md` or equivalent persona file is required for Codex participation.

## Implementation details still to be determined

These choices are intentionally left for inspection or implementation and must not be mistaken for settled architecture:

- Whether upstream can be cleanly forked or source must be selectively reused, if deep review reveals a material problem.
- The exact high emergency ceiling for consecutive autonomous messages.
- Any tuning of the approximately 15-minute autonomous-exchange watchdog after real-world use.
- How OpenClaw bot routing or wake behavior must be adjusted, if real Discord testing demonstrates a need.
- The exact gbrain export representation.
- Which existing gbrain ingestion interface is available on Brian's installation and whether a small formatting adapter is needed.
- The concrete Windows login auto-start mechanism.
- The detailed implementation of transport-layer STOP and technically feasible Codex interruption.
