---
name: subagents
description: Launch, coordinate, inspect, and resume independent Pi workers with the subagent CLI.
---

# Subagents

Use the `subagent` CLI for delegated Pi workers. It manages stable Pi sessions, detached tmux execution, per-turn output and completion markers, and follow-up turns.

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

* Give each worker a unique name within the parent Pi session. A name cannot be reused.
* Use `launch-next PREFIX` when numbered names must remain unique across branches or compacted history; retain the returned `WORKER` value.
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
subagent launch WORKER [--cwd PATH] [--delay SECONDS] < PROMPT
subagent launch-next PREFIX [--cwd PATH] [--delay SECONDS] < PROMPT
subagent resume WORKER < PROMPT
subagent wait-any WORKER...
subagent wait-all WORKER...
subagent output WORKER
subagent exit-code WORKER
subagent status
subagent open WORKER [--parent SESSION_ID]
subagent cancel WORKER
```

Run `subagent --help` for a summary. `--delay` exists for deterministic orchestration tests; normal workers should not need it.

## Launch

`launch` reads the prompt from stdin, starts turn 1 in detached tmux, and returns immediately:

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
subagent launch-next reviewer <<'EOF'
Perform an independent peer review of the specified target. Do not modify files.
EOF
```

It atomically chooses the lowest unused numbered name. The first call returns `reviewer-1`, followed by `reviewer-2`, and so on. Concurrent branches cannot claim the same name. Always use the exact `WORKER` value returned by the command for waits and resumes.

Workers use the current directory by default. Override it when necessary:

```bash
subagent launch reviewer --cwd /path/to/project <<'EOF'
Review the parser implementation. Do not modify files.
EOF
```

A successful launch prints:

```text
WORKER=reviewer
TURN=1
SESSION_ID=<session-id>
```

Use the worker name with later commands. The session ID is diagnostic information.

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

All turns run in detached tmux. If a bash call waiting on them times out, the worker continues; use `subagent status` and wait for the same worker names again. Do not launch replacements merely because a wait timed out.

Completions remain on disk until consumed, so none are lost. If multiple selected workers finish before the next poll, the directory scan does not guarantee chronological order among those already waiting.

## Follow-up turns

The current turn must be complete and consumed before it can be resumed:

```bash
subagent resume reviewer <<'EOF'
Now inspect the tests and determine whether they cover the problems you found.
EOF

worker="$(subagent wait-any reviewer)"
subagent output "$worker"
```

`resume` creates the next turn, restores the same Pi session in its original working directory, and starts a new tmux session under the worker's deterministic tmux name. It returns immediately and prints the worker name, turn number, and stable Pi session ID.

A resumed Pi process reconstructs conversation history but not process-local memory, open connections, or handles.

## Status, output, inspection, cancellation, and tmux

```bash
subagent status
subagent output reviewer
subagent exit-code reviewer
subagent open reviewer
subagent cancel reviewer
```

`output` and `exit-code` refer to the latest turn. Worker states are:

* `running` — latest turn is active;
* `completed` — latest turn finished but is unconsumed;
* `consumed` — latest completion was claimed by a wait command;
* `cancelled` — cancellation was recorded.

`cancel` stops the worker's tmux session and records a durable `cancelled` completion. A later wait for that worker consumes it normally.

A tmux session exists only while a turn is running. The runner prints the parent prompt with a turn header, then passes Pi's output through `tee`; attaching while active shows both sides of the current turn. When Pi and the runner exit, tmux removes the session naturally. A later resume recreates it under the same deterministic name.

To inspect the full Pi conversation after a turn, run this from the parent project's working directory:

```bash
subagent open reviewer
```

Outside a Pi agent process, `open` finds the worker by its name and the current directory. If multiple parent sessions match, it exits rather than guessing; disambiguate with `subagent open reviewer --parent <PARENT_PI_SESSION_ID>`. If the worker is currently running, `open` warns that the view is a non-live snapshot. Do not submit from the inspection process concurrently with a worker turn.

Opening Pi is interactive and blocks that terminal until it exits. It is for human inspection, not parent-agent orchestration.

## Storage and session isolation

Data is stored outside the project:

```text
~/.pi/agent/subagents/<PARENT_PI_SESSION_ID>/
    sessions/                       # isolated Pi JSONL sessions
    workers/<WORKER>/
        session-id
        pi-session-dir
        cwd
        tmux-name
        latest-turn
        turns/<N>/
            mode
            prompt
            output
            exit                    # completed, not consumed
            done                    # completed, consumed
```

The CLI passes `sessions/` to Pi with `--session-dir`. Subagent conversations therefore do not appear in the parent project's `/resume` picker. Set `SUBAGENT_STATE_DIR` to override the default subagent root.

## Delegation and filesystem safety

Read-only workers can share one working tree. If workers may modify overlapping files, coordinate file ownership or use separate Git worktrees.

Good uses include independent reviews, separate subsystem investigations, implementation plus independent review, competing approaches, and partitioning a large search.

Keep these invariants:

1. One stable Pi session ID and deterministic tmux name per worker; tmux itself exists only during active turns.
2. At most one active Pi process per worker.
3. Every turn produces a durable completion marker.
4. The caller explicitly names the workers whose completions may be consumed.
5. Consuming one completion never loses another.
6. Never use "most recent session" as worker identity.
