---
name: subagents
description: Launch, coordinate, inspect, and resume independent Pi workers with the subagent CLI.
---

# Subagents

Use the `subagent` CLI for delegated Pi workers. It manages stable Pi sessions, detached background turns, per-turn output and completion markers, and follow-up turns.

## Typical workflow

```bash
subagent launch reviewer <<'EOF'
Review the parser for correctness problems. Do not modify files. Report concrete findings with file references.
EOF

worker="$(subagent wait-any reviewer)"
subagent output "$worker"

subagent resume reviewer <<'EOF'
Reread the relevant files and reconsider your findings given this new information: ...
EOF

worker="$(subagent wait-any reviewer)"
subagent output "$worker"
```

`launch` and `resume` return immediately. Only `wait-any` and `wait-all` block.

No run needs to be created or carried between bash calls. Workers are automatically scoped to the parent agent's `PI_SESSION_ID`.

## Rules

* Give each worker a unique name within the parent Pi session, using letters, digits, `_`, and `-`. A name cannot be reused.
* Use `launch-next PREFIX` when numbered names must remain unique across branches or compacted history; use the worker name it prints.
* Never run two turns against the same worker simultaneously.
* Consume a worker's current completion before resuming it.
* Always pass the intended worker names to `wait-any` or `wait-all`; the caller owns the wait set.
* Prefer `subagent resume WORKER` for follow-ups. Do not look up session IDs manually or use `pi -c`.
* Launch independent workers before waiting for them.
* Do not block while the parent still has useful independent work.
* Tell resumed workers to reread files that may have changed.
* Prefer a few substantial workers over many tiny ones. Usually 2–4 is enough.

## Commands

```text
subagent launch WORKER [--cwd PATH] [--provider NAME] [--model MODEL] [--thinking LEVEL] < PROMPT
subagent launch-next PREFIX [--cwd PATH] [--provider NAME] [--model MODEL] [--thinking LEVEL] < PROMPT
subagent resume WORKER [--provider NAME] [--model MODEL] [--thinking LEVEL] < PROMPT
subagent wait-any WORKER...
subagent wait-all WORKER...
subagent output WORKER
subagent exit-code WORKER
subagent status
subagent open WORKER [--parent SESSION_ID]
subagent cancel WORKER
```

## Launch

`launch` reads the prompt from stdin, starts turn 1 in the background, and prints the worker name. Workers inherit the caller's environment.

`--provider`, `--model`, and `--thinking` are passed directly to Pi and accept the same forms as Pi's CLI (`--model PROVIDER/MODEL`, `--model MODEL:LEVEL`, and so on). Pi validates them when the turn starts, so a bad value shows up as a failed turn. When omitted, Pi uses its normal model selection.

For example:

```bash
subagent launch reviewer --model openai-codex/gpt-5.6-luna --thinking xhigh <<'EOF'
Review the implementation and report concrete findings. Do not modify files.
EOF
```

```bash
subagent launch tests <<'EOF'
Inspect the parser tests for important coverage gaps. Do not modify files. Report missing behavioral cases.
EOF

subagent launch design <<'EOF'
Assess whether the parser design can be simplified. Do not modify files. Report only actionable suggestions.
EOF
```

For automatically numbered workers, use `launch-next`:

```bash
worker="$(subagent launch-next reviewer <<'EOF'
Perform an independent peer review of the specified target. Do not modify files.
EOF
)"
```

It atomically chooses the lowest unused numbered name: `reviewer-1`, then `reviewer-2`, and so on. Concurrent branches cannot claim the same name. Always use the exact printed name for waits and resumes.

Workers use the current directory by default. Override it when necessary:

```bash
subagent launch reviewer --cwd /path/to/project <<'EOF'
Review the parser implementation. Do not modify files.
EOF
```

Model and thinking overrides persist in the worker's Pi session for later turns.

A child does not inherit the parent's conversation. Give it enough context to work independently:

* objective;
* relevant files or subsystem;
* constraints;
* whether to modify files or only investigate;
* the result the parent needs.

Point workers at repository files instead of copying large amounts of context.

## Wait for completions

Wait commands require the workers they may consume:

```bash
worker="$(subagent wait-any tests design)"
echo "Completed: $worker (exit $(subagent exit-code "$worker"))"
subagent output "$worker"
```

`wait-any` waits for one selected worker's current turn, atomically moves its `exit` marker to `done`, and prints only that worker's name. It exits with status 1 when every selected completion has already been consumed.

React to one result and wait again when appropriate:

```bash
while worker="$(subagent wait-any tests design)"; do
  echo "Completed: $worker (exit $(subagent exit-code "$worker"))"
  subagent output "$worker"
done
```

If no reaction is needed between selected completions:

```bash
subagent wait-all tests design
```

`wait-all` consumes every selected current completion and prints worker names. It does not print worker output. Workers omitted from the command are never consumed.

Turns run detached from the caller. Killing a wait at any point is safe, so bound long waits with `timeout`, e.g. `timeout 600 subagent wait-any tests design` (exit status 124 means nothing finished in time). The workers continue; check `subagent status` and wait for the same names again. Do not launch replacements merely because a wait timed out.

Completions remain on disk until consumed, so none are missed. If multiple selected workers finish before the next poll, the directory scan does not guarantee chronological order among those already waiting.

## Follow-up turns

The current turn must be complete and consumed before it can be resumed:

```bash
subagent resume reviewer --model anthropic/claude-fable-5 --thinking high <<'EOF'
Now inspect the tests and determine whether they cover the problems you found.
EOF

worker="$(subagent wait-any reviewer)"
subagent output "$worker"
```

`resume` restores the same Pi session in its original working directory, returns immediately, and prints the worker name. Pi reconstructs conversation history but not process-local memory, open connections, or handles.

## Status, output, inspection, and cancellation

```bash
subagent status
subagent output reviewer
subagent exit-code reviewer
subagent open reviewer
subagent cancel reviewer
```

`output` and `exit-code` refer to the latest turn. Worker states are:

* `running` - latest turn is active;
* `completed` - latest turn finished but is unconsumed;
* `consumed` - latest completion was claimed by a wait command;
* `lost` - latest turn's process died without recording a completion (e.g. a reboot). Waits never finish for it; `cancel` it, consume the completion, then resume or relaunch.

`cancel` stops the running turn and records a `cancelled` completion (shown in the EXIT column). Consume it with a wait like any other completion.

`open` launches interactive Pi on the worker's session. It is for human inspection, not parent-agent orchestration.

## Storage

State lives outside the project under `${SUBAGENT_STATE_DIR:-~/.pi/agent/subagents}/<PARENT_PI_SESSION_ID>/`. Worker sessions use a separate Pi session directory, so they do not appear in the parent's `/resume` picker.

## Delegation and filesystem safety

Read-only workers can share one working tree. Workers that edit files can be given separate workspaces (jj) or worktrees (git) via `--cwd`.

Good uses include independent reviews, separate subsystem investigations, implementation plus independent review, competing approaches, and partitioning a large search.
