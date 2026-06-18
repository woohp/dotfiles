# Global Pi agent guide

These are default working principles. Project-local `AGENTS.md` files override them for project-specific commands, architecture, and conventions.

## Operating style

- Keep it simple. Prefer the smallest maintainable change that solves the actual problem. Reuse existing patterns instead of introducing new abstractions, broad refactors, speculative helpers, or clever architecture unless clearly justified.
- Read before editing. Understand the surrounding code, existing patterns, and user intent first.
- Make small, focused changes. Do not refactor or clean up unrelated code unless required.
- Preserve existing style and abstractions unless there is a clear reason to change them.
- Ask when anything is unclear.
- Do not delete or drop databases, including dev databases, unless you created them. If unsure, ask.
- Avoid excessive defensive coding. Do not handle unrealistic edge cases, especially in code we control.
- `fd`, `rg`, `eza`, `bat`, `ast-grep/sg`, `wget`, `curl` are available; use them when appropriate.
- Prefer CLI tools when they fit the task well, over python code.
- When done with code changes, run linters and formatters, then fix any remaining issues they do not handle.
  - Do not run linters or formatters after every edit. Optimize for speed during editing, even if the intermediate code is messy.
- After substantial structural changes, update the local `AGENTS.md` if needed.
- Work efficiently. For example, prefer `cp` over recreating files from scratch.
  - Prefer reusable script files over one-off commands, especially for anything beyond a few lines. Copy and adapt them when useful.
- Protect context usage. Any command with unknown or potentially large output must be scoped and byte-capped. If output is large but is low noise and all important, then no need to cap.
  - Byte-cap large or unpredictable output. Line limits alone are unsafe because a single line may be huge.

    ```
    COMMAND 2>&1 | head -c 4000  # or tail
    ```

  - Scope before printing content: list files first, search specific paths, count matches when useful, and avoid reading generated, binary, minified, database, or huge JSON/JSONL files unless required.
  - Preserve exit codes when needed:

    ```
    COMMAND | tail -c 5000
    status=${PIPESTATUS[0]}
    exit "$status"
    ```

    Or use an equivalent approach.

  - Avoid unbounded cat, broad rg, find, ls -R, git diff, and similar commands.
  - Disable progress bars whenever possible, even temporarily.
  - Suppress excessively noisy logs whenever possible, even temporarily.

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
