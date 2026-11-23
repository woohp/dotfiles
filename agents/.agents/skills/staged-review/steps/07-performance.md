# Step 7: Performance

**Applies when:** always. The database checks apply when the change alters query count, query
shape, indexes or transaction scope.

## Code

- **Data structures.** Membership tests on a list where a set or dict belongs, repeated scans of
  a list to find one item, and a queue built on `list.pop(0)` where a `deque` belongs.
- **Algorithms.** Repeated scans of the same data that a lookup table, sort, join or batch
  operation would avoid.
- **The right tool.** Row-by-row Python over arrays or tables that NumPy, Polars or DuckDB would
  do in one vectorized call.
- **Repeated work.** Recompiling, reparsing or refetching inside a loop what could be done once
  before it.
- **Memory.** Loading a whole file or result set when streaming or batching would do.
- **I/O.** Sequential network or file calls that could run concurrently, and calls made inside
  a loop.

## Database

- **N+1.** A query per item inside a loop, including a new loop in a caller around an unchanged
  query.
- **Index fit.** Leading columns match the filters, usually the tenant or client first. `DESC` on
  a single-column sort buys nothing. Judge each index against the query cost it saves and the
  write load it adds. A small table may need none.
- **Round trips.** Statements per request or per action, and whether an extra query re-reads a
  row the caller already loaded.
- **Transactions.** Held open across network or file I/O.

Migration locks, scans and rewrites belong to the database lens.

Report the expected data size and how often the path runs. If you don't know them, state your
assumptions and the point at which the cost would start to matter. Don't flag what only matters
at a scale the project won't reach.
