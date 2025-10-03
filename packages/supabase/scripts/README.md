# CSI MasterFormat Seeding Scripts

This directory contains scripts for seeding CSI (Construction Specifications Institute) MasterFormat codes into the skills table.

## Overview

The CSI seeding system imports the complete CSI MasterFormat 2018 taxonomy into the database as skills with proper parent-child relationships. The system uses:

- **YAML format** for the taxonomy data
- **PostgreSQL** for database operations
- **Deterministic UUIDs** to ensure consistent IDs across environments

## Files

- `seed-csi.ts` - Main seeding script
- `csi_masterformat_2018_taxonomy.yaml` - CSI MasterFormat 2018 taxonomy data
- `seed-csi-2020.xlsx` - Legacy Excel format (deprecated)

## Prerequisites

1. **Local Supabase instance running**:
   ```bash
   pnpm supa start
   ```

2. **Database URL environment variable**:
   ```bash
   export DATABASE_URL='postgresql://postgres:postgres@localhost:54322/postgres'
   ```

3. **Migration applied**:
   The migration `030_add_csi_skill_columns.sql` must be applied to add CSI-specific columns to the skills table.

## Usage

### Running the Seeding Script

```bash
# From the project root
cd packages/supabase
pnpm tsx scripts/seed-csi.ts scripts/csi_masterformat_2018_taxonomy.yaml
```

### Output

The script will:
1. Parse the YAML taxonomy
2. Generate records with proper parent-child relationships
3. Create synthetic parent records for any missing ancestors
4. Insert/update all records in the database

Expected output:
```
Reading CSI taxonomy from: /path/to/csi_masterformat_2018_taxonomy.yaml
Parsed 50 top-level divisions from YAML
Generated 3500 records from hierarchy
Total records (including synthetic parents): 3800
Starting database transaction...
Upserting construction industry...
Upserting CSI skills...
Processed batch 1: 500 records
Processed batch 2: 500 records
...
✓ Successfully seeded CSI MasterFormat 2018 taxonomy!
  Total records: 3800
  Depth 1 (Divisions): 50
  Depth 2 (Level 2): 450
  Depth 3 (Level 3): 1200
  Depth 4 (Level 4): 2100
```

## Database Schema

### New Columns Added to `skills` Table

The migration adds these CSI-specific columns:

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `csi_code` | `text[]` | 4-element array | `['03','11','13','16']` |
| `csi_code_key` | `text` | Unique key (indexed) | `'03-11-13-16'` |
| `csi_display` | `text` | Human-readable format | `'03 11 13.16'` |
| `csi_depth` | `smallint` | Hierarchy level (1-4) | `4` |

### CSI Code Hierarchy

CSI codes follow a 4-level hierarchy:

1. **Division (Level 1)**: `03` → `03-00-00-00`
2. **Level 2**: `03 11` → `03-11-00-00`
3. **Level 3**: `03 11 13` → `03-11-13-00`
4. **Level 4**: `03 11 13.16` → `03-11-13-16`

### Parent-Child Relationships

The script automatically establishes parent-child relationships:

```
03 Concrete (Division)
└── 03 11 Concrete Forming
    └── 03 11 13 Structural Cast-In-Place Concrete Forming
        └── 03 11 13.16 Metal Concrete Forming
```

## YAML Format

The YAML taxonomy follows this structure:

```yaml
- code: "03"
  title: "Concrete"
  children:
    - code: "03 11"
      title: "Concrete Forming"
      children:
        - code: "03 11 13"
          title: "Structural Cast-In-Place Concrete Forming"
          children:
            - code: "03 11 13.16"
              title: "Metal Concrete Forming"
```

### Key Features

- **Hierarchical structure**: Children nested under parents
- **Flexible code format**: Supports `"03"`, `"03 11"`, `"03 11 13"`, `"03 11 13.16"`
- **Automatic padding**: `"3"` → `"03"`, incomplete codes padded with zeros

## Database Functions

### Finding Skills by CSI Code

