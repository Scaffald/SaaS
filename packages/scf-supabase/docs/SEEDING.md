# Seeding Documentation

## Overview

The SCF-Scaffald project uses a multi-step seeding process that separates concerns:

1. **Database migrations** create the schema (via `pnpm supa:reset`)
2. **Base seed data** (`seed.sql`) creates industries, organizations, users, and soft skills
3. **CSI codes** (`seed-csi.ts`) seeds construction skills from CSI MasterFormat 2020 CSV
4. **External jobs** (`seed-all.ts`) orchestrates CSI seeding and imports jobs from RSS feeds

## Quick Start

```bash
# Full reset and seed (recommended for development)
pnpm supa:reset:seed

# Or step by step:
pnpm supa:reset      # Reset database and run migrations + seed.sql
pnpm supa:seed       # Run comprehensive seeding (CSI codes + jobs)
```

## Available Commands

### Root-Level Commands (Recommended)

```bash
# Database Operations
pnpm supa:reset           # Reset database (runs migrations + seed.sql)
pnpm supa:seed            # Seed CSI codes and external jobs
pnpm supa:reset:seed      # Full reset + seed (one command)
pnpm supa:setup           # Full setup (reset + seed + permission tests)
pnpm supa:seed:onet       # Load O*NET reference data from CSV bundle
pnpm supa:seed:onet:prod  # Load O*NET reference data using production env vars

# Development
pnpm supa:start           # Start local Supabase
pnpm supa:stop            # Stop local Supabase
pnpm supa:status          # Check status
pnpm supa:studio          # Open Supabase Studio

# Type Generation
pnpm supa:generate        # Generate types from local DB
pnpm supa:generate:remote # Generate types from remote DB

# Testing
pnpm supa:test:permissions # Test external jobs permissions
```

### Package-Level Commands

```bash
# From packages/supabase directory
pnpm seed                 # Run seed-all.ts
pnpm db:reset             # Reset database
pnpm db:reset:seed        # Reset + seed
pnpm test:permissions     # Test permissions
```

## Seeding Architecture

### 1. Base Data (`seed.sql`)

**Location:** `packages/supabase/seeds/seed.sql`  
**Runs:** Automatically when `pnpm supa:reset` is executed  
**Seeds:**
- 4 base industries (Construction, Manufacturing, Transportation, Energy)
- 6 cross-industry soft skills (leadership, teamwork, communication, etc.)
- 8 sample organizations with geographic data
- Sample affiliate programs
- 50 realistic users with profiles, locations, and skills
- ATS pipelines, jobs, and applications for testing

**Note:** Industry-specific skills (construction, manufacturing, etc.) are NOT seeded here. They come from separate scripts.

### Additional Seed Files

**Location:** `packages/supabase/seeds/`

All seed files are now organized in the `seeds/` directory for better separation of concerns:

- **`seed-affiliates.sql`** - Affiliate program partners (OSHA, NIMS, etc.)
- **`seed-soft-skills.sql`** - Soft skills taxonomy (reliability, collaboration, professionalism, technical)
- **`seed-test-users.sql`** - Three specific test users for manual testing
- **`seed-super-admins.sql`** - Super admin role assignments for core team
- **`seed-job-feeds.sql`** - External RSS job feed configurations

These can be run individually using:
```bash
pnpm supa db seed --file seeds/seed-affiliates.sql
pnpm supa db seed --file seeds/seed-soft-skills.sql
```

See `packages/supabase/seeds/README.md` for detailed documentation on all seed files.

### 2. CSI MasterFormat 2020 Codes (`seed-csi.ts`)

**Location:** `packages/supabase/scripts/seed-csi.ts`  
**CSV File:** `packages/supabase/scripts/seed-csi-2020.csv`  
**Runs:** Via `pnpm supa:seed` (orchestrated by `seed-all.ts`)  
**Seeds:**
- 6000+ construction skills from CSI MasterFormat 2020
- Hierarchical skill tree (4 depth levels)
- Proper parent-child relationships
- CSI code metadata (csi_code, csi_code_key, csi_display, csi_depth)

