# Step 2: Existing tools

**Applies when:** the change adds its own logic for parsing, querying, numeric work, validation,
retries, scheduling, formatting or anything else that a library or tool commonly solves.

Look for hand-rolled code where an existing tool already does the job well.

- **Data work.** Loops that filter, join or aggregate tabular files, array math done one element
  at a time, and hand-written model fitting or scoring. Consider a query engine or dataframe
  library, an array library, or the project's modeling library. For example, in Python: DuckDB
  or Polars, NumPy, scikit-learn.
- **Parsers and formats.** Hand-split CSV, regex-parsed JSON, HTML, dates or URLs, and
  hand-built Excel or PDF output.
- **Validation and serialization.** Field-by-field checks that a schema library would express in
  one declaration, for example Pydantic in Python or zod in TypeScript.
- **The standard library.** Hand-written versions of what it already provides, for example
  `collections.Counter`, `itertools` or `pathlib` in Python, or `URL` or `structuredClone` in
  TypeScript.
- **The project's own helpers.** A second copy of something the repo already has. Search the
  repo before proposing a new dependency.

Check that the tool keeps the required behavior on representative input, and name the code or
failure mode it removes. Weigh the dependency, its maintenance, and its size where bundles have
limits. Keep simple code when the tool doesn't improve it. Arguments about speed alone belong to
the performance lens.
