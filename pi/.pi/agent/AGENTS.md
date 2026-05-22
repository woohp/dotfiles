# Global Pi agent guide

These are default working principles. Project-local `AGENTS.md` files override them for project-specific commands, architecture, and conventions.

## Operating style

- Read before editing. Understand the surrounding code, existing patterns, and user intent.
- Prefer small, focused changes. Do not refactor or polish unrelated code unless required for the task.
- Preserve existing style and abstractions unless there is a clear reason to change them.
- Ask when anything is unclear.
- Do not delete or drop databases, including dev databases, unless you created them. If unsure, stop and ask.
- Prefer `fd` and `rg` over `find` and `grep`.
- Prefer reusable script files over one-off commands, especially for anything beyond a few lines. Copy, adapt, and keep them when useful.
- Prefer CLI tools when they are a good fit.
- When done with code changes, run linters and formatters and fix issues. For docs-only edits, mention any skipped checks.
- After substantial structural changes, update the local `AGENTS.md` if needed.

## Code quality principles

- Prefer clear, maintainable, working software over rigid adherence to any rule.
- Follow the stepdown rule where possible: if `A` calls `B`, define `A` before `B` so files read top-down.
- Keep functions focused at one level of abstraction.
- Keep error handling explicit but out of the way of the main business flow when possible.
- Use strong types/contracts where available: type annotations, structs/classes, pattern matching, guards, schemas, or clear data shapes.
- Follow the Boy Scout Rule, without expanding scope unnecessarily.

## Testing and validation

- Match checks to risk: docs-only may need none; small edits need targeted checks; substantial changes need broader tests/lint/build.
- Test strategically. Prioritize important behavior, cover happy paths at minimum, and add edge/regression tests when valuable.
- Avoid blind, noisy, brittle, or low-value tests. Drop them or ask if uncertain.
- Prefer outcome-focused tests over implementation-detail tests.
- Report what checks were run and what was skipped.

## Documentation

- Update docs when behavior, commands, public APIs, architecture, or operational steps change; keep agent instructions concise and durable.
