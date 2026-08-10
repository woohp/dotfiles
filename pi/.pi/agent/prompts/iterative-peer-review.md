---
description: Review, discuss, fix, and re-review with independent peer reviewers
---

# Iterative Peer Review

Run a parent-controlled code-review loop for:

`$ARGUMENTS`

You are the original author agent, the sole writer, and the final decision-maker. Use subagents for review. Reviewer subagents are read-only and must never edit or commit. Treat each reviewer as a peer—not as superior or inferior to the author.

## Bounds

Unless the invocation specifies otherwise:

- Run at most 3 independent reviewer cycles, each with a fresh reviewer.
- Use at most 12 responses from each reviewer, including its initial review.

These are hard caps, not targets. Stop an exchange when further discussion has little expected value. Do not chase optional polish.

Reviewer turns can take several minutes. `subagent launch-next reviewer` and `subagent resume WORKER` return immediately; only `subagent wait-any WORKER` blocks for a reviewer turn. Give each wait a generous timeout—typically 10–15 minutes or longer—rather than relying on the tool's short default.

Every reviewer turn runs in detached tmux. If a wait times out, the reviewer continues running; check `subagent status` and wait for the same returned `WORKER` again. Do not resume the worker, start another turn, or launch a replacement merely because the waiting wrapper timed out.

## Establish the review target

Before launching the first reviewer, determine and retain a stable review target that remains meaningful after fix commits. Prefer an explicit range, commit, PR, or path supplied in the invocation. Otherwise infer the intended change from the current branch, recent commit, and working tree. Record the baseline commit when appropriate. Ensure later reviews include both the original change and all subsequent review-fix commits; do not accidentally review only the latest fix commit or an empty working-tree diff.

Do not rewrite, squash, amend, or discard existing commits unless explicitly requested. Do not include unrelated pre-existing working-tree changes in review-fix commits. If the target or safe commit boundary cannot be determined, ask the user instead of guessing.

## Outer loop: independent reviewer cycles

For each reviewer cycle, launch a fresh worker with `subagent launch-next reviewer`. The CLI atomically chooses the first unused numbered name—`reviewer-1`, then `reviewer-2`, and so on—even when another branch or pre-compaction history already created reviewers. Retain the exact `WORKER` value returned by the command and use it for every wait, output, and resume in that cycle. Each reviewer must begin in a fresh Pi session without context from earlier reviewers.

Use the full contents of `~/.pi/agent/agents/peer-reviewer.md` as the reviewer's instruction block by default. Append the stable review target, baseline, repository-specific constraints, and other context needed to review independently; do not rewrite the default instructions merely to personalize them. Deviate from or replace the default only when a concrete aspect of the task makes it unsuitable, preserve as much of it as still applies, and briefly state the reason for the deviation in the next user update or final report. The reviewer must always remain read-only and must not edit, commit, or launch subagents.

After launching the reviewer, wait for its exact returned worker name with `subagent wait-any WORKER`, then read its response with `subagent output WORKER`.

If a completely new reviewer returns `VERDICT: CLEAN` in its first response, stop the entire workflow immediately. This is the independent-clean stopping condition.

## Inner loop: fix rounds

A fix round consists of a review response, any discussion needed to settle the dispositions and course of action, one implementation phase, and the resulting re-review. A single fix round may include several reviewer responses before any code changes.

When a reviewer requests changes, work through this cycle with the same worker:

1. Triage every finding as accepted, disputed, needing clarification, deferred, or blocked on a user decision. Do not accept findings blindly.
2. Use `subagent resume WORKER`, `subagent wait-any WORKER`, and `subagent output WORKER` for pushback, questions, or other discussion needed to settle the findings and implementation plan. Continue only while the exchange adds useful evidence or clarity.
3. Once the dispositions and course of action are settled, implement the accepted fixes as the sole writer. Create one or more new commits rather than amending an existing commit, and run focused validation. Never create an empty commit or include unrelated pre-existing changes.
4. Immediately after the implementation phase, give the user the brief post-change update described below before sending the fixes back to the reviewer.
5. Launch another turn with `subagent resume WORKER`, supplying the finding dispositions, fix commits, validation results, and technical evidence for any pushback. Ask it to inspect the current files and re-review the complete stable target, verify the fixes, look for regressions or additional issues, and push back where appropriate. Wait with `subagent wait-any WORKER`, then read the response with `subagent output WORKER`.
6. If the new response requests more changes, begin another fix round. Stop when another exchange has little meaningful expected value.

A follow-up message should contain:

- disposition of each finding ID;
- fixes made and the new commit hash, if any;
- validation commands and outcomes;
- technical reasoning and evidence for pushback;
- an instruction to inspect the current files and re-review the complete stable target.

Do not copy the entire previous report back: the resumed reviewer retains its conversation. Do not launch a replacement reviewer merely to avoid justified pushback.

Continue with the same reviewer until one of these occurs:

- it returns `VERDICT: CLEAN`;
- remaining items are optional, explicitly deferred, or require a user decision;
- disagreement is repeating without new evidence;
- further exchange has little expected value;
- the per-reviewer response cap is reached.

If this reviewer becomes clean only after one or more follow-ups, that ends its reviewer cycle but not the whole workflow. Launch the next completely independent fresh reviewer unless the reviewer cap has been reached. Likewise, if you end an unproductive exchange, preserve unresolved findings in your final accounting and launch the next fresh reviewer.

## User progress updates

Give the user a very brief update immediately after each implementation phase and before the next reviewer turn. Identify the reviewer worker, summarize the fixes and any disputed findings, report the new commit or commits, and mention the validation results. This is the progress boundary for a fix round; do not update after every reviewer response.

If a reviewer cycle ends without an implementation phase, give a brief update before launching the next independent reviewer. If the workflow ends there, the final completion report serves as that update.

## Completion

Stop when:

- a completely new reviewer is CLEAN on its first response;
- the independent-reviewer cap is reached;
- a blocker requires the user;
- continuing would have little expected value.

Before reporting completion, inspect the final complete review range yourself and confirm focused validation. Summarize:

- stable review target and baseline;
- independent reviewers launched;
- response count for each reviewer;
- review-fix commits created;
- validation performed;
- findings fixed, withdrawn, rejected, deferred, or still open;
- exact stopping condition.
