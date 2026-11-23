# Step 8: Tests

**Applies when:** the change adds or changes tests, or changes behavior.

A test earns its place when it guards one of these:

- **A decision.** A rule someone chose that a plausible edit would undo, such as an access check,
  a threshold or an ordering.
- **A contract.** Behavior a caller or another reader relies on, such as a file format, a
  response shape or a public function's result.
- **A bug that happened.** Something that broke, tested with the input that broke it where
  practical.

Also cover the important happy paths of changed behavior.

Then check:

- **Missing tests.** Changed behavior or a fixed regression without a test that would catch it
  coming back.
- **Tests to cut.** Tests that restate the code, pad the count, cover edge cases nobody chose, or
  assert things the code can't do. One test for the rule, not one per input class.
- **Assertions.** Assert outcomes, not implementation details. Brittle, noisy or redundant
  assertions cost every later diff.
- **Fixtures.** The smallest reproducible set, with deterministic data, not random values. Share
  a contract fixture when independent readers must agree on the same input and output.

If the project has its own test guide or skill, often named in `AGENTS.md`, apply it as well.
Where the two differ, the project's guide wins.
