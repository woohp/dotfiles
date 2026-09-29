---
description: Review a code diff or project change
---

# Code Review

Review the following:

`$ARGUMENTS`.

Inspect relevant files as needed. Do not make changes unless explicitly asked.

Perform a rigorous, practical review. Your goal is not to please the author, but to help produce correct, maintainable, idiomatic, well-designed software.

## Scope

Review the whole change, not just isolated lines. Understand intent, nearby code, existing patterns, tests, configs, and docs when relevant.

Look for:

- Abstractions, boundaries, coupling, ownership, cohesion
- Bugs, edge cases, regressions, races, ordering issues
- API/behavior changes, compatibility, rollout risks
- Over/under-engineering, avoidable complexity
- Language/framework idioms and simpler native patterns
- Awkward, surprising, inconsistent, or hard-to-read code
- Error handling, validation, retries, timeouts, cancellation
- Security/privacy/auth risks, unsafe parsing/serialization
- Performance, memory, I/O, complexity, N+1 behavior
- Concurrency, transactions, consistency, cleanup
- Tests: missing cases, weak assertions, brittle fixtures
- Dependencies: Should this use an existing/new library or framework feature instead? Conversely, is a new dependency justified, and is it the right choice?
- Deletion/simplification: Can this change remove code, state, branches, abstractions, or special cases instead of adding more?
- Docs/comments: missing, stale, misleading, excessive

## Standards

Be critical, fair, specific, and proportional. Prefer substantive issues, but include useful nits; label them clearly.

Respect project style unless harmful. Prefer small, idiomatic fixes over rewrites.

If code feels wrong but is not clearly broken, explain why: naming, responsibility, coupling, flow, API shape, indirection, etc.

Channel YAGNI within reason. Well-engineered and simple > slightly under-engineered > over-engineered.

If uncertain, say what would confirm it. Do not invent issues.

## De-slop lens

Ask whether this is the minimal, principled implementation of the actual request. Slop is machinery without payoff: reflexive cleanup or defensive code for cases that cannot happen, speculative abstractions and options, tests that exercise a fabricated setup and cannot fail on the real risk, plumbing copied from habit rather than reasoned from need. Call it out plainly and say what to delete.

Do not confuse slop with scope the request implies. Before calling something over-built, establish what was asked for and what the code it replaces already provided; replacing a native or existing capability legitimately carries its baseline behavior (keyboard access, accessibility, filtering, dismissal). Proposing to drop a requirement or a baseline behavior is not a simplification. If the original request is not in the PR, find it or ask, and say when a finding depends on requirements you could not see.

## Output

Start with a brief assessment. List findings by impact: Critical, Major, Minor, Nit. For each, include location, problem, why it matters, and suggested fix.

If there are no substantial issues, say so directly and mention residual risks or useful tests.
