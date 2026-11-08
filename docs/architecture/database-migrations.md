# Backend database migrations

The Ent definitions in `services/backend/ent/schema` are the application
schema source of truth. Use the pinned Atlas CLI v1.3.0 documented in
[`tooling.md`](tooling.md). Atlas compares `ent://ent/schema` against the
versioned migration directory, using a throwaway PostgreSQL 16 dev database.
The configured `docker://` dev URL is Atlas's schema-diff database; it is not
the project Compose database and has no persistent volume.

From `services/backend`:

```sh
go generate ./ent
atlas migrate diff --env local initial_v3_schema
atlas migrate validate --env local --dev-url 'docker://postgres/16/dev?search_path=public'
```

Review generated SQL and `atlas.sum` before applying anything. The following
commands are for a deliberately selected disposable target only; this Phase 2
does not apply migrations to any database:

```sh
atlas migrate status --dir file://migrations --url "$DATABASE_URL"
atlas migrate apply --dir file://migrations --url "$DATABASE_URL"
```

Set `DATABASE_URL` explicitly in the shell to a disposable database before
using status or apply. Never point these commands at a persistent local or
production database without reviewing and approving the migration first.
Atlas v1.3.0 `migrate validate --dev-url ...` executes the generated migration
files in its disposable dev database to check PostgreSQL SQL semantics; it
does not apply them to the configured deployment target.