**Key Features:**
- Automatically finds CSV file (no command-line args needed)
- Creates/updates construction industry
- Ensures all parent skills exist (synthesizes missing ones)
- Uses deterministic UUIDs for consistency

### 3. External Jobs (`seed-all.ts`)
### 4. O*NET Reference Data (`seed-onet.ts`)

**Location:** `packages/supabase/scripts/seed-onet.ts`  
**Runs:** Via `pnpm supa:seed:onet` (local) or `pnpm supa:seed:onet:prod` (remote)  
**Inputs:** Tab-delimited files contained in the official O\*NET Database ZIP (`db_30_0_text.zip`)

**Setup:**

1. Download the latest O\*NET database archive from [onetcenter.org](https://www.onetcenter.org/database.html).
2. Extract the `.txt` files into `packages/supabase/seed-data/onet/raw/`.  
   Alternatively, set `ONET_SOURCE_DIR=/absolute/path/to/db_30_0_text` before running the seed command.

**What it does:**

- Truncates all `onet.*` tables defined in `085_onet_schema.sql`.
- Batch-loads each CSV via `pg` with 500-row inserts.
- Normalises month/year values into `YYYY-MM-01` dates.
- Ignores optional crosswalk files (e.g. “Abilities to Work Activities”) for now; see `ONET_CSV_MAPPING.md` for the complete mapping.

**Re-run safety:** The pipeline truncates then repopulates the tables, so it is safe to re-run for data refreshes.


**Location:** `packages/supabase/scripts/seed-all.ts`  
**Runs:** Via `pnpm supa:seed`  
**Orchestrates:**

1. **Step 1:** Seed CSI codes (calls `seed-csi.ts`)
2. **Step 2:** Import external jobs from RSS feeds
3. **Verification:** Checks skills and industries are properly loaded
4. **Statistics:** Displays summary of seeded data

**Seeds:**
- Jobs from active RSS feeds (WeWorkRemotely by default)
- Job metadata (title, company, location, description)
- Feed tracking info (last_fetched_at, error_count, etc.)

## How It Works

### Workflow Diagram

```
pnpm supa:reset:seed
    ↓
┌─────────────────────────┐
│  pnpm supa:reset        │
│  (Reset DB + Migrations)│
└───────────┬─────────────┘
            ↓
    ┌───────────────┐
    │  seed.sql     │ ← Runs automatically
    │  (Base data)  │
    └───────┬───────┘
            ↓
    ┌───────────────────────┐
    │  pnpm supa:seed       │
    │  (Comprehensive seed) │
    └───────┬───────────────┘
            ↓
    ┌──────────────────────┐
    │  seed-all.ts         │
    │  (Orchestrator)      │
    └───┬──────────────────┘
        │
        ├─> Step 1: seed-csi.ts (CSI codes from CSV)
        │
        └─> Step 2: seedJobs() (External jobs from RSS)
```

### Environment Variables

The seeding scripts use these environment variables:

```bash
# From .env file
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SECRET=sb_secret_...         # Service role key
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

**Important:** 
- `seed-all.ts` uses `SUPABASE_SECRET` (not `SUPABASE_SERVICE_ROLE_KEY`)
- `seed-csi.ts` uses `DATABASE_URL` for direct PostgreSQL connection

## Testing

### Verify Seeding Worked

```bash
# Check database statistics
pnpm supa:seed  # Shows stats at end

# Or manually check
psql postgresql://postgres:postgres@localhost:54322/postgres

-- Check skills count
SELECT COUNT(*) FROM skills;  -- Should be 6000+

-- Check industries
SELECT * FROM industries;

-- Check jobs
SELECT COUNT(*) FROM external_jobs;
```

### Test Permissions

```bash
# Test that external jobs are accessible
pnpm supa:test:permissions
```

## Troubleshooting

### "Base data verification failed"

**Problem:** Skills or industries not found  
**Solution:** Run migrations first:
```bash
pnpm supa:reset
```

### "CSV file not found"

**Problem:** `seed-csi-2020.csv` not in correct location  
**Solution:** Ensure file exists at `packages/supabase/scripts/seed-csi-2020.csv`

### "Permission denied for table external_jobs"

**Problem:** Using wrong key (anon instead of service role)  
**Solution:** Ensure `SUPABASE_SECRET` is set in `.env`:
```bash
# Get the service role key
pnpm supa:status

# Update .env
SUPABASE_SECRET=sb_secret_...
```

### "Port already allocated"

**Problem:** Supabase already running or port conflict  
**Solution:**
```bash
pnpm supa:stop
pnpm supa:start
```

## Development Tips

### Re-seeding Without Full Reset

```bash
# Just re-run the seed (keeps existing data where possible)
pnpm supa:seed
```

### Seeding in CI/CD

```bash
# Automated pipeline
pnpm supa:reset:seed && pnpm supa:test:permissions

# Validate O*NET load (after pnpm supa:seed:onet)
psql "$DATABASE_URL" <<'SQL'
SELECT 'content_model_reference' AS table, COUNT(*) FROM onet.content_model_reference
UNION ALL SELECT 'occupation_data', COUNT(*) FROM onet.occupation_data
UNION ALL SELECT 'abilities', COUNT(*) FROM onet.abilities
UNION ALL SELECT 'skills', COUNT(*) FROM onet.skills
UNION ALL SELECT 'knowledge', COUNT(*) FROM onet.knowledge
UNION ALL SELECT 'work_activities', COUNT(*) FROM onet.work_activities
UNION ALL SELECT 'task_statements', COUNT(*) FROM onet.task_statements
UNION ALL SELECT 'task_ratings', COUNT(*) FROM onet.task_ratings
UNION ALL SELECT 'tools_used', COUNT(*) FROM onet.tools_used
UNION ALL SELECT 'technology_skills', COUNT(*) FROM onet.technology_skills
UNION ALL SELECT 'related_occupations', COUNT(*) FROM onet.related_occupations
ORDER BY table;
SQL
```

> ℹ️ The legacy `084_import_onet_full_data.sql` generator is now ignored by git. Remove any local copy before running migrations so the new CSV-driven pipeline remains the single source of truth.

### Adding New Seed Data

1. **For base data:** Edit `packages/supabase/seed.sql`
2. **For CSI codes:** Update `packages/supabase/scripts/seed-csi-2020.csv`
3. **For new data sources:** Create new script in `packages/supabase/scripts/`

### Custom Seeding Scripts

Create new scripts following this pattern:

```typescript
// packages/supabase/scripts/seed-custom.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET!
);

