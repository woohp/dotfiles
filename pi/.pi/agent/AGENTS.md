# Global Pi agent guide

These are default working principles. Project-local `AGENTS.md` files override them for project-specific commands, architecture, and conventions.

## Working style

- Prefer the smallest maintainable change that solves the actual problem. Reuse existing patterns; avoid speculative abstractions, unnecessary wrappers, unrelated refactors, and defensive handling for impossible internal states.
- Resolve ambiguity from the repository, tests, docs, and existing patterns when reasonably possible. Ask only when it materially affects behavior or requires an important assumption.
- Do not delete or drop databases, including dev databases, unless you created them for the current task. If unsure, ask.
- Do not add runtime validation for invariants already guaranteed by the language or type system. Validate at untyped boundaries and for semantic constraints the type system cannot express.
- Do not broaden the task merely to clean up nearby code.
- Please remove all mannered prose.

## Tools and context

- `fd`, `rg`, `eza`, `bat`, `ast-grep`/`sg`, `wget`, `curl`, and `qsv` are available; prefer them over older equivalents when appropriate.
- Prefer an existing CLI tool or simple shell pipeline over ad-hoc Python. Use Python when it materially simplifies structured parsing or nontrivial logic.
- Scope searches and reads before widening them. Avoid dumping large directories, diffs, logs, generated/minified files, databases, or huge JSON/JSONL into context.
- Byte-cap unknown or potentially large output; line limits alone are unsafe.

  ```sh
  COMMAND 2>&1 | head -c 4000  # or tail
  ```

  Preserve the underlying command's exit status when it matters.

  ```
  COMMAND | tail -c 5000
  status=${PIPESTATUS[0]}
  exit "$status"
  ```

- Disable progress bars and excessively noisy logs when practical.
- Never let commands block on an interactive editor or pager; use non-interactive flags or environment variables. Example: `GIT_EDITOR=true git rebase --continue`, `git commit -m/-F -`, `--no-edit`, and `--no-pager/PAGER=cat`.
- For nontrivial temporary logic, prefer a small script over a complicated shell one-liner. Add scripts to the repo only when useful beyond the current task.

## Subagents

- Do not launch subagents or delegated workflows without explicit user approval for the current task.
- Proactively suggest them when work can be cleanly partitioned, especially for parallel code exploration, independent investigation, bulk/repetitive implementation, or large reviews. Briefly say what would be delegated and why.
- Approval is task-specific, not a standing default.

## Code and validation

- Follow the stepdown rule where possible: if `A` calls `B`, define `A` before `B` so files read top-down.
- During code review, do not be overly agreeable merely to preserve harmony or close findings. Likewise, do not cling to a position when evidence or sound reasoning shows it to be wrong.
- After edits are stable, run the relevant formatter, linter, type checks, tests, and build steps. Match validation effort to the scope and risk of the change.
- Add or update tests when behavior changes or when fixing a regression; prefer outcome-focused tests over implementation details.
- Update docs when behavior, commands, public APIs, architecture, or operational steps change.

## AGENTS.md hygiene

- Update project-local `AGENTS.md` only with important, durable, non-obvious guidance future agents need.
- Do not add transient status, feature details, file listings, review history, or facts readily discoverable from the code.
