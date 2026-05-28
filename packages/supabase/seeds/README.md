# Supabase Seeds

This directory contains all seed data for development and testing environments. Seeds are separated by concern to make it easier to maintain and selectively apply data.

## How seeding runs

When you run `pnpm supa db reset`, Supabase applies all migrations and then runs **every `seeds/*.sql` file** in alphabetical order (see `config.toml` → `[db.seed]` → `sql_paths = ['./seeds/*.sql']`). There is no single `seed.sql` orchestrator; the glob runs each `.sql` file directly.

> ⚠️ **Reference data is NOT seeded by `db reset`.** The CSI MasterFormat taxonomy
> (`data.masterformat`), `core.skills`, and O*NET occupations (`onet.occupation_data`)
> come from the **TypeScript** seeder, not the SQL seeds. After a `db reset` you must
> also run `pnpm supa:seed` — or use `pnpm supa:reset`, which chains
> `db reset` → `supa seed` → tests. Without it, **skill search returns nothing**
> (empty taxonomy) and O*NET search is unavailable.

## Seed Files

### Core Seeds (run automatically on `pnpm supa db reset`)

These files run in glob order when you run `pnpm supa db reset`:

1. **`001_seed-industries.sql`** – 4 industries (Construction, Manufacturing, Transportation, Energy)
2. **`002_seed-users.sql`** – 50 realistic users with full profiles, auth accounts, and geographic distribution
3. **`002a_seed-api-test-user.sql`** – API test user for automation: `test@example.com` / `test123456` (used by `scripts/test-api-local.ts` and SDK integration tests)
4. **`003_seed-organizations.sql`** – 8 sample organizations across different locations
5. **`004_seed-unicorn-org.sql`** – Unicorn organization (super-admin / employer demo): all `@unicorn.love` users are org members; includes 5 jobs, 3 construction projects, 3 teams, 8 work logs (mixed statuses), and platform/organization roles
6. **`005_seed-demo-prerequisites.sql`** – Demo AccountSwitcher users with completed prerequisites (profiles, industry, preferences)
7. **`006_seed-unicorn-ats.sql`** – Unicorn-only ATS demo: applications for Senior Software Engineer, Full Stack Developer, and Part-Time Estimator jobs (various workflow stages)
8. **`007_seed-wizard-org.sql`** – Wizard Construction organization demo: 7 `@wizard.construction` users, 5 jobs, 3 construction projects, 3 teams, 8 work logs, roles and prerequisites
9. **`008_seed-cross-org-demo.sql`** – Cross-organization interactions: 5 applications between orgs, 4 connections, 3 reviews, "Construction Pros" community with posts/comments, 5 portfolio items, notifications

**Disabled:** **`005_seed-ats-data.sql.disabled`** – Legacy ATS demo (8 demo jobs across multiple orgs, 18 applications). Not run by default. To use it, rename and run manually via psql. See [Optional/Specialized Seeds](#optional-specialized-seeds-run-manually) for details.

### Optional/Specialized Seeds (Run Manually)
- **`seed-affiliates.sql`** – Affiliate program partners (OSHA, NIMS, etc.)
- **`seed-soft-skills.sql`** – Soft skills taxonomy (35 skills across 4 categories)
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
3. **TypeScript reference data**: `pnpm supa:seed` (CSI MasterFormat, `core.skills`, O*NET, jobs, etc.). Required for anything touching skills — **skill search returns empty without it**. Only skip if you're certain your tests don't hit skills/O*NET/CSI.
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

### 004_seed-unicorn-org.sql (Unicorn organization demo)
- **Unicorn** org (slug `unicorn`) owned by clay@unicorn.love; acts as super-admin and employer demo
- **All @unicorn.love users** (zach, clay, marc, test) are org members (organization admin role) and have platform `super_admin`
- **5 jobs**: Senior Software Engineer, Construction Project Manager, Full Stack Developer, Site Superintendent (closed), Part-Time Estimator
- **3 construction projects**: HQ Renovation, Warehouse Build, Office Fit-Out (for work logs)
- **3 teams**: Engineering, Operations, Hiring (all @unicorn.love users as members)
- **8 work logs**: draft, pending_verification, and verified statuses across projects and users
- Idempotent: safe to re-run `pnpm supa db reset`

### 005_seed-demo-prerequisites.sql
- Demo AccountSwitcher users with completed onboarding (profiles, address, geo, industry, user_types, prerequisites_completed_at)
- Covers clay@unicorn.love, zach@unicorn.love, and four other demo users (e.g. brian.carter@wizardconstruction.com, marcus.rivera@example.test)

### 006_seed-unicorn-ats.sql
- Applications for Unicorn jobs only (Senior Software Engineer, Full Stack Developer, Part-Time Estimator)
- Uses seeded worker users from 002; statuses: new, screen, interview, offer
- Run automatically with core seeds

### 007_seed-wizard-org.sql (Wizard Construction organization demo)
- **Wizard Construction** org (slug `wizard-construction`) owned by brian.carter@wizard.construction; acts as second employer demo org alongside Unicorn
- **7 @wizard.construction users**: Brian Carter (President), Sarah Mitchell (PM), Derek Johnson (Foreman), Maria Gonzalez (Estimator), Tyler Brooks (Apprentice), Ron Mitchell (Safety Officer), James Okafor (Superintendent)
- **5 jobs**: Commercial Electrician, Plumbing Foreman, Safety Coordinator, Heavy Equipment Operator, HVAC Technician (closed)
- **3 construction projects**: Detroit Metro Office Complex, Ann Arbor University Dormitory, Dearborn Industrial Retrofit
- **3 teams**: Field Operations, Safety & Compliance, Estimating & Pre-Con (all users as members)
- **8 work logs**: draft, pending_verification, and verified statuses across projects
- **Roles**: brian.carter, sarah.mitchell, maria.gonzalez, ron.mitchell as org admins; all users have platform office role
- **Prerequisites**: All users have completed onboarding (industry, profiles, user_types)
- User IDs: `33333333-3333-3333-3333-33333333330X`
- All users share password: `password123`

### 008_seed-cross-org-demo.sql (Cross-organization interactions)
- **5 cross-org applications**: Workers applying across Unicorn ↔ Wizard (statuses: new, screen, interview)
- **4 connections**: 2 accepted (Brian↔Clay, Sarah↔Zach), 2 pending (Derek↔Marcus, Maria↔Jake)
- **3 reviews**: Cross-org peer reviews and recommendations
- **Community**: "Construction Pros" community with 8 verified members from both orgs, 4 published posts (2 showcase, 2 advice), 3 comments
- **5 portfolio items**: Project showcases from both Unicorn and Wizard users
- **6 notifications**: Application received + connection request notifications
- Depends on seeds 004, 005, 006, 007

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

### Local login credentials

All seeded auth users share the password **`password123`** (see
`002_seed-users.sql`, `004_seed-unicorn-org.sql`, `005_seed-demo-prerequisites.sql`,
`007_seed-wizard-org.sql`). Handy accounts for local testing:

- `test@example.com` / `test123456` — API test user (`002a_seed-api-test-user.sql`)
- `marcus.rivera@example.test` / `password123` — onboarded Construction worker (good for skills/profile testing)
- `@unicorn.love` users (clay, zach, marc, test) / `password123` — super-admins / employer demo

> There is no `seed-test-users.sql`, and no `testuser1@example.com`. Earlier docs
> referencing `TestUser123!` / `SeedUser123!` were inaccurate — the seeds use `password123`.

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
