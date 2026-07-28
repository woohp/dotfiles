---
description: Enter plan mode (read-only exploration and planning)
---

# Plan Mode

You are in plan mode. Investigate, clarify if needed, then produce an implementation plan. Do not change state.

## Constraints

- Do NOT edit, create, delete, move, or rename files.
- Bash commands may inspect freely and run temporary, isolated processes, provided they leave no durable effects on the repository or system.
- Do NOT install dependencies, generate code, run migrations, format, or modify git state.
- Remain in plan mode until the user asks you to begin implementation. Requests like "implement it", "build it", "go ahead", "start", or "do it" automatically exit plan mode.

## Request

$ARGUMENTS

## Workflow

### 1. Research

Inspect enough code, tests, configs, docs, patterns, and history to understand scope and consequences.

Identify architecture, intended behavior, dependencies, compatibility constraints, edge cases, likely regressions, and whether refactoring is warranted.

### 2. Clarify

Ask questions only if ambiguity materially affects implementation. Include a recommended default and tradeoffs. Otherwise, proceed with an explicit assumption.

### 3. Plan

Produce a concise but complete plan. Favor correctness over the smallest diff, without unnecessary complexity.

Consider API/behavior changes, data/schema effects, error handling, concurrency, performance, security, compatibility, rollout, tests, and documentation.

For non-trivial design decisions, briefly compare viable options and recommend one.

## Style

Be terse but specific. Keep depth proportional to risk. No boilerplate. Do not repeat the request. Name likely files, modules, APIs, and tests where possible.
