# Step 3: Database design and migration safety

**Applies when:** the change touches migrations, ORM models, schema files or SQL.

## Design

- **Table shape.** Two kinds of rows forced into one table show up as nullable columns, a
  `CASE`-style check that decides which columns each kind fills, and uniques that apply to one
  kind only. Ask whether they are two tables.
- **References.** A column that points at another row wants a foreign key. An array of ids is a
  many-to-many relation the database can't check, so ask whether it should be a join table. A
  pointer to something outside the database, like an external run id, is provenance, and plain
  text is right.
- **Integrity applied halfway.** Composite keys that guard one dimension, such as the client,
  but not another the same design guards elsewhere, such as the source.
- **Redundant structure.** Indexes that no query or foreign key uses, and indexes or constraints
  that duplicate others. Keep a constraint that enforces a required rule even if no query uses
  it. How well indexes fit the queries belongs to the performance lens.
- **Checks that don't check.** Loose patterns, such as a GUID regex that takes any hyphen
  placement, or a text column where a native type exists.
- **Names.** Use the project's naming convention or the database's defaults. With SQLAlchemy,
  that means a `naming_convention` on the metadata and no `name=`. Give a name by hand only when
  a caller or migration needs that exact name. Prefer column targets where the API allows them,
  such as `on_conflict_do_nothing(index_elements=[...])`. A hand-written name says what the
  constraint enforces, not a version or a ticket.

## Migration safety

- **Locks and rewrites.** Check which statements lock, scan or rewrite a table on the deployed
  database version. Estimate the cost from the table's size, and check the lock timeout.
- **Rollout.** Old and new code must both work while the deploy is in progress.
- **Backfills.** Backfill before enforcing a constraint, so existing rows pass it.
- **Order and conflicts.** Check the migration order in each environment, and whether other open
  PRs create conflicting revisions.
- **Rollback.** Follow the project's convention, and name any step it can't undo.

## Mirrors

Compare the migration with any hand-kept copies of the schema, such as ORM models, a second
language's schema file, or docs. Check what the project's tooling actually compares, including
whether it notices a change to a constraint's expression.
