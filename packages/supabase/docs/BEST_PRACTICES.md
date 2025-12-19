# Supabase Migration Best Practices

## Database Security & Permissions

### The Two-Layer Security Model

PostgreSQL security in Supabase requires **both layers** to work correctly:

1. **Table Grants** (Layer 1) - Controls which operations are allowed
2. **RLS Policies** (Layer 2) - Controls which rows are accessible

**Both are required.** RLS policies alone will not work without proper table grants.

### Standard Permission Pattern

```sql
BEGIN;

-- 1. Create your table
CREATE TABLE my_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  data TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- 3. Grant table-level permissions
GRANT SELECT ON my_table TO anon, authenticated;
GRANT ALL ON my_table TO service_role;

-- 4. Create RLS policies
-- Public read for public rows
CREATE POLICY my_table_public_read ON my_table
  FOR SELECT TO anon, authenticated
  USING (is_public = true);

-- Users can manage their own rows
CREATE POLICY my_table_user_manage ON my_table
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMIT;
```

### Role Definitions

- **anon**: Unauthenticated users (no login)
- **authenticated**: Logged-in users
- **service_role**: Backend services, admin operations

### Common Patterns

#### Public Read-Only Data
```sql
GRANT SELECT ON public_data TO anon, authenticated;
GRANT ALL ON public_data TO service_role;

CREATE POLICY public_data_read ON public_data
  FOR SELECT TO anon, authenticated
  USING (true);
```

#### User-Specific Data
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON user_data TO authenticated;
GRANT ALL ON user_data TO service_role;

CREATE POLICY user_data_own ON user_data
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

#### Admin-Only Operations
```sql
GRANT SELECT ON admin_data TO authenticated;
GRANT ALL ON admin_data TO service_role;

CREATE POLICY admin_data_read ON admin_data
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM role_assignments ra
      JOIN roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid() AND r.name = 'admin'
    )
  );
```

## Migration Organization

### Naming Convention

#### Core Migrations (Numbered)
Use sequential numbering for core schema:
- `001_init.sql` - Initial schema
- `002_add_search.sql` - Add search functionality
- `043_create_external_job_feeds.sql` - External job feeds

#### Fix Migrations (Timestamped)
Use timestamps for fixes and patches:
- `20251006010511_grant_service_role_job_access.sql`
- `YYYYMMDDHHMMSS_descriptive_name.sql`

### Migration Structure

```sql
-- =========================================================
-- Migration: [Number]_[Name]
-- Description: Brief description of what this migration does
-- =========================================================

BEGIN;

-- Clear section headers
-- =========================================================
-- Section Name
-- =========================================================

-- Your SQL here

-- Always include grants and RLS together
CREATE TABLE example (...);
ALTER TABLE example ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON example TO anon, authenticated;
GRANT ALL ON example TO service_role;
CREATE POLICY example_policy ON example ...;

COMMIT;
```

## Testing Your Migrations

### Before Committing

1. **Reset your local database**
   ```bash
   pnpm supa db reset
   ```

2. **Run permission tests**
   ```bash
   pnpm tsx packages/supabase/scripts/test-permissions.ts
   ```

3. **Test with actual tRPC endpoints**
   - Start the dev server
   - Test API calls in the UI
   - Check browser console for errors

### Create Test Scripts

For each major feature, create a test script:

```typescript
// packages/supabase/scripts/test-feature-permissions.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const anonKey = process.env.SUPABASE_ANON_KEY || ''

async function testFeature() {
  const client = createClient(supabaseUrl, anonKey)
  
  // Test read access
  const { data, error } = await client
    .from('my_table')
    .select('*')
    .limit(5)
  
  if (error) {
    console.error('❌ Test failed:', error.message)
    return false
  }
  
  console.log('✅ Test passed')
  return true
}

testFeature().then(result => process.exit(result ? 0 : 1))
```

## Common Pitfalls

### ❌ RLS Without Grants

```sql
-- WRONG - RLS policy alone won't work
CREATE TABLE my_table (...);
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY my_policy ON my_table FOR SELECT USING (true);
-- Missing GRANT statements!
```

### ✅ Correct

```sql
-- RIGHT - Include both grants and RLS
CREATE TABLE my_table (...);
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON my_table TO anon, authenticated;
GRANT ALL ON my_table TO service_role;
CREATE POLICY my_policy ON my_table FOR SELECT USING (true);
```

### ❌ Forgetting Related Tables

```sql
-- WRONG - Forgot to grant access to joined tables
GRANT SELECT ON orders TO authenticated;
-- Missing grants for customers, products, etc.
```

### ✅ Correct

```sql
-- RIGHT - Grant access to all related tables
GRANT SELECT ON orders TO authenticated;
GRANT SELECT ON customers TO authenticated;  -- For joins
GRANT SELECT ON products TO authenticated;   -- For joins
GRANT ALL ON orders TO service_role;
GRANT ALL ON customers TO service_role;
GRANT ALL ON products TO service_role;
```

### ❌ Using !inner Unnecessarily

```sql
-- WRONG - Can block access
.select('job, industry!inner(name)')
```

### ✅ Correct

```sql
-- RIGHT - Use regular joins for optional relationships
.select('job, industry(name)')
```

## tRPC Integration

### How tRPC Works with RLS

tRPC in this project uses:
- **Service role key** for the Supabase client
- **Auth header** passed through from the request
- **RLS policies** are respected because auth context is present

This means:
1. Service role client is created
2. Auth header is added to requests
3. PostgreSQL sees the authenticated user
4. RLS policies filter based on `auth.uid()`
5. **Table grants for `authenticated` role are required**

### Testing tRPC Endpoints

```typescript
// In your test script
const serviceClient = createClient(
  supabaseUrl, 
  serviceRoleKey,
  {
    global: {
      headers: { Authorization: `Bearer ${userToken}` }
    }
  }
)

// This will respect RLS as the authenticated user
const { data, error } = await serviceClient
  .from('my_table')
  .select('*')
```

## Checklist for New Tables

- [ ] Table created with appropriate columns
- [ ] RLS enabled on table
- [ ] Table grants for `anon` (if public reads)
- [ ] Table grants for `authenticated` 
- [ ] Table grants for `service_role`
- [ ] RLS policies created (SELECT, INSERT, UPDATE, DELETE)
- [ ] Related/joined tables have grants
- [ ] Indexes added for performance
- [ ] Functions/triggers if needed
- [ ] Test script created
- [ ] All tests pass
- [ ] Migration committed

## References

- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [tRPC Supabase Patterns](.cursor/rules/trpc-supabase-patterns.mdc)
- [Migration Consolidation](./MIGRATION_CONSOLIDATION.md)
