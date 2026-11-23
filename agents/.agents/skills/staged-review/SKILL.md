---
name: staged-review
description: Review a PR or diff one lens at a time (minimalism, existing tools, database design, readability, idioms, abstractions, performance, tests, security, project conventions), reading each lens's instructions only when its turn comes. Use when asked for a staged, multi-lens or full quality review of a PR.
---

# Staged review

Review a change through several lenses, one at a time. Each lens lives in its own file under
`steps/`. Read a step file only when you start that step. Reading ahead lets later lenses color
the earlier ones, which is what this skill exists to prevent.

Every agent harness has this skill. When you hand this review, or one of its steps, to a
subagent in any harness, name the skill and the step and give the scope. Don't paste the
instructions.

This is a quality review, not a bug hunt. Use a correctness review for that, such as
`/code-review`. If you trip over a bug, record it, but don't go looking.

## Before the first step

Read the change and its context. Record no findings yet.

- The diff, the PR description and any linked ticket.
- The code around each change: callers, callees, and the existing patterns it should follow.
- The stack. Find the PR's base and any PRs based on its branch
  (`gh pr list --base <head branch>`). Something that looks unused here may be used further up.
- Other open PRs that touch the same files, migrations above all. Two migrations off the same
  revision, or two PRs reworking the same table, conflict.
- The project's written guidance: `AGENTS.md`, `CLAUDE.md`, a contributing guide, and any skills
  they name for tests, prose or reviews.

Then write yourself a few lines on what the PR is for and what behavior it has to keep. Removing
required behavior is not a simplification.

## The findings file

Before the first step, create a temp file outside the repo checkout. Every step appends to it,
and step 11 builds the review from it. Findings kept only in your head get lost.

Each finding has:

- the location, as `path:line` on the PR head
- the problem and what it costs to keep
- a concrete fix
- the step that found it
- confidence: confirmed, or plausible with what would settle it

Check a finding against the code before you add it. Open the file, grep for callers, look up the
stack. A later step may revise or withdraw an earlier finding. Mark it revised or withdrawn
instead of deleting it.

## The steps

1. `steps/01-minimalism.md`
2. `steps/02-existing-tools.md`
3. `steps/03-database.md`
4. `steps/04-readability.md`
5. `steps/05-idioms.md`
6. `steps/06-abstractions.md`
7. `steps/07-performance.md`
8. `steps/08-tests.md`
9. `steps/09-security.md`
10. `steps/10-conventions.md`
11. `steps/11-integrate.md`

For each step:

1. Read the step file.
2. Check its "Applies when" line. If the change gives it nothing to review, append
   `## Step N: <name>` and `skipped: <reason>` to the findings file, and go to the next step.
3. Review through that lens only. A problem that belongs to a later lens waits for it.
4. Append a `## Step N: <name>` section to the findings file with every finding from this step,
   or `no findings` if there were none. Revisions to earlier findings go in this section too,
   naming the finding they change.
5. Only once that section is written, open the next step file.

## Output

Step 11 turns the findings file into the final review. Don't present anything before it.
