# Step 7: Performance

**Applies when:** always. Database checks apply only when the change adds or changes queries or
migrations.

## Code

- **Data structures.** Membership tests on a list where a set or dict belongs, repeated scans of
  a list to find one item, and a queue built on `list.pop(0)` where a `deque` belongs.
- **Algorithms.** Nested loops over the same data that a dict lookup, a sort or a join would
  turn from quadratic into linear.
- **The right tool.** Row-by-row Python over arrays or tables that NumPy, Polars or DuckDB would
  do in one vectorized call.
- **Repeated work.** Recompiling, reparsing or refetching inside a loop what could be done once
  before it.
- **Memory.** Loading a whole file or result set when streaming or batching would do.
- **I/O.** Sequential network or file calls that could run concurrently, and calls made inside
  a loop.

## Database

- **N+1.** A query per item inside a loop. Bulk inserts and single joins are fine.
- **Index fit.** Each new query's filters and sorts have an index to use. Each new index has a
  query that uses it, since indexes cost every write.
- **Round trips.** Statements per request or per action, and whether an extra query re-reads a
  row the caller already loaded.
- **Transactions.** Held open across network or file I/O.
- **Migrations.** Rewrites and validation scans, sized by the table.

Say how big the data is and how often the path runs. Don't flag things that only matter at a
scale the project won't reach. If something will matter at a plausible scale, say at what point.
