# Codex OpenClaw Bridge — v0.1 Frozen Specification

**Status:** Frozen for initial implementation  
**Name:** **Codex OpenClaw Bridge**  
**Version:** **v0.1**

The governing principle for v0.1 is:

> **Borrow rather than build. Full native Codex. Thin Discord bridge. Minimal additional infrastructure.**

The purpose is to give a native Codex instance a reliable Discord presence alongside your OpenClaw colleagues, while keeping Codex available as an independent recovery capability if OpenClaw or its WSL environment is unhealthy.

---

## 1. Purpose

Codex OpenClaw Bridge connects:

```text
                    PRIVATE DISCORD
                           │
               Codex OpenClaw Bridge
                thin Windows application
                           │
                           ▼
                     NATIVE CODEX
                           │
             ┌─────────────┼─────────────┐
             │             │             │
          tools         sessions       history
             │             │             │
             └─────────────┼─────────────┘
                           │
                    Windows host
                           │
                          WSL
                     ┌─────┴─────┐
                     │           │
                  OpenClaw     gbrain
```

The Bridge itself is **not an agent**.

Codex is the intelligence.

Discord is the shared collaboration surface.

OpenClaw contains Brian's existing AI colleagues.

---

## 2. Starting codebase

Do **not** build the Discord/Codex integration from scratch.

Initial implementation will start by forking:

**`chadingTV/codex-discord`**

Our fork will be named:

**`codex-openclaw-bridge`**

We will preserve useful upstream functionality wherever practical, including:

- Discord connectivity
- Codex App Server integration
- native Codex authentication
- persistent Codex sessions/threads
- Windows compatibility
- approval handling
- queues
- stop functionality
- attachments
- Codex session/history access

We modify only what our use case actually requires.

Before substantial changes, Codex should perform a deeper review of the upstream implementation.

---

## 3. Runtime environment

The Bridge runs as a **Windows-native application/process under Brian's normal Windows account**.

It will **not** run:

- in Docker
- inside OpenClaw's WSL environment
- under a dedicated Windows service identity
- on another machine merely for isolation

Target arrangement:

```text
BRIAN'S WINDOWS ACCOUNT
│
├── ChatGPT / Codex
│
├── Codex OpenClaw Bridge
│
└── WSL
     ├── OpenClaw
     └── gbrain
```

The Bridge should start automatically with Brian's Windows login.

This preserves the important recovery property:

```text
OpenClaw fails       → Bridge survives
OpenClaw stopped     → Bridge survives
WSL stopped          → Windows-side Bridge survives
```

A total Windows-host failure remains outside the v0.1 recovery scope.

Tailscale may remain available for remote access but is **not part of routine Discord communication**.

---

## 4. Codex is the agent

The Discord interface connects to **Codex**, not ordinary ChatGPT.

Codex should retain the normal capabilities available to the installed Codex environment.

We will **not deliberately restrict Codex's normal toolset** merely because it is being accessed from Discord.

Likewise, we will not recreate capabilities Codex already provides.

No custom:

- personality system
- OpenClaw-style agent persona
- memory framework
- vector database
- workflow engine
- agent hierarchy
- scheduler
- orchestration platform

No special `AGENTS.md` or equivalent persona file is required simply to make Codex participate in the household.

The desired mental model is:

> **A normal, full Codex instance that happens to have a Discord interface.**

---

## 5. Discord credential

The Discord bot token will use a local **`.env` file**.

This intentionally follows the existing upstream project and Brian's existing OpenClaw credential-management pattern.

Example:

```text
DISCORD_BOT_TOKEN=...
DISCORD_GUILD_ID=...
```

Rules:

- `.env` is local only.
- `.env` must be in `.gitignore`.
- The token is never committed to GitHub.
- The token is never pasted into ChatGPT.
- The token is never posted to Discord.
- The token does not belong in documentation or agent files.

