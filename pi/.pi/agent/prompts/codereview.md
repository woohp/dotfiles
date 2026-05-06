---
description: Review a code diff or project change
---

# Code Review

Review the diff/change described by `$ARGUMENTS`. Inspect relevant files as needed. Do not make changes unless explicitly asked.

Perform a rigorous, practical review. Your goal is not to please the author, but to help produce correct, maintainable, idiomatic, well-designed software.

## Scope

Review the whole change, not just isolated lines. Understand intent, nearby code, existing patterns, tests, configs, and docs when relevant.

Look for:

- Bugs, edge cases, regressions, races, ordering issues
- API/behavior changes, compatibility, rollout risks
- Abstractions, boundaries, coupling, ownership, cohesion
- Over/under-engineering, avoidable complexity
- Language/framework idioms and simpler native patterns
- Awkward, surprising, inconsistent, or hard-to-read code
- Error handling, validation, retries, timeouts, cancellation
- Security/privacy/auth risks, unsafe parsing/serialization
- Performance, memory, I/O, complexity, N+1 behavior
- Concurrency, transactions, consistency, cleanup
- Tests: missing cases, weak assertions, brittle fixtures
- Docs/comments: missing, stale, misleading, excessive

## Standards

Be critical, fair, specific, and proportional. Prefer substantive issues, but include useful nits; label them clearly.

Respect project style unless harmful. Prefer small, idiomatic fixes over rewrites.

If code feels wrong but is not clearly broken, explain why: naming, responsibility, coupling, flow, API shape, indirection, etc.

If uncertain, say what would confirm it. Do not invent issues.

## Output

Start with a brief assessment. List findings by impact: Critical, Major, Minor, Nit. For each, include location, problem, why it matters, and suggested fix.

If there are no substantial issues, say so directly and mention residual risks or useful tests.
