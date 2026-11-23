# Step 5: Language and library idioms

**Applies when:** always, once for each language and major library in the diff.

Flag clear departures from the conventions of the language, its libraries and its tools.
Check the project's configuration before calling something a violation: the language version,
the test runner's mode, linter rules, plugins. Newer syntax that the configured version allows
is not a violation.

- **Language.** Standard naming, such as an `Error` suffix on Python exception classes.
  Durations as duration types, not millisecond integers carried over from another language. One
  style for type aliases and similar constructs within a package.
- **Data access.** An ORM or query builder in one module and raw SQL strings in the next.
  Upserts that swallow every conflict without naming the expected ones.
- **Logging and telemetry.** Caught errors reported with the error, the way the library intends.
- **Tests.** The framework's own features, such as parametrize instead of a loop over cases.
  Deterministic fixture data over random values.
- **Tool conventions.** Migration helpers versus raw SQL, matching the project's existing
  migrations.

Note what you checked and found fine when it looks unusual, so the next reader doesn't re-check
it.
