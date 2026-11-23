# Step 4: Readability

**Applies when:** always.

Look for code a teammate would have to read twice.

- **Long or tangled functions.** Roughly 40 lines or more, or several phases in one body. Name
  the phases as helpers.
- **Repeated conditions that mean different things.** For example, three `if row is None` checks
  in a row, each for a different reason.
- **Awkward returns.** Tuples whose parts overlap, or a docstring that disagrees with what comes
  back.
- **Control flow by exception.** Raising only to catch it a few lines down.
- **Names that mislead.** A flag that is true on failure, a helper named for reads that also
  writes, a boolean parameter whose `False` means the opposite action.
- **One concept, many names.** The same distinction called different things across code, docs
  and tests. Pick one.
- **Tests that read as scripts.** A long sequence of steps checking several behaviors, or fixture
  names that are hard to tell apart.

Skip anything the formatter or linter already enforces.
