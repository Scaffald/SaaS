---
pillar: "Supabase & Backend"
status: active
last_verified: 2026-03-10
packages:
  - packages/supabase/
key_files:
  - packages/supabase/functions/
  - packages/supabase/migrations/
  - packages/supabase/config.toml
critical_constraints:
  - "All edge functions use Deno runtime, not Node.js"
  - "Migrations are sequential and must never be modified after deployment"
  - "RLS is enabled on all tables — always add policies"
  - "Use pnpm supa wrapper commands, not supabase CLI directly"
---

# Supabase & Backend — Edge Functions, Migrations, Database

## Edge Function Conventions

All edge functions live in `packages/supabase/functions/` and run on **Deno runtime** (not Node.js).

- Shared utilities go in `packages/supabase/functions/_shared/`
- Each function has its own directory with an `index.ts`
- JWT verification is disabled per-function in `config.toml` — functions verify auth in code via `supabase.auth.getUser(token)`

### Function Registration

Every new edge function must be registered in `packages/supabase/config.toml`:
```toml
[functions.my-new-function]
verify_jwt = false
```

## Database Migrations

### Naming Convention
```
NNN_description.sql
```
Where `NNN` is a sequential number (e.g., `401`, `402`).

### Rules
- **Never modify** a migration after it has been deployed to any environment
- Always wrap in `BEGIN; ... COMMIT;` for transactional safety
- Use `IF NOT EXISTS` / `IF EXISTS` for idempotent operations
- Include comments explaining the purpose of the migration

### Schema Organization
| Schema | Purpose |
|--------|---------|
| `core` | Core application tables (profiles, teams, organizations) |
| `data` | Data/reference tables |
| `onet` | O*NET occupational data (1,016+ occupations) |
| `engagement` | Social features (connections, views, reviews) |
| `logs` | Logging and feedback data |
| `public` | Supabase default (auth helpers, extensions) |

### RLS (Row Level Security)
RLS is enabled on all tables. Every new table must include:
1. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
2. At minimum: a `service_role` full-access policy and user-scoped select/insert policies
3. Use `auth.uid()` for user-scoped policies

## CLI Commands

Always use the `pnpm supa` wrapper instead of `supabase` CLI directly:

```bash
pnpm supa start          # Start local Supabase
pnpm supa stop           # Stop local Supabase
pnpm supa status         # Check status
pnpm supa:functions      # Start edge functions
pnpm supa db reset       # Reset database (runs all migrations + seeds)
pnpm supa migration new  # Create new migration file
```

## Deploying migrations to dev / preview / prod

Each env has its own wrapper. Always link first, dry-run, then push:

```bash
cd packages
pnpx supabase link --project-ref <env-ref>
pnpx supabase db push --linked --dry-run --yes   # always read this first
pnpx supabase db push --linked --yes
```

Project refs:

| Env | Ref | Notes |
|---|---|---|
| dev | `pmtdqrfpumqwkdhpgwcz` | History was misaligned pre-2026-05-22, see audit |
| preview | `uhjkipdwayqfihkanabk` | Use as the gold-standard reference schema |
| prod | `qmfmpcyxsihhfttvqpbw` | Same realignment as dev pre-2026-05-22 |

### `db push` says "Remote migration versions not found in local"

Two known causes:

1. **Version-format drift.** The `supabase_migrations.schema_migrations`
   table has rows with `NNN_descriptor_name` format, but CLI v2.x+ writes
   `NNN` (numeric prefix only). Symptom: CLI lists every remote row
   as missing-in-local but the files clearly exist. Fix is a one-shot
   SQL update applied via Supabase dashboard SQL editor:
   ```sql
   UPDATE supabase_migrations.schema_migrations
      SET version = split_part(version, '_', 1)
    WHERE version ~ '^[0-9]+_';
   ```
   Then `db push` works.

2. **Stale rows from an older tool.** Remote has rows like
   `20251121083706` that don't match any local file. Revert them:
   ```bash
   pnpx supabase migration repair --status reverted \
     20251121083706 20251121090000 ... --linked
   ```

See `docs/agents/audits/2026-05-22-supabase-schema-drift.md` for the
full investigation that surfaced both.

### `migration repair --status applied` is a record-only operation

`repair` writes a row into `supabase_migrations.schema_migrations`. It
does **not** run the migration's SQL. Only use it when the migration
has *already been applied via some other path* (dashboard, older CLI,
psql) and you're just teaching the history table about it. **Never
use it to "skip" a migration whose SQL hasn't run** — the schema will
diverge from the history.

### Migration idempotency

If a migration might be re-run during catch-up reconciliation, it must
tolerate existing objects:

- `CREATE TABLE IF NOT EXISTS`
- `CREATE INDEX IF NOT EXISTS`
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- `DROP POLICY IF EXISTS X; CREATE POLICY X ...` (the only "if not
  exists" pattern for policies)
- `CREATE OR REPLACE FUNCTION`
- For types/enums, guard with `DO $$ BEGIN IF NOT EXISTS (SELECT FROM
  pg_type WHERE typname = 'X') THEN CREATE TYPE X AS ENUM ...; END IF;
  END $$;`

The drift audit (2026-05-22) found ~12 migrations that weren't idempotent
and need hardening before they can be re-applied. Each gets its own PR
that adds the guards and re-tests.

### Nightly drift detection

`.github/workflows/supabase-drift-audit.yml` runs nightly against all
three envs and fails if any env has drift between local + remote
migration history. Re-link a project (or break the CI run) only after
confirming the env is in sync.

## Environment Variables

- Edge functions read env vars via `Deno.env.get('VAR_NAME')`
- Local config in `packages/supabase/.env.local`
- Auth provider secrets use `env(VAR_NAME)` syntax in `config.toml`
- Required vars for auth: `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `GOOGLE_SECRET`, `APPLE_CLIENT_ID`, `APPLE_SECRET`

## Auth Configuration

- Site URL: `http://localhost:5173` (Forsured web) or `http://127.0.0.1:8081` (Scaffald Expo)
- JWT expiry: 3600 seconds (1 hour)
- External providers: Google and Apple (both enabled)
- Email confirmations: enabled
- Skip nonce check: true (for mobile OAuth)
