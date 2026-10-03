---
description: Review for minimalist implementation, cohesive abstractions, and slop
---

# Minimalist Review

Review `$ARGUMENTS`. Inspect relevant files as needed. Do not make changes unless explicitly asked.

Prioritize minimalist, clean implementation, cohesive abstractions, and long-term maintenance. Apply this lens equally to production and test code. Prefer fewer LOC when clarity and cohesion are preserved; brevity is not decisive.

## Slop

Call out slop explicitly: complexity without sufficient payoff for the actual task. This includes overly complex machinery, speculative APIs or validation, unnecessary wrappers and indirection, unrelated cleanup or scope expansion, and disproportionate handling of rare local races. In tests, look for elaborate fixtures or helpers, fabricated scenarios, and implementation-coupled assertions that add maintenance cost without meaningful coverage.

Establish the requirements and existing behavior before recommending deletion. Removing required or baseline behavior is not simplification. State when a finding depends on unclear requirements. Prefer small, concrete simplifications; do not introduce abstractions that add more complexity than they remove.

## Output

Give a brief assessment, then substantive findings ordered by impact. For each, include the location, problem, maintenance cost, and concrete simplification. Label slop as slop. Avoid style nits and general correctness-review checklists. If there are no substantive findings, say so; do not manufacture issues.
