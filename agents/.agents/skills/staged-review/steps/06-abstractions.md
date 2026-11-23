# Step 6: Abstractions and class structure

**Applies when:** the change adds or changes a class, an interface, a module boundary, or how a
group of functions shares state.

- **Classes without a reason.** Prefer a function when a method needs neither instance state nor
  a class contract.
- **State without a class.** Group functions in a class when they share responsibility for a
  dependency or its lifetime, such as an engine or client they all reach for as a global.
- **Forwarding layers.** A class whose methods only call module functions writes each operation
  two or three times: the function, the interface signature and the pass-through. Keep it only
  if it owns a real boundary, such as a public API or a dependency's lifetime. Otherwise make the
  real work the methods, or drop the class.
- **Interfaces.** In Python, use an abstract base class for a contract implemented by explicit
  subclassing, and a protocol for a structural or external contract.
- **Alternate constructors.** Keep a `from_row`-style classmethod when it centralizes conversion
  or validation that callers would otherwise repeat.

Look at how later PRs in the stack use the code before recommending a change. If the decision
belongs to a later PR, say so and point at it.
