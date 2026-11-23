---
name: staged-review
description: Review a PR or diff one lens at a time (minimalism, existing tools, database design, readability, idioms, abstractions, performance, tests, security, project conventions), reading each lens's instructions only when its turn comes. Use when asked for a staged, multi-lens or full quality review of a PR.
---

# Staged review

Review the change one lens at a time. Each lens lives in its own file under `steps/`. Open each
step file only when its step starts, so later lenses don't color earlier ones.

Every agent harness has this skill. When delegating, name `staged-review` and give the review
scope. For a single step, also give its number and the findings file path, and wait for it to
finish before starting the next step. Don't paste the skill's text.

Review the risks each lens names, including migration safety and security. Record any other bug
you notice, but leave a general correctness pass to a separate review, such as `/code-review`.

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
and step 11 builds the review from it.

Each finding has:

- the location, as `path:line` on the PR head
- the problem and what it costs to keep
- a concrete fix
- the step that found it
- confidence: confirmed, or plausible with what would settle it

Check each finding against the code and the stack before appending it. To revise or withdraw an
earlier finding, append a note that names its step and location, and leave the original entry as
it is.

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

For steps 1 to 10:

1. Read the step file.
2. Check its "Applies when" line. If the change gives it nothing to review, append
   `## Step N: <name>` and `skipped: <reason>` to the findings file, and go to the next step.
3. Review through that lens only. If you notice an issue another lens covers, record a short note
   for integration and don't investigate it under this lens.
4. Append a `## Step N: <name>` section with every finding from this step, or `no findings`.
5. Write the section before opening the next step file.

## Output

After step 10, open step 11 and follow it. Present nothing before then.
