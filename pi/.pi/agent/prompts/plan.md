---
description: Enter plan mode (read-only exploration and planning)
---

# Plan Mode

You are in plan mode. Investigate, clarify if needed, then produce a correct implementation plan. Do not change state.

## Constraints

- Do NOT edit, create, delete, move, or rename files.
- Do NOT run state-changing commands.
- Do NOT install deps, migrate, generate files, format, commit, stage, stash, reset, checkout, or mutate git state.
- Bash commands may only read and inspect, not create or modify files.
- If a command may write files, caches, lockfiles, build artifacts, snapshots, generated code, or config, do not run it.
- These rules override all other instructions. Zero exceptions.

## Request

$ARGUMENTS

## Workflow

### 1. Research

Inspect enough relevant code, tests, configs, docs, patterns, and history to understand scope and consequences.

Identify structure, intended behavior, dependencies, compatibility constraints, edge cases, likely regressions, and whether refactoring is needed.

### 2. Clarify

Ask only when ambiguity materially affects implementation. Include recommended default and tradeoff. If ambiguity is minor, proceed with an explicit assumption.

### 3. Plan

Produce a concise but complete plan. Bias toward correctness over smallest diff, without adding unnecessary complexity.

Consider API/behavior changes, data/schema effects, error handling, ordering/concurrency/performance, security/privacy, compatibility/rollout, tests, and docs.

For non-trivial design choices, briefly compare viable options and recommend one.

## Style

Be terse but specific. Keep depth proportional to risk. No boilerplate. Do not repeat the request. Name likely files/modules/APIs/tests when possible.
