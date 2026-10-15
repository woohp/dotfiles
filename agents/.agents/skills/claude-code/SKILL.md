---
name: claude-code
description: Always load this skill when asked to invoke Claude, including "Claude as a subagent". Use the Claude Code CLI, never native subagent tools. Not for agents already running in Claude Code.
---

This skill is only for agents running outside Claude Code. If your current harness is Claude Code, just use your own subagent tools. This restriction is about the harness, not the underlying model.

Never substitute native subagent tools or provider APIs for Claude Code. If the CLI cannot run, report the blocker; do not fall back.

Run Claude Code headless through `bash`, from the directory it should work in. For remote runs, execute the same procedure over SSH using that machine's environment, home directory, and paths; resume on the same machine.

Check authentication once per execution target:

- If `CLAUDE_CODE_OAUTH_TOKEN` is already set, invoke Claude directly.
- Otherwise, if `~/.claude/oauth-token` is nonempty, use this prefix for all invocations:

  ```sh
  CLAUDE_CODE_OAUTH_TOKEN="$(cat "$HOME/.claude/oauth-token")" claude ...
  ```

- Otherwise, try Claude directly; its saved login may work.

Reuse the working form; recheck only on a new target or authentication failure. Bash calls do not retain exports. Never source or print the token. Skip `auth status`; if authentication fails, stop and tell the user; do not switch machines.

Launch:

```sh
claude -p "<task>" --output-format json --dangerously-skip-permissions < /dev/null > claude-run.json
jq '{is_error, subtype, session_id, num_turns, total_cost_usd, denied: (.permission_denials | length)}' claude-run.json
jq -r '.result' claude-run.json
```

- Run real work with `background: true` and a `timeout` sized for the task; the default 30 seconds kills it. Send all three lines as one command so the delivered `<command_result>` carries the summary and answer.
- A restricted run can report `success` after a denied tool call; check `permission_denials`.
- Continue a session with `--resume <session_id>` and a new `-p` prompt.

Permissions are skipped by default, matching this agent's own unrestricted tools. Restrict only when the task calls for it: drop `--dangerously-skip-permissions` and pass `--permission-mode plan` or `--allowedTools`/`--disallowedTools`. Anything that would need approval is denied in `-p` mode.
