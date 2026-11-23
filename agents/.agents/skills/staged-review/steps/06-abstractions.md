# Step 6: Abstractions and class structure

**Applies when:** the change adds classes, interfaces or modules, or a group of functions that
share state or a dependency.

- **Classes without state.** Methods that never use `self` are module functions.
- **State without a class.** Functions that all reach for the same global, such as an engine or
  client, might be one class that takes it in its constructor.
- **Forwarding layers.** A class whose methods only call module functions writes every operation
  two or three times: the function, the interface signature and the pass-through. Make the real
  work the methods, or drop the class.
- **Interfaces.** For an interface the project owns and implements by explicit subclassing,
  prefer an abstract base class. Keep structural protocols for loose or external contracts.
- **Alternate constructors.** A `from_row`-style classmethod earns its place with several
  construction sites, not one.

Look at how later PRs in the stack use the code before recommending a change. If the decision
belongs to a later PR, say so and point at it.
