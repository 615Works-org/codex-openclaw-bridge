# Codex OpenClaw Bridge — Project Context

Codex OpenClaw Bridge is being built for Brian's Windows NUC. OpenClaw and gbrain run inside WSL on the same computer. The Bridge gives a normal native Codex instance a private Discord presence so Codex can collaborate directly with Brian and his existing OpenClaw AI colleagues.

The Bridge must also preserve a Windows-side recovery path. If OpenClaw is stopped or unhealthy, or WSL is stopped, the Windows-native Bridge and native Codex should remain available. A total Windows-host failure is outside the v0.1 recovery scope.

## Working philosophy

- **AI first:** Codex should perform work itself wherever practical and ask Brian only for genuinely human-required actions such as authentication, secrets, UAC approval, or material decisions.
- **Borrow before build:** begin from the open-source `chadingTV/codex-discord` project, preserve useful upstream functionality, and add only what this use case requires.
- **Full native Codex:** Codex remains the agent and retains its normal installed capabilities. The Bridge is thin Discord plumbing, not a second agent framework.
- **Use existing capabilities first:** prefer native Codex, Discord, OpenClaw/gbrain, and mature open-source functionality before adding adapters or new subsystems.

The intended GitHub home is `615Works-org/codex-openclaw-bridge`.

## Collaboration and governance

Discord is the shared collaboration surface. Private channels and threads are supported, other OpenClaw bots are valid participants, and productive multi-message bot conversations are expected. The Bridge suppresses its own messages, provides a roughly 15-minute autonomous-conversation watchdog and a high emergency ceiling, and gives Brian authoritative `STOP` and `RESUME` control.

Discord conversation alone is not machine authorization. Brian may approve a runbook as a whole; Codex may exercise reasonable judgment inside it without repeated approval, but must escalate material deviations, enlarged scope, unexpected destructive consequences, or inadequately covered situations.

## gbrain daily history

Native Codex scheduling—not Windows Task Scheduler and not a Bridge scheduler—must run a once-daily incremental export when relevant OpenClaw work has occurred since the previous successful export. Native Codex history is the source of truth. The workflow should use gbrain's existing CLI, MCP, or supported import interface, maintain only a last-successful checkpoint, and advance it only after successful ingestion.

## Implementation boundary

The frozen source of truth is `SPEC-v0.1.md`. Implementation starts with a deeper review of `chadingTV/codex-discord`; the default is to fork unless that review finds a material problem. v0.1 should be operated before adding more infrastructure or sophistication.
