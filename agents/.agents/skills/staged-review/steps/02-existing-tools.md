# Step 2: Existing tools

**Applies when:** the change adds its own logic for parsing, querying, numeric work, validation,
retries, scheduling, formatting or anything else that a library or tool commonly solves.

Look for hand-rolled code where an existing tool already does the job well.

- **Data work.** Consider DuckDB or Polars for filtering, joining or aggregating CSV or Parquet
  files, NumPy for array math, and the project's modeling library, such as scikit-learn, for
  fitting and scoring.
- **Parsers and formats.** Hand-split CSV, regex-parsed JSON, HTML, dates or URLs, and
  hand-built Excel or PDF output.
- **Validation and serialization.** Field-by-field checks that a schema library such as Pydantic
  or zod would express in one declaration.
- **The standard library.** Hand-written versions of `collections.Counter`, `itertools`,
  `pathlib`, `functools.cache`, `argparse` and similar.
- **The project's own helpers.** A second copy of something the repo already has. Search the
  repo before proposing a new dependency.

Check that the tool keeps the required behavior on representative input, and name the code or
failure mode it removes. Weigh the dependency, its maintenance, and its size where bundles have
limits. Keep simple code when the tool doesn't improve it. Arguments about speed alone belong to
the performance lens.
