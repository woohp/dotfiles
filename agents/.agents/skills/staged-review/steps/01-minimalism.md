# Step 1: Minimalism

**Applies when:** always.

Look for complexity the task doesn't need, in production code and tests alike. Call it slop when
it is, and name what it costs.

- **Speculative surface.** Functions, parameters, columns, indexes or constraints that nothing
  uses. Check the stack before calling something unused.
- **Indirection.** Wrappers and re-export modules that add no behavior or useful boundary, and
  layers with one caller.
- **Duplication.** The same rule written twice, for example a timeout in two languages or two
  near-identical queries in one file.
- **Disproportionate handling.** Machinery for a rare local race, or validation of states the
  types already rule out.
- **Docs that restate the code.** Prose copies of constraints, signatures or SQL that will drift.
- **Scope creep.** Cleanup or features unrelated to the PR's purpose.
- **Tests.** Setup that buries a simple case, assertions about things the code can't do, and
  production functions that exist only for tests.

Before proposing a cut, check which behavior must stay. If a requirement is unclear, say so.
Prefer the smallest change that keeps behavior and clarity, and don't propose an abstraction that
adds more than it removes.
