---
name: subagents
description: Launch, coordinate, wait for, inspect, and resume independent Pi subagents using bash and tmux
------------------------------------------------------------------------------------------------------------

# Subagents

Use independent `pi` processes as subagents. No extension required.

A worker = a stable Pi session, not a Pi process. The process may exit after each turn; resume later with the same session ID.

## Rules

* One worker, no useful parallel work: run `pi -p` directly. Bash blocks until done.
* Multiple workers: run each in detached tmux.
* Give each worker a stable ID with `--session-id`.
* Resume with `pi --session <id>`.
* Never use `pi -c`; "latest session" is ambiguous with multiple workers.
* Never run two Pi processes against the same session.
* Shell variables do not persist across separate bash tool calls. Keep IDs/paths in agent context or files.
* Completion state lives on disk, not in shell state or tmux.
* Resumed workers see the current filesystem. Reread files that may have changed.
* Prefer a few substantial workers over many tiny ones.

## One worker

No tmux needed:

```bash
sid="$(uuidgen | tr '[:upper:]' '[:lower:]')"

printf '%s\n' \
  'Review the parser implementation. Find correctness problems and report concrete fixes.' |
  pi --session-id "$sid" --name subagent:reviewer -p
```

The bash call returns when Pi exits.

First use of a new `--session-id` may print:

```text
Warning: No project session found with id '...'; creating a new session with that id.
```

This is expected.

Continue later:

```bash
printf '%s\n' \
  'Now inspect the tests and see whether they cover the problems you found.' |
  pi --session "$sid" -p
```

Conversation persists. Process-local memory, open connections, and handles do not.

## Parallel workers

Create one run directory:

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
    tmux-name
    exit        # finished, not consumed
    done        # finished, consumed
```

For each worker:

```bash
worker=reviewer
dir="$root/$worker"
sid="$(uuidgen | tr '[:upper:]' '[:lower:]')"
tmux_name="pi-${run}-${worker}"

mkdir -p "$dir"
printf '%s\n' "$sid" > "$dir/session-id"
printf '%s\n' "$prompt" > "$dir/prompt"
printf '%s\n' "$tmux_name" > "$dir/tmux-name"
```

Use a small runner to avoid nested shell quoting:

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

printf '%s\n' "$rc" > "$dir/exit.tmp"
mv "$dir/exit.tmp" "$dir/exit"
EOF

chmod +x "$dir/run.sh"
```

Launch:

```bash
tmux new-session -d -s "$tmux_name" \
  "SUBAGENT_CWD=$(printf %q "$PWD") \
   SUBAGENT_NAME=$(printf %q "$worker") \
   $(printf %q "$dir/run.sh")"
```

Repeat for other workers.

Persist or remember `$root`; a later bash call will not inherit it.

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

This returns exactly one unseen completion.

If several workers finish together, none are lost: each retains its own `exit` file until consumed.

Read the result:

```bash
worker="<returned-name>"
dir="$root/$worker"

rc="$(cat "$dir/done")"
cat "$dir/output"
```

React, then wait again.

Do not block while the parent still has useful independent work.

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

Then consume remaining `exit` files and read outputs.

## Resume a worker

```bash
worker=reviewer
dir="$root/$worker"
sid="$(cat "$dir/session-id")"

printf '%s\n' \
  'Reconsider your conclusion given this new information: ...' |
  pi --session "$sid" -p
```

For concurrent follow-up work, launch through tmux again using the same session.

Never resume while that worker's previous Pi process is still active.

`output` may be overwritten on later turns. The Pi session is the actual conversation history; preserve numbered logs only when needed.

## Delegate well

The child does not inherit the parent's conversation. Give it enough context:

* objective;
* relevant files/subsystem;
* constraints;
* whether to modify files or only investigate;
* what result the parent needs.

Point it at repository files instead of copying large context.

Good uses:

* independent reviews;
* separate subsystem investigations;
* implementation + review;
* competing approaches;
* partitioning a large search.

Usually 2–4 workers is enough.

## Shared filesystem

Read-only workers can share one working tree.

If workers may edit overlapping files, coordinate ownership or use separate Git worktrees.

## Inspect / fail / cancel

A worker is finished when `exit` exists, regardless of exit code.

Inspect:

```bash
tmux_name="$(cat "$dir/tmux-name")"
tmux capture-pane -p -t "$tmux_name" -S -200
```

Attach:

```bash
tmux attach -t "$tmux_name"
```

Cancel:

```bash
tmux kill-session -t "$tmux_name"
```

Killing tmux may prevent the runner from writing `exit`. If completion accounting matters:

```bash
printf '%s\n' cancelled > "$dir/exit.tmp"
mv "$dir/exit.tmp" "$dir/exit"
```

## Session semantics

When a turn ends:

* Pi process exits;
* live HTTP/WebSocket connection ends;
* process-local state disappears;
* detached external processes may survive;
* Pi session remains resumable.

Resuming reconstructs conversation state; it does not resurrect the old process.

Provider prompt caching may still work when reconstructed prefixes match. Do not depend on it.

Long sessions may be compacted by Pi, so continuity does not guarantee every old token remains verbatim in active context.

## Invariants

1. One stable session ID per worker.
2. At most one active Pi process per session.
3. Detached turns produce `exit`, or explicit cancellation does.
4. `exit → done` means exactly-once completion consumption.
5. Completion state lives on disk.
6. Waiting for one worker never loses other completions.
7. Resumed workers verify potentially stale filesystem state.
8. Never use "most recent session" as worker identity.