Brian will create the bot and retrieve its token once.

That token should remain valid across ordinary Bridge releases:

```text
v0.1 → v0.2 → v0.3
```

Normal upgrade/reinstallation **preserves `.env`**.

A permanent purge may remove the credential, but replacing one Bridge version with another does not.

---

## 6. Discord operating model

The experience should approximate Brian's existing Claude Code Discord workflow.

Brian can bring Codex into a channel or thread by mentioning it:

```text
@Codex
```

Threads are supported from day one.

Private channels are supported.

We rely primarily on Discord's existing permissions to determine which private spaces the bot can access rather than constructing a parallel authorization model inside the Bridge.

The Bridge should understand normal Discord context:

- channel
- thread
- author
- message ID
- reply target
- mentions

---

## 7. OpenClaw bots are valid participants

A key upstream modification is required.

The upstream project currently ignores bot-authored Discord messages. Our fork **must not globally ignore other bots**.

Instead:

```text
Message authored by Codex OpenClaw Bridge itself
→ ignore for input purposes

Message authored by Renfield / Igor / another OpenClaw bot
→ potentially valid Codex input
```

This enables:

```text
Codex → Renfield
Renfield → Codex
Codex → Igor
Igor → Codex
Codex → Renfield
...
```

The purpose of the Bridge is explicitly to allow these conversations.

---

## 8. Identity handling

Do **not** require Brian to maintain a complicated static map of every OpenClaw bot identity across every thread/channel.

The Bridge should derive as much as possible dynamically from the Discord conversation itself:

```text
author
message ID
reply target
thread/channel
mentions
```

When replying, it should use the actual current Discord message/context.

If OpenClaw presents routing or identity differently across contexts, the implementation should adapt to observed Discord behavior rather than require Brian to manually normalize the household.

---

## 9. Multi-message agent collaboration

Bot-to-bot conversational loops are **allowed and desirable**.

A several-message exchange between Codex and one or more OpenClaw colleagues is normal operation.

For example:

```text
Codex:
Why do you recommend migrating X first?

Igor:
Because Y depends on...

Codex:
That appears inconsistent with...

Renfield:
You're both missing Z.

Codex:
Good point. Renfield, would...
```

We will **not** impose a low arbitrary message limit that terminates useful collaboration.

---

## 10. Loop governance

The system should distinguish **productive looping** from **runaway looping**.

### Self-echo prevention

The Bridge must not feed its own Discord output back into Codex as if it were a new external participant.

### Time-based watchdog

If an autonomous bot-to-bot exchange continues for an unusually long uninterrupted period without Brian participating, the Bridge/Codex should pause and surface the current state.

Initial target:

**approximately 15 minutes**

This value is tunable after real-world use.

### Emergency ceiling

There should also be a deliberately high maximum consecutive autonomous-message ceiling.

It exists only as a catastrophic runaway safeguard, not as normal conversational governance.

The specific ceiling may be finalized during implementation.

---

## 11. STOP / RESUME

Brian must have an authoritative emergency control.

For example:

```text
@Codex STOP
```

should immediately cause the Bridge to:

1. Stop initiating further Discord messages.
2. Stop/pause the Bridge-controlled autonomous exchange.
3. Interrupt the active Codex exchange when technically feasible.
4. Record that Brian issued STOP.
5. Remain paused until deliberately resumed.

Resume command:

```text
@Codex RESUME
```

STOP should be implemented at or near the Bridge transport layer so it does not depend solely on Codex reasoning its way into compliance.

---

## 12. Authority and approved runbooks

Discord communication is **not by itself machine authorization**.

However, Brian may explicitly approve an entire runbook.

Once Brian approves a runbook, actions contained in that runbook are authorized.

Example:

```text
Approved OpenClaw Upgrade Runbook

1. Back up configuration.
2. Stop OpenClaw.
3. Run upgrade commands.
4. Modify required configuration.
5. Restart OpenClaw.
6. Execute health checks.
7. Roll back if specified failure conditions occur.
```

