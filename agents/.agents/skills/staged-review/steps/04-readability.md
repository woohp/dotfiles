# Step 4: Readability

**Applies when:** always.

Look for code a teammate would have to read twice.

- **Long or tangled functions.** Functions with several phases, or hard to follow in one read.
  There's no line limit, so use judgment. Clarify the flow in place first. Extract a helper when
  its name makes a distinct operation clearer, and don't create forwarding layers.
- **Repeated conditions that mean different things.** For example, three `if row is None` checks
  in a row, each for a different reason.
- **Awkward returns.** Tuples whose parts overlap, or a docstring that disagrees with what comes
  back.
- **Control flow by exception.** Raising only to catch it a few lines down.
- **Names that mislead.** A flag that is true on failure, a helper named for reads that also
  writes, a boolean parameter whose `False` means the opposite action.
- **One concept, many names.** The same distinction called different things across code, docs
  and tests. Pick one.
- **Tests that are hard to follow.** Setup, action or expected result that's hard to pick out,
  and fixture names that are hard to tell apart. Which cases to keep belongs to the tests lens.

Skip anything the formatter or linter already enforces.
