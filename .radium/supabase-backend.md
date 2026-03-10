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