Codex does **not** need to return to Brian for approval at steps 2, 3, 4, 5, and 7 merely because those actions change the machine.

Brian's approval applies to the runbook as a whole.

Codex may:

- discuss implementation with OpenClaw colleagues
- challenge their recommendations
- resolve normal implementation questions
- exercise reasonable judgment inside the approved plan

Codex should escalate to Brian when:

- a **material deviation** from the approved runbook is proposed
- the proposed action materially enlarges scope
- an unexpected destructive consequence is discovered
- a situation arises that the runbook doesn't adequately cover
- Codex believes an OpenClaw colleague's proposed deviation deserves Brian's decision

Native Codex, Windows, or OS security prompts remain independent of this governance.

---

## 13. Logging

Do **not** build a custom audit platform for v0.1.

Use:

- native Codex session history
- native Codex activity/history artifacts
- existing Codex state
- minimal Bridge operational diagnostics

Bridge diagnostics only need to support troubleshooting, for example:

```text
Discord connected
Discord disconnected
Discord authentication failed
Codex unavailable
App Server unavailable
message send failed
unexpected exception
```

Do not duplicate entire conversations merely for logging purposes.

---

## 14. gbrain integration

The Bridge/Codex environment must support a **once-daily export of relevant Codex OpenClaw activity to Brian's gbrain**.

Requirement:

> If Codex has performed OpenClaw-related work since the previous successful export, send the new relevant history to gbrain once that day.

This is **not continuous streaming**.

Target behavior:

```text
Monday:
OpenClaw work occurred
→ export

Tuesday:
No OpenClaw work
→ nothing to export

Wednesday:
Codex collaborated with Renfield/Igor
→ export
```

---

## 15. gbrain scheduling must use native Codex capability

Do **not** use Windows Task Scheduler.

Do **not** build a scheduler into the Bridge.

The daily history hook should use **native Codex scheduling/automation capability**.

Conceptually:

```text
Native Codex scheduled workflow
             │
             ▼
Any new relevant OpenClaw history?
       │                │
      NO               YES
       │                │
     finish             ▼
                  collect delta
                       │
                       ▼
                  ingest gbrain
                       │
                       ▼
               advance checkpoint
```

This preserves the overall philosophy:

> If Codex already has the capability, use Codex rather than writing another subsystem.

---

## 16. gbrain history source

Native Codex history/session data is the source of truth.

Do not create a second transcript database solely for gbrain.

The export should include the relevant incremental history necessary for gbrain to understand the OpenClaw work, potentially including:

- Brian's relevant messages
- Codex's relevant responses
- OpenClaw colleague messages received through Discord
- session/thread context
- relevant decisions and conclusions

The exact export representation will depend on the interface supported by Brian's installed gbrain.

---

## 17. gbrain ingestion

Before implementing the export, inspect Brian's actual installed gbrain instance.

Borrow its existing supported interface.

Preferred order:

```text
existing gbrain CLI
or
existing gbrain MCP interface
or
existing supported import mechanism
```

Do **not** design a new gbrain persistence API unless actual inspection demonstrates one is necessary.

A small formatting adapter is acceptable if required.

---

## 18. Incremental gbrain sync

The daily workflow must know what has already been successfully exported.

Only minimal synchronization state is required, such as:

```text
last successful export checkpoint
```

This is bookkeeping, not a new memory platform.

Rules:

- Do not re-import the same history every day.
- Do not advance the checkpoint unless gbrain ingestion succeeds.
- If gbrain or WSL is unavailable, leave the checkpoint unchanged.
- The next successful execution catches up from the previous successful point.

---

## 19. Failure isolation

A key acceptance criterion is that the Bridge provides a recovery path independent from OpenClaw.

Test separately:

### OpenClaw failure

