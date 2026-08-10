---
name: subagents
description: Launch, coordinate, inspect, and resume independent Pi workers with the subagent CLI.
---

# Subagents

Use the `subagent` CLI for delegated Pi workers. It handles session IDs, detached tmux processes, output capture, completion markers, and follow-up turns.

## Typical workflow

```bash
subagent launch reviewer <<'EOF'
Review the parser for correctness problems. Do not modify files. Report concrete findings with file references.
EOF

worker="$(subagent wait-any)"
subagent output "$worker"

subagent resume reviewer <<'EOF'
Reread the relevant files and reconsider your findings in light of this new information: ...
EOF
```

No run needs to be created or carried between bash calls. The CLI scopes workers automatically to the parent agent's `PI_SESSION_ID`.

## Rules

* Give each worker a unique name within the parent Pi session. A name cannot be reused.
* Never run two processes against the same worker session simultaneously.
* Prefer `subagent resume WORKER` for follow-ups. Do not look up session IDs manually or use `pi -c`.
* Launch independent workers before waiting for them.
* Do not block while the parent still has useful independent work.
* Tell resumed workers to reread files that may have changed.
* Prefer a few substantial workers over many tiny ones. Usually 2–4 is enough.

## Commands

```text
subagent launch WORKER [--cwd PATH] [--delay SECONDS] < PROMPT
subagent resume WORKER < PROMPT
subagent wait-any
subagent wait-all
subagent output WORKER
subagent exit-code WORKER
subagent status
subagent cancel WORKER
```

Run `subagent --help` for a summary. `--delay` exists for deterministic orchestration tests; normal workers should not need it.

## Launch

`launch` reads the prompt from stdin, starts the worker in detached tmux, and returns immediately:

```bash
subagent launch tests <<'EOF'
Inspect the parser tests for important coverage gaps. Do not modify files. Report missing behavioral cases.
EOF

subagent launch design <<'EOF'
Assess whether the parser design can be simplified. Do not modify files. Report only actionable suggestions.
EOF
```

Workers use the current directory by default. Override it when necessary:

```bash
subagent launch reviewer --cwd /path/to/project <<'EOF'
Review the parser implementation. Do not modify files.
EOF
```

A successful launch prints:

```text
WORKER=reviewer
SESSION_ID=<session-id>
```

The session ID is diagnostic information. Use the worker name with later CLI commands.

A child does not inherit the parent's conversation. Give it enough context to work independently:

* objective;
* relevant files or subsystem;
* constraints;
* whether to modify files or only investigate;
* the result the parent needs.

Point workers at repository files instead of copying large amounts of context.

## Collect completions

Wait for one unseen initial completion:

```bash
worker="$(subagent wait-any)"
echo "Completed: $worker (exit $(subagent exit-code "$worker"))"
subagent output "$worker"
```

`wait-any` atomically claims one completion by moving its `exit` marker to `done`, then prints only the worker name. It blocks while workers are running and exits with status 1 when every completion has already been consumed.

React to the result, then wait again:

```bash
while worker="$(subagent wait-any)"; do
  echo "Completed: $worker (exit $(subagent exit-code "$worker"))"
  subagent output "$worker"
done
```

If no reaction is needed between completions:

```bash
subagent wait-all
```

`wait-all` consumes every remaining initial completion and prints worker names. It does not print worker output.

Completions remain on disk until consumed, so none are lost. If multiple workers finish before the next poll, the directory scan does not guarantee chronological order among those already waiting.

## Follow-up turns

Use `resume` as the default path:

```bash
subagent resume reviewer <<'EOF'
Now inspect the tests and determine whether they cover the problems you found.
EOF
```

`resume` restores the worker's Pi session in its original working directory and streams the response directly to the parent. The initial detached turn must already be complete.

A resumed process reconstructs conversation history but not process-local memory, open connections, or handles. Resumed turns are not written to the worker's initial `output`, `exit`, or `done` files.

## Status, output, and cancellation

```bash
subagent status
subagent output reviewer
subagent exit-code reviewer
subagent cancel reviewer
```

Worker states are:

* `running` — initial turn is active;
* `completed` — initial turn finished but is unconsumed;
* `consumed` — completion was claimed by a wait command;
* `cancelled` — cancellation was recorded.

`cancel` stops the worker's tmux session and records a durable `cancelled` completion. A later `wait-any` or `wait-all` consumes it normally.

To inspect a running worker's tmux pane:

```bash
subagent_root="${SUBAGENT_STATE_DIR:-$HOME/.pi/agent/subagents}"
parent_dir="$subagent_root/$PI_SESSION_ID"
tmux_name="$(cat "$parent_dir/workers/$worker/tmux-name")"
tmux capture-pane -p -t "$tmux_name" -S -200
```

Attach only when interactive inspection is useful:

```bash
tmux attach -t "$tmux_name"
```

## Storage and session isolation

Data is stored outside the project:

```text
~/.pi/agent/subagents/<PARENT_PI_SESSION_ID>/
    sessions/                   # isolated Pi JSONL sessions
    workers/<WORKER>/
        session-id
        pi-session-dir
        cwd
        prompt
        output                  # initial turn only
        tmux-name
        exit                    # completed, not consumed
        done                    # completed, consumed
```

The CLI passes `sessions/` to Pi with `--session-dir`. Subagent conversations therefore do not appear in the parent project's `/resume` picker. Set `SUBAGENT_STATE_DIR` to override the default subagent root.

## Delegation and filesystem safety

Read-only workers can share one working tree. If workers may modify overlapping files, coordinate file ownership or use separate Git worktrees.

Good uses include independent reviews, separate subsystem investigations, implementation plus independent review, competing approaches, and partitioning a large search.

Keep these invariants:

1. One stable Pi session ID per worker.
2. At most one active Pi process per worker session.
3. Detached initial turns produce a durable completion marker.
4. Consuming one completion never loses another.
5. Never use "most recent session" as worker identity.