async function main() {
  // Your seeding logic
}

main().catch(console.error);
```

Add to `package.json`:
```json
{
  "scripts": {
    "supa:seed:custom": "dotenv -- pnpx tsx packages/supabase/scripts/seed-custom.ts"
  }
}
```

## File Structure

```
packages/supabase/
├── seeds/                          # All seed data (organized by concern)
│   ├── README.md                   # Detailed seed documentation
│   ├── seed.sql                    # Base data (runs on db reset)
│   ├── seed-affiliates.sql         # Affiliate programs
│   ├── seed-soft-skills.sql        # Soft skills taxonomy
│   ├── seed-test-users.sql         # Test users
│   ├── seed-super-admins.sql       # Super admin assignments
│   └── seed-job-feeds.sql          # RSS job feeds
├── scripts/
│   ├── seed-all.ts                 # Orchestrator (CSI + Jobs)
│   ├── seed-csi.ts                 # CSI MasterFormat seeder
│   ├── seed-csi-2020.csv           # CSI codes data
│   └── test-external-jobs-permissions.ts
├── migrations/                     # Schema migrations only
│   └── ...                         # Active schema migrations
└── docs/
    └── SEEDING.md                  # This file
```

## Summary

- **One command:** `pnpm supa:reset:seed` does everything
- **Modular:** Separate concerns (base data, CSI, jobs)
- **Repeatable:** Re-running is safe (uses upserts)
- **Fast:** CSI codes seed in ~10 seconds
- **Testable:** Permission tests verify correctness