```text
OpenClaw stopped/broken
        │
        ├── Discord Bridge remains available
        └── Codex remains available
```

OpenClaw bots naturally cannot participate while their own runtime is down.

Their absence does **not** constitute failure of the Bridge.

### WSL failure/stoppage

```text
WSL stopped
   │
   ├── Windows Bridge remains running
   └── Windows-side Codex access remains viable
```

We must prove this rather than assume it.

---

## 20. What v0.1 explicitly does **not** include

Do not add without a demonstrated need:

- new AI persona
- new memory system
- new vector database
- new workflow engine
- custom scheduler
- Windows Task Scheduler
- Docker
- Windows service account
- Windows Credential Manager integration
- bespoke audit database
- giant static Discord identity map
- low bot-to-bot turn limits
- shell-command interface embedded directly into Discord
- custom MCP architecture solely for this project
- cross-server Discord administration
- voice interface
- elaborate slash-command platform
- second OpenClaw-like household of agents

---

## 21. Implementation sequence

### Phase 1 — Review upstream

Deep-review `chadingTV/codex-discord`, especially:

- Codex App Server integration
- bot-message filtering
- channel/thread behavior
- session persistence
- approvals
- `/stop`
- Windows launch/startup
- history handling
- dependencies and maintainability

Determine whether we can cleanly fork versus selectively reuse source.

Default assumption remains **fork** unless review uncovers a material problem.

### Phase 2 — Fork and rename

Create:

**`codex-openclaw-bridge`**

Keep upstream behavior where it serves our requirements.

### Phase 3 — Discord setup

Brian:

- creates Discord application/bot
- enables required Discord message/thread capabilities
- retrieves one bot token
- places token in local `.env`
- grants bot access to the desired private Discord areas

Token is not pasted into ChatGPT.

### Phase 4 — Basic Brian ↔ Codex test

Prove:

```text
Brian in Discord
→ Bridge
→ native Codex
→ Bridge
→ Brian in Discord
```

### Phase 5 — OpenClaw bot collaboration

Prove:

```text
Codex
→ @Renfield / @Igor
→ OpenClaw response
→ Codex
→ multi-message discussion
```

Only modify OpenClaw routing/bot-wake settings if the real test demonstrates a need.

### Phase 6 — Governance

Verify:

- own-message suppression
- multi-bot dialogue
- time watchdog
- high runaway ceiling
- STOP
- RESUME
- runbook authority model

### Phase 7 — Recovery

Verify separately:

1. Stop OpenClaw.
2. Bridge stays alive.
3. Codex remains available.
4. Restart OpenClaw.
5. Confirm colleagues return.
6. Perform a Brian-approved recovery drill.
7. Stop WSL separately and verify the Windows-side lifeboat remains viable.

### Phase 8 — gbrain

Inspect the actual gbrain installation.

Configure a **native Codex scheduled workflow** that:

```text
once daily
→ detect relevant new OpenClaw work
→ export incremental Codex history
→ ingest via existing gbrain interface
→ checkpoint only on success
```

No Windows Task Scheduler.

### Phase 9 — Operate before expanding

Use v0.1 in real work.

Only add MCP, richer automation, additional governance, identity management, UI features, or other sophistication when actual usage demonstrates a need.

---

## 22. v0.1 design principle

When an implementation choice arises, use this order of preference:

```text
1. Use existing native Codex capability.
2. Use existing Discord capability.
3. Use existing OpenClaw/gbrain capability.
4. Reuse/fork mature open-source code.
5. Add a small adapter.
6. Build a new subsystem only as a last resort.
```

**Frozen v0.1 summary:**

> **Full native Codex + forked open-source Discord bridge + private Discord collaboration with OpenClaw bots + approved-runbook autonomy + sensible loop/STOP governance + `.env` credentials + native Codex daily gbrain export.**

That is the v0.1 baseline we should implement against unless you explicitly unfreeze or amend the spec.
