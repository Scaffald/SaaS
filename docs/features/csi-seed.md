# CSI MasterFormat Integration

## Overview

This document describes the CSI MasterFormat integration for Scaffald, which provides a standardized construction industry skills taxonomy based on the Construction Specifications Institute's MasterFormat system.

## Implementation Status

✅ **COMPLETED** - CSI MasterFormat integration is fully implemented and operational.

### What's Implemented

1. **Database Schema** - All required CSI columns and constraints are in place
2. **Seeding Script** - Complete TypeScript script for importing CSI data from Excel
3. **Industry Integration** - Construction industry properly configured
4. **Skills Taxonomy** - Hierarchical skills structure with CSI codes

## Current Implementation

### Database Schema

The skills table includes CSI-specific fields:

- `csi` - Array of 4 two-digit codes (e.g., `["03","11","13","16"]`)
- `code_display` - Human-readable format (e.g., `"03 11 13.16"`)
- `code_key` - Stable natural key (e.g., `"03-11-13-16"`)
- `depth` - Hierarchy level (1-4: Division → Level-4)

### Seeding Script

**Location**: `packages/supabase/scripts/seed-csi.ts`

**Usage**:
```bash
# From the packages/supabase directory
yarn ts-node scripts/seed-csi.ts /path/to/COMBINED.xlsx
```

**Features**:
- Parses Excel files with CSI MasterFormat data
- Generates deterministic UUIDs for consistent seeding
- Handles hierarchical parent-child relationships
- Batch processing for performance
- Transaction safety with rollback on errors

### Industry Configuration

The construction industry is automatically created/updated with:
- **Slug**: `construction`
- **Name**: `construction`
- **Description**: `CSI MasterFormat skills live under this industry.`

## Data Structure

### CSI Code Format

- **Division Level** (depth 1): `03` (Concrete)
- **Level 2**: `03 11` (Concrete Forming)
- **Level 3**: `03 11 13` (Concrete Forming Accessories)
- **Level 4**: `03 11 13.16` (Concrete Forming Accessories - Specific)

### Skills Hierarchy

Skills maintain parent-child relationships within the same industry, enforced by database triggers to prevent cross-industry mismatches.

## Usage in Application

The CSI skills are available through the standard skills API and can be used for:

- **User Skill Selection** - Users can select from CSI-coded skills
- **Job Matching** - Jobs can specify required CSI skills
- **Skill Recommendations** - AI-powered skill suggestions based on CSI taxonomy
- **Industry Analytics** - Construction industry skill trends and gaps

## Maintenance

### Adding New CSI Data

1. Obtain updated CSI MasterFormat Excel file
2. Run the seeding script with the new file
3. The script handles updates and additions automatically

### Schema Updates

If CSI MasterFormat structure changes, update the seeding script accordingly. The database schema is designed to be flexible and accommodate future CSI updates.

## Related Documentation

- [Skills Management](../architecture/data-layer-patterns.md) - How skills are managed in the application
- [Database Migrations](../../packages/supabase/migrations/) - Schema evolution history
