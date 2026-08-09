---
name: subagents
description: Launch, coordinate, wait for, inspect, and resume independent Pi subagents using the subagent CLI.
---

# Subagents

Use the `subagent` CLI for parallel workers. It manages stable Pi session IDs, detached tmux processes, captured output, and durable completion markers under `.pi/subagents/`.

A worker is a stable Pi session, not a Pi process. The process exits after its turn; the session ID remains available for a later resume.

## Rules

* Give each logical worker a unique name within its run.
* Never run two Pi processes against the same worker session simultaneously.
* Never use `pi -c` for subagents; "latest session" is ambiguous.
* Shell variables do not persist across separate bash tool calls. Keep the printed run path in agent context and use that literal path in later calls.
* Completion state lives on disk, not in tmux or shell state.
* A resumed worker sees the filesystem as it exists now. Tell it to reread files that may have changed.
* Prefer a few substantial workers over many tiny ones. Usually 2–4 is enough.

## CLI

```text
subagent create [--cwd PATH]
subagent launch RUN WORKER [--delay SECONDS] < PROMPT
subagent wait-any RUN
subagent wait-all RUN
subagent output RUN WORKER
subagent exit-code RUN WORKER
subagent status RUN
subagent cancel RUN WORKER
```

Run `subagent --help` for the full command summary.

## One worker

When there is only one worker and the parent has no independent work, a direct blocking Pi call is simplest:

```bash
sid="$(uuidgen | tr '[:upper:]' '[:lower:]')"
printf '%s\n' \
  'Review the parser implementation. Report concrete correctness problems; do not modify files.' |
  pi --session-id "$sid" --name subagent:reviewer -p
```

First use of a new session ID may warn that no project session was found and a new one is being created. This is expected.

Use the CLI when durable output, cancellation, or the same orchestration shape as parallel work is useful even for one worker.

## Parallel workers

Create a run:

```bash
run="$(subagent create)"
printf 'RUN=%s\n' "$run"
```

`create` uses the current directory as the workers' working directory. Use `subagent create --cwd PATH` to choose another.

Launch workers. Prompts are read from stdin, and `launch` returns immediately after starting detached tmux:

```bash
subagent launch "$run" reviewer <<'EOF'
Review the parser for correctness problems. Do not modify files. Report concrete findings with file references.
EOF

subagent launch "$run" tests <<'EOF'
Inspect parser tests for important coverage gaps. Do not modify files. Report missing behavioral cases.
EOF

subagent launch "$run" design <<'EOF'
Independently assess whether the parser design can be simplified. Do not modify files. Report only actionable suggestions.
EOF
```

For a later bash tool call, assign the literal path printed by `create`; do not assume `$run` survived:

```bash
run="/absolute/path/to/.pi/subagents/<run-id>"
subagent status "$run"
```

The child does not inherit the parent's conversation. Every prompt should include:

* the objective;
* relevant files or subsystem;
* important constraints;
* whether to modify files or only investigate;
* the result the parent needs.

Point workers at repository files instead of copying large context.

## Wait for completions

Wait for exactly one unseen completion:

```bash
worker="$(subagent wait-any "$run")"
rc="$(subagent exit-code "$run" "$worker")"
subagent output "$run" "$worker"
```

`wait-any` blocks while workers are running. It atomically claims one completion by moving its `exit` marker to `done`, then prints only the worker name. It exits with status 1 when all completions have already been consumed.

React to the result, then call `wait-any` again. Do not block while the parent still has useful independent work.

A typical loop is:

```bash
while worker="$(subagent wait-any "$run")"; do
  printf 'Completed: %s (exit %s)\n' \
    "$worker" "$(subagent exit-code "$run" "$worker")"
  subagent output "$run" "$worker"
done
```

If the parent does not need to react between completions, consume every remaining completion:

```bash
subagent wait-all "$run"
```

`wait-all` prints worker names as they are consumed. It is a convenience around repeated `wait-any` calls; it does not print worker output.

If several workers complete before the next poll, each completion remains durable and will be returned by a later wait. The simple directory scan guarantees no loss, but does not promise strict chronological ordering among completions already waiting at the same time.

## Inspect results and state

```bash
subagent status "$run"
subagent output "$run" reviewer
subagent exit-code "$run" reviewer
```

States are:

* `running`: no completion marker yet;
* `completed`: `exit` exists but has not been consumed;
* `consumed`: `exit` was moved to `done`;
* `cancelled`: cancellation was recorded.

A worker's files live at:

```text
RUN/workers/WORKER/
    session-id
    prompt
    output
    tmux-name
    exit        # completed, not consumed
    done        # completed, consumed
```

To inspect a running worker's tmux pane:

```bash
tmux_name="$(cat "$run/workers/$worker/tmux-name")"
tmux capture-pane -p -t "$tmux_name" -S -200
```

Attach only when interactive inspection is useful:

```bash
tmux attach -t "$tmux_name"
```

## Cancel

```bash
subagent cancel "$run" "$worker"
```

This stops the worker's tmux session and writes a durable `cancelled` completion. Consume it with `wait-any` or `wait-all` like any other completion.

## Resume a worker

The CLI currently manages initial detached turns. Resume a completed worker directly from its saved session ID:

```bash
sid="$(cat "$run/workers/$worker/session-id")"
printf '%s\n' \
  'Reread any relevant files, then reconsider your conclusion given this new information: ...' |
  pi --session "$sid" -p
```

Do not resume until the prior process for that worker has exited. A resumed process reconstructs conversation state, but it does not resurrect process-local memory, connections, or handles. This direct resumed turn is not added back to the run's `exit`/`done` accounting.

## Shared filesystem

Read-only workers can share one working tree. If workers may modify overlapping files, coordinate file ownership or use separate Git worktrees.

Good delegation patterns include:

* independent reviews;
* separate subsystem investigations;
* implementation plus independent review;
* competing approaches;
* partitioning a large search.

## Invariants

1. One stable session ID per logical worker.
2. At most one active Pi process per session.
3. Detached turns produce a durable `exit` marker; cancellation records an explicit equivalent.
4. `exit → done` means one completion was consumed.
5. Waiting for one worker never loses other completions.
6. Resumed workers reread potentially stale filesystem state.
7. Never use "most recent session" as worker identity.
