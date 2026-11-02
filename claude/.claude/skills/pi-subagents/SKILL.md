---
name: pi-subagents
description: Delegate to Pi CLI workers (`subagent`). Only when the user explicitly asks for Pi subagents; otherwise use the Agent tool.
---

Read and follow `~/.pi/agent/skills/subagents.md`.

In Claude Code, run `subagent wait-any`/`wait-all` with Bash `run_in_background` so you are notified on completion instead of blocking.

A SessionStart hook (`~/.claude/pi-subagent-env.sh`) sets `PI_SESSION_ID` and puts `subagent` on `PATH`. If either is missing, the hook did not run; say so rather than inventing a session ID.