```sql
-- Find a specific CSI skill
SELECT * FROM find_csi_skill_by_code(ARRAY['03','11','13','16']);

-- Query by csi_code directly
SELECT * FROM skills WHERE csi_code = ARRAY['03','11','13','16'];

-- Query by csi_code_key
SELECT * FROM skills WHERE csi_code_key = '03-11-13-16';

-- Find all Level 3 skills in Division 03
SELECT * FROM skills 
WHERE csi_code[1] = '03' 
  AND csi_depth = 3;
```

### Querying the Hierarchy

```sql
-- Get all children of a division
SELECT * FROM skills 
WHERE csi_code[1] = '03' 
ORDER BY csi_code_key;

-- Get immediate children of a skill
SELECT child.*
FROM skills parent
JOIN skills child ON child.parent_id = parent.id
WHERE parent.csi_code_key = '03-11-00-00';

-- Get all descendants (recursive)
WITH RECURSIVE descendants AS (
  SELECT * FROM skills WHERE csi_code_key = '03-00-00-00'
  UNION
  SELECT s.* FROM skills s
  JOIN descendants d ON s.parent_id = d.id
)
SELECT * FROM descendants ORDER BY csi_depth, csi_code_key;
```

## Validation and Constraints

The database enforces these rules via triggers and constraints:

1. **CSI codes must have exactly 4 elements**
2. **CSI depth must be between 1 and 4**
3. **CSI skills must belong to construction industry**
4. **Parent skills must be in the same industry**
5. **Unique csi_code_key across all skills**

## Updating the Taxonomy

To update the taxonomy:

1. Edit `csi_masterformat_2018_taxonomy.yaml`
2. Run the seeding script (it will upsert existing records)
3. The script is idempotent - safe to run multiple times

```bash
pnpm tsx scripts/seed-csi.ts scripts/csi_masterformat_2018_taxonomy.yaml
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if Supabase is running
pnpm supa status

# Start Supabase if not running
pnpm supa start

# Verify DATABASE_URL
echo $DATABASE_URL
```

### Migration Not Applied

```bash
# Check migration status
pnpm supa migration list

# Apply pending migrations
pnpm supa migration up
```

### YAML Parsing Errors

Ensure your YAML file:
- Has proper indentation (2 spaces)
- Uses quotes around code values
- Has valid array structure at root level

### Duplicate Key Errors

The script uses `ON CONFLICT` to handle duplicates. If you see errors:
1. Check for duplicate `csi_code_key` values in your YAML
2. Verify the `csi_code_key_unique` constraint exists

## Performance Considerations

- **Batch size**: 500 records per batch (configurable)
- **Transaction-based**: All-or-nothing insert
- **Indexed columns**: `csi_code`, `csi_code_key`, `csi_depth`
- **Deterministic UUIDs**: Same input always produces same IDs

## Examples

### Querying Concrete-Related Skills

```sql
-- All concrete division skills
SELECT name, csi_display, csi_depth 
FROM skills 
WHERE csi_code[1] = '03'
ORDER BY csi_code_key;

-- Only structural concrete forming
SELECT name, csi_display
FROM skills
WHERE csi_code_key LIKE '03-11-13%';
```

### Finding Parent Skills

```sql
-- Get parent of a skill
SELECT parent.name, parent.csi_display
FROM skills child
JOIN skills parent ON child.parent_id = parent.id
WHERE child.csi_code_key = '03-11-13-16';
```

### Skills by Depth Level

```sql
-- Count skills at each depth
SELECT csi_depth, COUNT(*) as count
FROM skills
WHERE csi_code IS NOT NULL
GROUP BY csi_depth
ORDER BY csi_depth;
```

## Integration with Application

The seeded skills can be used in your application for:

- **Skill selection**: Let users pick their construction specialties
- **Job matching**: Match workers to jobs by CSI codes
- **Filtering**: Filter organizations/jobs by CSI specialties
- **Hierarchy navigation**: Browse skills by division/level

Example React query:

```typescript
const { data: divisions } = useQuery({
  queryKey: ['csi-divisions'],
  queryFn: async () => {
    const { data } = await supabase
      .from('skills')
      .select('*')
      .eq('csi_depth', 1)
      .order('csi_code_key');
    return data;
  }
});
