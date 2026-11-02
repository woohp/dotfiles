#!/bin/sh
# SessionStart hook: give the Pi `subagent` CLI a stable parent ID and put it on PATH.
session_id="$(jq -r .session_id)"
{
    printf 'export PI_SESSION_ID=%s\n' "claude-$session_id"
    printf '%s\n' 'export PATH="$HOME/.pi/agent/bin:$PATH"'
} >>"$CLAUDE_ENV_FILE"
