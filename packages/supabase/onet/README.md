# O*NET Database Integration

This directory contains the O*NET 30.0 Database (August 2025 release) for integration into the SCF-Neue platform.

## Overview

The **O*NET (Occupational Information Network)** is the nation's primary source of occupational information, containing comprehensive data on:
- 1,000+ occupations with detailed descriptions
- Skills, abilities, and knowledge requirements
- Work activities, context, and styles
- Education and training requirements
- Technology and tool requirements
- Interest profiles (RIASEC) and work values

## Database Structure

The O*NET data is organized in a separate `onet` schema to keep it isolated from the main application schema.

### Core Tables

- **`onet.occupation_data`** - Primary occupation information (SOC codes, titles, descriptions)
- **`onet.skills`** / **`onet.skill_scores`** - Skill requirements by occupation
- **`onet.abilities`** / **`onet.ability_scores`** - Ability requirements by occupation
- **`onet.knowledge`** / **`onet.knowledge_scores`** - Knowledge domains by occupation
- **`onet.work_activities`** / **`onet.work_activity_scores`** - Work behaviors and activities
- **`onet.work_context`** / **`onet.work_context_scores`** - Work environment factors
- **`onet.interests`** / **`onet.interest_scores`** - RIASEC interest profiles
- **`onet.work_values`** / **`onet.work_value_scores`** - Work satisfaction factors
- **`onet.job_zones`** / **`onet.job_zone_reference`** - Education/training levels
- **`onet.task_statements`** - Specific work tasks by occupation
- **`onet.technology_skills`** / **`onet.tools_used`** - Technology requirements
- **`onet.alternate_titles`** / **`onet.sample_of_reported_titles`** - Job title variations

## Import Process

### 1. Schema Setup (Migration 036)

Creates the `onet` schema with proper permissions:

```bash
# Already included in migrations
pnpm supa db reset
```

### 2. Convert MySQL to PostgreSQL (Run Script)

The O*NET database comes in MySQL format. Use the conversion script to generate PostgreSQL-compatible SQL:

```bash
# From project root
npx tsx packages/supabase/scripts/convert-onet-sql.ts
```

This will:
- Process all 40 SQL files in `packages/supabase/onet/`
- Convert MySQL syntax to PostgreSQL
- Add `onet.` schema prefix to all tables
- Generate `038_import_onet_full_data.sql` migration

### 3. Import Data

```bash
# Reset database (includes all migrations)
pnpm supa db reset
```

The import process will:
- Create ~40 tables in the `onet` schema
- Import 1,000+ occupations
- Import all related skills, abilities, and reference data
- Create indexes for performance
- Set up full-text search

## Usage Examples

### Search Occupations

```sql
-- Full-text search
SELECT * FROM onet.search_occupations('software engineer');

-- Direct lookup by SOC code
SELECT * FROM onet.get_occupation('15-1252.00');

-- Browse all occupations
SELECT onetsoc_code, title, description 
FROM onet.occupation_data 
ORDER BY title 
LIMIT 20;
```

### Get Skills for an Occupation

```sql
SELECT 
  s.element_name as skill,
  ss.data_value as importance
FROM onet.skill_scores ss
JOIN onet.skills s ON s.element_id = ss.element_id
WHERE ss.onetsoc_code = '15-1252.00'  -- Software Developers
  AND ss.scale_id = 'IM'  -- Importance scale
ORDER BY ss.data_value DESC
LIMIT 10;
```

### Find Occupations by Job Zone (Education Level)

```sql
SELECT 
  od.onetsoc_code,
  od.title,
  jz.name as education_level
FROM onet.occupation_data od
JOIN onet.job_zone_reference jzr ON jzr.onetsoc_code = od.onetsoc_code
JOIN onet.job_zones jz ON jz.job_zone = jzr.job_zone
WHERE jz.job_zone = '5'  -- Extensive preparation (graduate degree)
ORDER BY od.title;
```

### Get Technology Skills

```sql
SELECT 
  commodity_title,
  example,
  hot_technology
FROM onet.technology_skills
WHERE onetsoc_code = '15-1252.00'  -- Software Developers
  AND hot_technology = 'Y'
ORDER BY commodity_title;
```

## Integration Points

### Link Jobs to O*NET

Add an O*NET SOC code column to your jobs table:

```sql
ALTER TABLE public.jobs 
ADD COLUMN onet_soc_code CHAR(10) REFERENCES onet.occupation_data(onetsoc_code);

CREATE INDEX idx_jobs_onet_soc ON public.jobs(onet_soc_code);
```

### Link User Skills

Create a junction table for user skills:

```sql
CREATE TABLE public.user_skills (
  user_id UUID REFERENCES public.users(id),
  skill_id VARCHAR(20) REFERENCES onet.skills(element_id),
  proficiency_level VARCHAR(20),
  PRIMARY KEY (user_id, skill_id)
);
```

## Helper Functions

### Search Occupations

```sql
-- Available in migration 036
SELECT * FROM onet.search_occupations('data scientist');
```

### Get Occupation Details

```sql
-- Available in migration 036
SELECT * FROM onet.get_occupation('15-2051.00');
```

## Permissions

- **Service Role**: Full access (read/write)
- **Authenticated Users**: Read-only access
- **Anonymous**: Read-only access

## Data Updates

O*NET releases updated data twice per year (typically February and August).

To update:

1. Download new O*NET Database from https://www.onetcenter.org/database.html
2. Replace files in `packages/supabase/onet/`
3. Re-run conversion script: `npx tsx packages/supabase/scripts/convert-onet-sql.ts`
4. Create new migration or run directly against database

## Resources

- **O*NET Website**: https://www.onetcenter.org/
- **O*NET Online**: https://www.onetonline.org/
- **Database Documentation**: https://www.onetcenter.org/dictionary/30.0/mysql/
- **Content Model**: https://www.onetcenter.org/content.html
- **Data Dictionary**: https://www.onetcenter.org/dictionary.html

## File Structure

```
packages/supabase/
├── onet/                          # O*NET MySQL dumps (40 files)
│   ├── 01_content_model_reference.sql
│   ├── 02_scales_reference.sql
│   ├── 03_occupation_data.sql
│   └── ... (37 more files)
├── migrations/
│   ├── 036_create_onet_schema.sql      # Schema creation
│   ├── 037_import_onet_data.sql        # Table structure (template)
│   └── 038_import_onet_full_data.sql   # Generated full import
└── scripts/
    └── convert-onet-sql.ts             # MySQL→PostgreSQL converter
```

## Troubleshooting

### Import Fails

```bash
# Check if schema exists
psql -d your_db -c "\dn onet"

# Check table count
psql -d your_db -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'onet'"

# View conversion warnings
cat packages/supabase/migrations/038_import_onet_full_data.sql | grep "Warning"
```

### Performance Issues

```bash
# Re-analyze tables
psql -d your_db -c "ANALYZE onet.occupation_data; ANALYZE onet.skill_scores;"

# Check indexes
psql -d your_db -c "SELECT indexname FROM pg_indexes WHERE schemaname = 'onet'"
```

## Next Steps

1. ✅ Schema created (migration 036)
2. ✅ Table structures defined (migration 037)
3. 🔄 **Run conversion script** to generate full data import
4. ⏳ Import data with `pnpm supa db reset`
5. ⏳ Add integration points to your application (jobs, user skills)
6. ⏳ Build matching/recommendation features using O*NET data

---

**License**: O*NET data is in the public domain and can be freely used. Attribution is requested but not required.

**Version**: O*NET 30.0 Database (August 2025)
