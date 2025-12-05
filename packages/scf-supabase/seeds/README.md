# Supabase Seeds

This directory contains all seed data for development and testing environments. Seeds are separated by concern to make it easier to maintain and selectively apply data.

## Seed Files

### Core Seeds (Run Automatically)
- **`seed.sql`** - Main orchestrator file that runs all core seeds in order
  - Runs automatically with `pnpm supa db reset`
  - Imports modular seed files in correct dependency order

#### Modular Core Seeds (Imported by seed.sql)
1. **`seed-industries.sql`** - 4 industries (Construction, Manufacturing, Transportation, Energy)
2. **`seed-organizations.sql`** - 8 sample organizations across different locations
3. **`seed-users.sql`** - 50 realistic users with full profiles, auth accounts, and geographic distribution
4. **`seed-ats-data.sql`** - Complete ATS testing data:
   - 6 hiring pipelines
   - 36 pipeline stages
   - 6 open jobs
   - 3 candidate-job links
   - 4 applications with stage history

### Optional/Specialized Seeds (Run Manually)
- **`seed-affiliates.sql`** - Affiliate program partners (OSHA, NIMS, etc.)
- **`seed-soft-skills.sql`** - Soft skills taxonomy (35 skills across 4 categories)
- **`seed-test-users.sql`** - Three specific test users for manual testing
- **`seed-super-admins.sql`** - Super admin role assignments for core team
- **`seed-job-feeds.sql`** - External RSS job feed configurations

## Usage

### Using Supabase CLI (Recommended)
```bash
# Seed all data (runs seed.sql automatically)
pnpm supa db seed

# Seed specific file
pnpm supa db seed --file seeds/seed-affiliates.sql
```

### Using psql
```bash
# From project root
psql $DATABASE_URL -f packages/supabase/seeds/seed.sql
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

### Initial Setup
```bash
# Start Supabase
pnpm supa start

# Run migrations
pnpm supa db reset

# Seed database (seed.sql runs automatically)
# No explicit seed command needed after reset
```

### Selective Seeding
```bash
# Add only affiliates
pnpm supa db seed --file seeds/seed-affiliates.sql

# Add only soft skills
pnpm supa db seed --file seeds/seed-soft-skills.sql

# Add test users
pnpm supa db seed --file seeds/seed-test-users.sql
```

### Refreshing Data
```bash
# Reset database and reseed everything
pnpm supa db reset

# Or manually reseed specific data
pnpm supa db seed --file seeds/seed.sql
```

## Seed Data Contents

### seed.sql (Orchestrator)
- Runs all core seed files in dependency order
- Provides progress feedback during seeding
- Shows optional seeds that can be run separately

### seed-industries.sql
- 4 base industries with descriptions
- Construction, Manufacturing, Transportation, Energy

### seed-organizations.sql
- 8 sample organizations
- Distributed across MI and OH
- Includes geographic data (lat/lon)
- Linked to industries

### seed-users.sql (Largest file)
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

### seed-ats-data.sql
- **6 Pipelines**: 2 per organization (default + specialized)
- **36 Pipeline Stages**: Complete hiring workflow stages
- **6 Jobs**: Open positions across organizations
- **3 Candidate-Job Links**: Talent pool, referrals, sourced candidates
- **4 Applications**: Applications in various stages (screen, interview, offer, rejected)
- **12 Stage History Entries**: Complete application progression tracking

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
