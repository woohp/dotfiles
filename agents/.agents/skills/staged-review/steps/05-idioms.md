# Step 5: Language and library idioms

**Applies when:** always, once for each language and major library in the diff.

Flag departures from the conventions of the language, its libraries and its tools when they make
the code harder to understand or maintain. Check the project's configuration before calling
something a violation: the language version, the test runner's mode, linter rules, plugins.
Newer syntax that the configured version allows is not a violation.

- **Language.** Standard naming, such as an `Error` suffix on Python exception classes.
  Durations as duration types, not millisecond integers carried over from another language.
- **Data access.** Raw SQL against mapped models where the query builder can express the query
  and would give typed results or checked column names. Upserts that swallow every conflict
  without saying which ones they expect.
- **Logging and telemetry.** Caught errors reported with the error, the way the library intends.
- **Tests.** The framework's own features, such as parametrize instead of a loop over cases.
- **Tool conventions.** Migration helpers versus raw SQL, matching the project's existing
  migrations.

In this step's section, note any unusual choice you verified and why it's fine, so nobody
re-checks it.
