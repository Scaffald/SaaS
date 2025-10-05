# CSI MasterFormat Seeding Scripts

This directory contains scripts for seeding CSI (Construction Specifications Institute) MasterFormat codes into the skills table.

## Overview

The CSI seeding system imports the complete CSI MasterFormat 2020 taxonomy into the database as skills with proper parent-child relationships. The system uses:

- **CSV format** for the taxonomy data (simple, flat structure)
- **PostgreSQL** for database operations
- **Deterministic UUIDs** to ensure consistent IDs across environments
- **Automatic parent synthesis** to fill in missing hierarchy levels

## Files

- `seed-csi.ts` - Main seeding script
- `seed-csi-2020.csv` - CSI MasterFormat 2020 taxonomy data (CSV format)
- `test-csv-parsing.ts` - Test script for CSV parsing logic

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
npx tsx scripts/seed-csi.ts /path/to/seed-csi-2020.csv

# Example with absolute path
npx tsx scripts/seed-csi.ts ~/path/to/seed-csi-2020.csv
```

### Testing CSV Parsing (Without Database)

```bash
# Test CSV parsing logic with sample data
npx tsx scripts/test-csv-parsing.ts
```

### Output

The script will:
1. Parse the CSV file (simple code, description format)
2. Calculate parent-child relationships from CSI code structure
3. Create synthetic parent records for any missing ancestors
4. Insert/update all records in the database in batches

Expected output:
```
Reading CSI taxonomy from: /path/to/seed-csi-2020.csv
Parsed 9000 rows from CSV
Generated 8950 records from CSV
Skipped 50 malformed rows
Total records (including synthetic parents): 9200
Starting database transaction...
Upserting construction industry...
Upserting CSI skills...
Processed batch 1: 500 records
Processed batch 2: 500 records
...
✓ Successfully seeded CSI MasterFormat 2020 taxonomy!
  Total records: 9200
  Depth 1 (Divisions): 52
  Depth 2 (Level 2): 850
  Depth 3 (Level 3): 3800
  Depth 4 (Level 4): 4498
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

## CSV Format

The CSV file uses a simple flat structure with two columns:

```csv
00 00 00,Procurement and Contracting Requirements
00 01 01,Project Title Page
00 24 13.13,Scopes of Bids (Multiple Contracts)
03 11 13.16,Metal Concrete Forming
```

### Format Specifications

- **No header row** - Data starts immediately
- **Two columns**: CSI Code, Description
- **Comma-delimited**
- **Code format**: Supports multiple formats
  - Division: `"03"`
  - Level 2: `"03 11"`
  - Level 3: `"03 11 13"`
  - Level 4: `"03 11 13.16"` (note the period before last segment)

### Key Features

- **Flat structure**: No nesting required - hierarchy inferred from codes
- **Automatic parent creation**: Missing parent levels are synthesized
- **Flexible code format**: All standard CSI formats supported
- **Automatic padding**: Incomplete codes padded with zeros
- **Validation**: Malformed rows are skipped with warnings

### How Parent-Child Relationships Work

The script automatically calculates parent-child relationships from the code structure:

```
Input:  03 11 13.16, Metal Concrete Forming
        ↓
Parse:  ["03", "11", "13", "16"]
        ↓
Parent: ["03", "11", "13", "00"] (calculated)
        ↓
The script ensures these parents exist:
  - 03-00-00-00 (Division)
  - 03-11-00-00 (Level 2)
  - 03-11-13-00 (Level 3)
```

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

1. Update your CSV file with new codes and descriptions
2. Run the seeding script (it will upsert existing records)
3. The script is idempotent - safe to run multiple times

```bash
npx tsx scripts/seed-csi.ts /path/to/updated-csi-data.csv
```

The script uses `ON CONFLICT` clauses to update existing records, so you can:
- Add new CSI codes
- Update descriptions of existing codes
- The script will maintain all existing parent-child relationships

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

### CSV Parsing Errors

Ensure your CSV file:
- Has no header row (data starts immediately)
- Uses comma as delimiter
- Has exactly two columns per row
- CSI codes match the pattern: `\d{2}(\s\d{2}){0,2}(\.\d{2})?`
- Examples of valid codes: `"03"`, `"03 11"`, `"03 11 13"`, `"03 11 13.16"`

If you see "Skipping malformed code" warnings:
- Check the code format matches the expected pattern
- Ensure there are no extra spaces or special characters
- Verify the CSV is properly formatted

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
