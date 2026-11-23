# Step 9: Security and data handling

**Applies when:** the change touches authentication or permissions, logging, error messages,
external input, secrets, files, or user or client data.

- **Authorization.** New actions, routes and service calls check who is calling, and whether
  they may touch the specific record or tenant, not just whether their role allows the action.
- **Untrusted input.** Validated where it enters, such as request bodies, uploads or other
  services' responses. Don't repeat checks that parsing or the type system already guarantees.
- **Data in the wrong place.** Personal or client data in logs, telemetry, exception messages,
  test fixtures or committed files.
- **Secrets.** Keys, tokens or connection strings in code, config or fixtures.
- **Injection.** SQL, shell commands and HTML treat untrusted values as data, through parameters
  or escaping. Strings built only from constants are fine.

Apply the project's written data rules too. `AGENTS.md` often states what may never be
committed or sent where.
