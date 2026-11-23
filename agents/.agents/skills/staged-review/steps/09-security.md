# Step 9: Security and data handling

**Applies when:** the change touches authentication or permissions, logging, error messages,
external input, secrets, files, or user or client data.

- **Authorization.** New actions, routes and service calls check who is calling, and with what
  role or access level.
- **Untrusted input.** Validated where it enters, such as request bodies, uploads or other
  services' responses. Don't ask for validation of invariants the types already guarantee.
- **Data in the wrong place.** Personal or client data in logs, telemetry, exception messages,
  test fixtures or committed files.
- **Secrets.** Keys, tokens or connection strings in code, config or fixtures.
- **Injection.** SQL, shell or HTML built from untrusted values. Strings built from constants
  are fine.

Apply the project's written data rules too. `AGENTS.md` often states what may never be
committed or sent where.
