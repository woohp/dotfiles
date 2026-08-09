---
name: subagents
description: Launch, coordinate, wait for, inspect, and resume independent Pi subagents using bash and tmux.
---

# Subagents

Use independent `pi` processes as subagents. No extension required.

A worker = a stable Pi session, not a Pi process. The process can exit after each turn; resume the same worker later with its session ID.

## Rules

* One worker, no useful parallel work: run `pi -p` directly and let bash block.
* Multiple workers: run each in detached tmux.
* Give every worker its own session ID with `--session-id`.
* Resume with `pi --session <id>`.
* Never use `pi -c` for subagents; "latest session" is ambiguous.
* Never run two Pi processes against the same session at once.
* Store completion state on disk. Do not rely on tmux existence.
* A resumed worker sees the filesystem as it exists now. Reread files that may have changed.
* Prefer a few substantial workers over many tiny ones.

## One worker

No tmux needed:

```bash
sid="$(uuidgen | tr '[:upper:]' '[:lower:]')"

printf '%s\n' \
  'Review the parser implementation. Find correctness problems and report concrete fixes.' |
  pi --session-id "$sid" --name subagent:reviewer -p
```

Bash blocks until Pi exits.

Continue the same worker later:

```bash
printf '%s\n' \
  'Now inspect the tests and see whether they cover the problems you found.' |
  pi --session "$sid" -p
```

The new Pi process restores the previous session. Conversation survives; process-local memory, open connections, and handles do not.

## Parallel workers

Create one directory per delegation run:

```bash
run="$(date +%Y%m%d-%H%M%S)-$$"
root="$PWD/.pi/subagents/$run"
mkdir -p "$root"
```

Each worker gets:

```text
<worker>/
    session-id
    prompt
    output
    exit
    done
```

`exit` means finished but not yet consumed.
`done` means the parent already consumed that completion.

For each worker:

```bash
worker=reviewer
dir="$root/$worker"
sid="$(uuidgen | tr '[:upper:]' '[:lower:]')"

mkdir -p "$dir"
printf '%s\n' "$sid" > "$dir/session-id"
printf '%s\n' "$prompt" > "$dir/prompt"
```

Create a small runner. This avoids nested tmux/shell quoting:

```bash
cat > "$dir/run.sh" <<'EOF'
#!/usr/bin/env bash
set +e

dir="$(cd "$(dirname "$0")" && pwd)"
sid="$(cat "$dir/session-id")"

cd "$SUBAGENT_CWD" || exit 125

cat "$dir/prompt" |
  pi --session-id "$sid" --name "subagent:$SUBAGENT_NAME" -p \
  >"$dir/output" 2>&1
rc=$?

printf '%s\n' "$rc" >"$dir/exit.tmp"
mv "$dir/exit.tmp" "$dir/exit"
EOF

chmod +x "$dir/run.sh"
```

Launch:

```bash
tmux_name="pi-${run}-${worker}"

tmux new-session -d -s "$tmux_name" \
  "SUBAGENT_CWD=$(printf %q "$PWD") \
   SUBAGENT_NAME=$(printf %q "$worker") \
   $(printf %q "$dir/run.sh")"
```

Repeat for other workers.

## Wait for any worker

Use one blocking bash call:

```bash
while :; do
  for d in "$root"/*; do
    [ -f "$d/exit" ] || continue
    mv "$d/exit" "$d/done"
    basename "$d"
    exit
  done
  sleep .2
done
```

When a worker finishes, the call returns its name.

If several finish together, none are lost: each still has its own `exit` file. Calling the wait command again immediately returns another.

Read the result:

```bash
worker="<returned-name>"
dir="$root/$worker"

rc="$(cat "$dir/done")"
cat "$dir/output"
```

Handle it, then wait again if needed.

Do not block while the parent still has useful independent work to do.

## Wait for all workers

```bash
while :; do
  pending=0

  for d in "$root"/*; do
    [ -d "$d" ] || continue
    [ -f "$d/exit" ] || [ -f "$d/done" ] || pending=$((pending + 1))
  done

  [ "$pending" -eq 0 ] && break
  sleep .2
done
```

Then consume remaining `exit` files and read all outputs.

## Resume a worker

```bash
worker=reviewer
dir="$root/$worker"
sid="$(cat "$dir/session-id")"

printf '%s\n' \
  'Reconsider your conclusion given this new information: ...' |
  pi --session "$sid" -p
```

For a resumed turn that should run concurrently, launch it through tmux again using the same session ID.

Do not resume until the previous process for that worker has exited.

`output` may be overwritten on later turns. The Pi session is the real conversation history. Preserve numbered output files only when you specifically need separate logs.

## Delegating work

The child does not inherit the parent's conversation. Give it enough context to work independently:

* objective;
* relevant files/subsystem;
* important constraints;
* whether to modify files or only investigate;
* what result the parent needs.

Point it at repository files instead of copying large amounts of context.

Good uses:

* independent reviews;
* separate subsystem investigations;
* implementation + independent review;
* competing approaches;
* partitioning a large search.

Usually 2–4 workers is enough.

## Shared filesystem

Read-only workers can share the same working tree.

If multiple workers will modify overlapping files, coordinate ownership or use separate Git worktrees.

## Inspect / failure / cancel

A worker is finished when `exit` exists, even if the exit code is nonzero.

Inspect a running worker:

```bash
tmux capture-pane -p -t "$tmux_name" -S -200
```

Attach if useful:

```bash
tmux attach -t "$tmux_name"
```

Cancel:

```bash
tmux kill-session -t "$tmux_name"
```

Killing tmux may prevent the runner from writing `exit`, so record cancellation explicitly if the parent needs completion accounting:

```bash
printf '%s\n' cancelled > "$dir/exit.tmp"
mv "$dir/exit.tmp" "$dir/exit"
```

## Session semantics

When a subagent turn ends:

* Pi process exits;
* its live HTTP/WebSocket connection ends;
* process-local state disappears;
* detached external processes may survive;
* the Pi session remains resumable.

Resuming reconstructs conversation state; it does not resurrect the previous process.

Provider prompt caching may still work across resumed processes when the reconstructed prefix matches. Do not depend on it.

Long sessions may eventually be compacted by Pi, so session continuity does not guarantee every old token remains verbatim in active context.

## Invariants

1. One stable session ID per logical worker.
2. At most one active Pi process per session.
3. Detached turns produce a durable completion marker or explicit cancellation marker.
4. Completion state lives on disk.
5. Waiting for one worker never loses other completions.
6. Resumed workers reread potentially stale filesystem state.
7. Never use "most recent session" as worker identity.
