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
- **Unused structure.** Indexes and unique constraints that no query or foreign key uses. Check
  the queries, including further up the stack.
- **Index shape.** Leading columns should match the filters, usually the tenant or client first.
  `DESC` on a single-column sort buys nothing.
- **Checks that don't check.** Loose patterns, such as a GUID regex that takes any hyphen
  placement, or a text column where a native type exists.
- **Names.** Let the tools name constraints and indexes. With SQLAlchemy, declare a
  `naming_convention` on the metadata once and leave `name=` off, or let the database pick its
  defaults. Name one by hand only when something needs that exact name, such as an existing
  constraint the migration tool compares by name. Refer to constraints by their columns where
  the API allows it, for example `on_conflict_do_nothing(index_elements=[...])` over
  `constraint="..."`. When a name is hand-written, it says what the constraint checks, not a
  version or a ticket.

## Migration safety

- **Locks and rewrites.** Volatile defaults rewrite the table. Adding a constraint scans it.
  Is there a lock timeout, and how big is the table?
- **Running code.** Does code deployed now keep working mid-deploy? Add before use, drop after.
- **Backfills and defaults.** Existing rows must pass every new constraint.
- **Order and conflicts.** Which environments migrate when. Two open migrations off the same
  parent revision.
- **Rollback.** Follow the project's convention.

## Mirrors

Hand-kept copies of the schema, such as ORM models, a second language's schema file, or docs,
must agree with the migration. Find out what actually compares them. For example, Alembic
compares check constraints by name only unless configured otherwise, so their bodies can drift
unnoticed.
