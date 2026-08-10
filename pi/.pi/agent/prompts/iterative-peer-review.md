---
description: Review, discuss, fix, and re-review with independent peer reviewers
---

# Iterative Peer Review

Run a parent-controlled code-review loop for:

`$ARGUMENTS`

You are the original author agent, the sole writer, and the final decision-maker. Use subagents for review. Reviewer subagents are read-only and must never edit or commit. Treat each reviewer as a peer—not as superior or inferior to the author.

## Bounds

Unless the invocation specifies otherwise:

- Run at most 3 outer rounds, each with a completely independent reviewer.
- Use at most 12 responses from each reviewer, including its initial review.

These are hard caps, not targets. Stop an exchange when further discussion has little expected value. Do not chase optional polish.

## Establish the review target

Before launching the first reviewer, determine and retain a stable review target that remains meaningful after fix commits. Prefer an explicit range, commit, PR, or path supplied in the invocation. Otherwise infer the intended change from the current branch, recent commit, and working tree. Record the baseline commit when appropriate. Ensure later reviews include both the original change and all subsequent review-fix commits; do not accidentally review only the latest fix commit or an empty working-tree diff.

Do not rewrite, squash, amend, or discard existing commits unless explicitly requested. Do not include unrelated pre-existing working-tree changes in review-fix commits. If the target or safe commit boundary cannot be determined, ask the user instead of guessing.

## Outer loop: independent reviewers

For outer iteration N, launch a completely new worker named `reviewer-N` with `subagent launch`. Each reviewer must begin in a fresh Pi session without context from earlier reviewers. If this parent session already contains workers from an earlier invocation, continue with the first unused `reviewer-N` name rather than reusing one.

By default, build the reviewer's initial prompt from the contents of `~/.pi/agent/agents/peer-reviewer.md`, supplemented with the stable review target, baseline, repository-specific constraints, and any other context needed to review independently. You may adapt that prompt or create a different one when the situation warrants it; do not reuse the default blindly when it does not fit. The reviewer must always remain read-only and must not edit, commit, or launch subagents.

If a completely new reviewer returns `VERDICT: CLEAN` in its first response, stop the entire workflow immediately. This is the independent-clean stopping condition.

## Inner loop: discussion, fixes, and re-review

When a reviewer requests changes, work through this cycle with the same `reviewer-N` worker:

1. Triage every finding as accepted, disputed, needing clarification, deferred, or blocked on a user decision. Do not accept findings blindly.
2. Use `subagent resume reviewer-N` for pushback, questions, or other discussion that should happen before implementation. Skip a separate discussion turn when all findings are accepted or when the necessary reasoning can accompany the fix report.
3. Implement the accepted fixes as the sole writer. Create one or more new commits rather than amending an existing commit, and run focused validation. Never create an empty commit or include unrelated pre-existing changes.
4. Resume the same reviewer with the finding dispositions, fix commits, validation results, and technical evidence for any pushback. Ask it to inspect the current files and re-review the complete stable target, verify the fixes, look for regressions or additional issues, and push back where appropriate.
5. Triage the new response and repeat only while another exchange has meaningful expected value.

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

If this reviewer becomes clean only after one or more follow-ups, that ends the inner loop but not the whole workflow. Launch the next completely independent fresh reviewer unless the outer cap has been reached. Likewise, if you end an unproductive inner exchange, preserve unresolved findings in your final accounting and launch the next fresh reviewer.

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
