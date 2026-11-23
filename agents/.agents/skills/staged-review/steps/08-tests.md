# Step 8: Tests

**Applies when:** the change adds or changes tests, or changes behavior.

A test earns its place when it guards one of these:

- **A decision.** A rule someone chose that a plausible edit would undo, such as an access check,
  a threshold or an ordering.
- **A contract.** A file or response that another reader parses, in another language or repo.
- **A bug that happened.** Something that broke, with the input that broke it.

Then check:

- **Missing tests.** Changed behavior or a fixed regression without a test that would catch it
  coming back.
- **Tests to cut.** Tests that restate the code, pad the count, cover edge cases nobody chose, or
  assert things the code can't do. One test for the rule, not one per input class.
- **Assertions.** Assert outcomes, not implementation details. Brittle, noisy or redundant
  assertions cost every later diff.
- **Fixtures.** The smallest set that covers the cases. Add a contract fixture only where two
  readers could disagree about the same input.

If the project has its own test guide or skill, often named in `AGENTS.md`, apply it as well.
Where the two differ, the project's guide wins.
