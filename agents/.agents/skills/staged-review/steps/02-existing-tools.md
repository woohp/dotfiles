# Step 2: Existing tools

**Applies when:** the change adds its own logic for parsing, querying, numeric work, validation,
retries, scheduling, formatting or anything else that a library or tool commonly solves.

Look for hand-rolled code where an existing tool already does the job well.

- **Data work.** Loops that filter, join or aggregate CSV or Parquet files belong in DuckDB or
  Polars. Array math in Python loops belongs in NumPy. Model fitting and scoring belong in
  scikit-learn or the project's existing library.
- **Parsers and formats.** Hand-split CSV, regex-parsed JSON, HTML, dates or URLs, and
  hand-built Excel or PDF output.
- **Validation and serialization.** Field-by-field checks that a schema library such as Pydantic
  or zod would express in one declaration.
- **The standard library.** Hand-written versions of `collections.Counter`, `itertools`,
  `pathlib`, `functools.cache`, `argparse` and similar.
- **The project's own helpers.** A second copy of something the repo already has. Search the
  repo before proposing a new dependency.

Before recommending a tool, check that it actually fits. Probe it on the real input if you can,
and say what it replaces. Weigh what it costs: a new dependency, its size where bundles have
limits, and its maintenance. Recommend it when it removes meaningful code or a class of bugs,
not to swap ten clear lines for an import.
