# Supabase Seeds

This directory contains all seed data for development and testing environments. Seeds are separated by concern to make it easier to maintain and selectively apply data.

## How seeding runs

When you run `pnpm supa db reset`, Supabase applies all migrations and then runs **every `seeds/*.sql` file** in alphabetical order (see `config.toml` → `[db.seed]` → `sql_paths = ['./seeds/*.sql']`). There is no single `seed.sql` orchestrator; the glob runs each `.sql` file directly.

## Seed Files

### Core Seeds (run automatically on `pnpm supa db reset`)

These files run in glob order when you run `pnpm supa db reset`:

1. **`001_seed-industries.sql`** – 4 industries (Construction, Manufacturing, Transportation, Energy)
2. **`002_seed-users.sql`** – 50 realistic users with full profiles, auth accounts, and geographic distribution
3. **`002a_seed-api-test-user.sql`** – API test user for automation: `test@example.com` / `test123456` (used by `scripts/test-api-local.ts` and SDK integration tests)
4. **`003_seed-organizations.sql`** – 8 sample organizations across different locations
5. **`004_seed-unicorn-org.sql`** – Unicorn organization and 3 initial jobs

**Disabled:** **`005_seed-ats-data.sql.disabled`** – ATS demo data (8 demo jobs, 18 applications, messages). Not run by default. To use it, rename to `005_seed-ats-data.sql` or run manually: `pnpm supa db seed --file seeds/005_seed-ats-data.sql`. See [Optional/Specialized Seeds](#optional-specialized-seeds-run-manually) for details.

### Optional/Specialized Seeds (Run Manually)
- **`seed-affiliates.sql`** – Affiliate program partners (OSHA, NIMS, etc.)
- **`seed-soft-skills.sql`** – Soft skills taxonomy (35 skills across 4 categories)
- **`seed-test-users.sql`** – Three specific test users for manual testing
- **`seed-super-admins.sql`** – Super admin role assignments for core team
- **`seed-job-feeds.sql`** – External RSS job feed configurations

## Usage

### Using Supabase CLI (Recommended)
```bash
# Run all core seeds (happens automatically on db reset)
pnpm supa db reset

# Run only SQL seeds without reset (re-run all seeds/*.sql)
pnpm supa db seed

# Seed a specific file
pnpm supa db seed --file seeds/seed-affiliates.sql
```

### Using psql
```bash
# From project root; run individual seed files as needed
psql $DATABASE_URL -f packages/supabase/seeds/001_seed-industries.sql
psql $DATABASE_URL -f packages/supabase/seeds/seed-affiliates.sql
```

### Using the TypeScript Seeder
```bash
# Seed CSI skills taxonomy
pnpm --filter @app/supabase seed:csi
```

## Seed Data Organization

### Why Seeds vs Migrations?
- **Migrations** = Schema changes (structure, functions, policies)
- **Seeds** = Sample data for development and testing

## Development Workflow

### Seed for API testing

Use this sequence to get a consistent database and run API tests:

1. **Start Supabase** (if not already): `pnpm supa start`
2. **Reset DB and run SQL seeds**: `pnpm supa db reset` (applies migrations and runs all `seeds/*.sql`)
3. **Optional – TypeScript reference data**: `pnpm supa:seed` (CSI, jobs, O*NET, etc.). Only needed for tests that require O*NET, CSI, or external jobs.
4. **Serve the API** (separate terminal): `pnpm supa functions serve api` (or see [API_TESTING_GUIDE](../../../docs/API_TESTING_GUIDE.md)) so smoke script and REST tests can hit the API.

You can also use the helper script from repo root: `pnpm supa:seed:api` (or `./scripts/seed-for-api-testing.sh`). Use `FULL_SEED=1` to run the TypeScript seeder after reset.

### Initial Setup
```bash
# Start Supabase
pnpm supa start

# Run migrations and all seeds/*.sql
pnpm supa db reset
```

### Selective Seeding
```bash
# Add only ATS demo data
pnpm supa db seed --file seeds/005_seed-ats-data.sql

# Add only affiliates
pnpm supa db seed --file seeds/seed-affiliates.sql

# Add only soft skills
pnpm supa db seed --file seeds/seed-soft-skills.sql

# Add test users
pnpm supa db seed --file seeds/seed-test-users.sql
```

### Refreshing Data
```bash
# Reset database and rerun all seeds/*.sql
pnpm supa db reset

# Or run only SQL seeds (no migration reset)
pnpm supa db seed
```

## Seed Data Contents

### 001_seed-industries.sql
- 4 base industries with descriptions
- Construction, Manufacturing, Transportation, Energy

### 002_seed-users.sql (largest file)
- 50 unique realistic users with diverse:
  - Names, headlines, and specialties
  - Geographic distribution across 29 cities
  - Phone numbers with proper area codes
  - Complete auth.users entries with encrypted passwords
  - Full core.users profiles
  - core.profile entries
  - core.preferences with user settings
- 29 geographic hubs spanning midwest/northeast US
- Realistic certifications (OSHA, CDL, etc.)
- Industry assignments
- Travel preferences and availability

### 003_seed-organizations.sql
- 8 sample organizations
- Distributed across MI and OH
- Includes geographic data (lat/lon)
- Linked to industries

### 005_seed-ats-data.sql (optional; file is disabled by default as 005_seed-ats-data.sql.disabled)
- **8 Demo Jobs**: Various construction and trade positions across multiple organizations
  - Commercial Electrician, Licensed Plumber, Carpenter, Construction Project Manager
  - Site Supervisor, HVAC Technician, Heavy Equipment Operator, Safety Coordinator
  - Mix of full-time positions with different employment types and locations
  - Realistic job descriptions, pay ranges, and geographic coordinates
- **18 Candidate Applications**: Applications distributed across all workflow stages
  - Statuses: pending, reviewing, interview, offer, hired, rejected, withdrawn, stale
  - Multiple applications per job (2-4 candidates per job)
  - Some applications include resume URLs, cover letters, and application answers
  - Realistic timestamps showing application progression
- **Application Messages**: Sample communication between candidates and organizations
  - Messages for applications in reviewing, interview, and offer stages
  - Demonstrates communication tracking in the ATS workflow

**Note:** This seed file is idempotent and can be safely run multiple times. It uses `ON CONFLICT DO NOTHING` to prevent duplicate data.

### seed-affiliates.sql
- OSHA 30-Hour Construction Training
- HAZWOPER 40-Hour Certification
- NIMS CNC Operator Certification
- Build Your Future Craft Training

### seed-soft-skills.sql
- **Reliability**: 10 skills (deadline management, time management, etc.)
- **Collaboration**: 9 skills (teamwork, communication, etc.)
- **Professionalism**: 9 skills (work ethic, leadership, etc.)
- **Technical**: 7 skills (craftsmanship, innovation, etc.)

### seed-test-users.sql
Three specific test users for manual testing:
- `testuser1@example.com` - John Smith (Construction) - Password: `TestUser123!`
- `testuser2@example.com` - Sarah Johnson (Manufacturing) - Password: `TestUser123!`
- `testuser3@example.com` - Mike Wilson (Transportation) - Password: `TestUser123!`

**Note**: The 50 users in seed-users.sql use:
- Usernames: `seeduser_1` through `seeduser_50`
- Emails: `firstname.lastname.N@example.test` (e.g. `marcus.washington.1@example.test`)
- Password: `SeedUser123!` (for all seed users)

### seed-super-admins.sql
Assigns super_admin role to core team members (production emails only)

### seed-job-feeds.sql
- WeWorkRemotely RSS feeds (All Jobs, Programming, Design)

## Best Practices

1. **Keep seeds idempotent** - Use `ON CONFLICT DO NOTHING` or `ON CONFLICT DO UPDATE`
2. **Use transactions** - Wrap seeds in `BEGIN`/`COMMIT` blocks
3. **Document changes** - Update this README when adding new seed files
4. **Test locally** - Always test seed files locally before committing
5. **Separate concerns** - Create new seed files for distinct data types
6. **Don't mix with migrations** - Schema changes go in migrations, sample data goes in seeds

## Troubleshooting

### Seed fails with "relation does not exist"
Run migrations first: `pnpm supa db reset`

### Seed data not appearing
Check if you're connected to the right database:
```bash
pnpm supa status
```

### Duplicate key errors
Most seed files use `ON CONFLICT` clauses to handle duplicates. If you see errors, check the seed file's conflict handling.

### Need to clear all data
```bash
# Nuclear option - resets everything
pnpm supa db reset

# Or manually delete specific data
psql $DATABASE_URL -c "TRUNCATE TABLE table_name CASCADE;"
```

## Contributing

When adding new seed data:
1. Create a new `.sql` file in this directory
2. Use clear naming: `seed-{feature}.sql`
3. Add transaction wrappers (`BEGIN`/`COMMIT`)
4. Include conflict handling
5. Document the file in this README
6. Test the seed file locally

## Related Documentation

- [SEEDING.md](../docs/SEEDING.md) - Detailed seeding guide
- [BEST_PRACTICES.md](../docs/BEST_PRACTICES.md) - Database best practices
- [Migration Documentation](../migrations/README.md) - Schema migration guide
