# Step 1: Minimalism

**Applies when:** always.

Look for complexity that doesn't pay for itself in the actual task. Call it slop when it is.
Apply this to production code and tests alike.

- **Speculative surface.** Functions, parameters, columns, indexes or constraints that nothing
  uses. Check the stack before calling something unused.
- **Indirection.** Wrappers that only forward, re-export modules, layers with one caller.
- **Duplication.** The same rule written twice, for example a timeout in two languages or two
  near-identical queries in one file.
- **Disproportionate handling.** Machinery for a rare local race, or validation of states the
  types already rule out.
- **Docs that restate the code.** Prose copies of constraints, signatures or SQL that will drift.
- **Scope creep.** Cleanup or features unrelated to the PR's purpose.
- **Tests.** Elaborate fixtures and helpers, scenarios nobody would hit, assertions about things
  the code can't do, and production functions that exist only for tests.

Before recommending a deletion, confirm the behavior isn't required. Say so when a finding
depends on requirements you couldn't pin down. Prefer small, concrete simplifications, and don't
propose an abstraction that adds more than it removes. Fewer lines is a goal only when clarity
survives.
