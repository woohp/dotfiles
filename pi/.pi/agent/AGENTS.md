# Global Pi agent guide

These are default working principles. Project-local `AGENTS.md` files take precedence for project-specific commands, architecture, and conventions.

## Operating style

- Read before editing. Understand the surrounding code, existing patterns, and user intent.
- Prefer small, focused changes. Do not refactor or polish unrelated code unless it is necessary for the task.
- Preserve existing style and abstractions unless there is a clear reason to change them.
- Ask when anything is unclear.

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
