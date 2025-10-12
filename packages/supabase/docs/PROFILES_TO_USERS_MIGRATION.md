# Profiles → Users Table Migration

**Date:** October 12, 2025  
**Status:** BREAKING CHANGE - Client code needs updates

## What Changed

The `public.profiles` table has been **removed** and merged into `public.users`.

### Field Mapping

All fields from `profiles` are now in `users`:

| Old (`profiles`) | New (`users`) | Notes |
|-----------------|---------------|-------|
| `id` | `id` | Same field |
| `name` | Display name is now derived from `private.profile` (first_name + last_name) | |
| `about` | `about` | Moved to users |
| `avatar_path` | `avatar_path` | Moved to users |
| `created_at` | `created_at` | Same field |
| `updated_at` | `updated_at` | Same field |

## Breaking Change

### ❌ Old Query (No Longer Works)
```
GET /rest/v1/profiles?select=id,name,about,avatar_path,created_at,updated_at&id=eq.<user-id>
```

### ✅ New Query (Use This)
```
GET /rest/v1/users?select=id,about,avatar_path,created_at,updated_at&id=eq.<user-id>
```

## How to Fix Your Code

### 1. TypeScript/JavaScript Client

```typescript
// ❌ Old - Don't use
const { data } = await supabase
  .from('profiles')
  .select('id, name, about, avatar_path')
  .eq('id', userId)

// ✅ New - Use this
const { data } = await supabase
  .from('users')
  .select('id, about, avatar_path')
  .eq('id', userId)
```

### 2. Regenerate Types

After pulling the latest migrations:

```bash
pnpm supa:generate
```

This will update your TypeScript types to remove `profiles` and update `users`.

### 3. Clear Browser Cache

The Supabase client may cache table schemas. Clear your:
- Browser cache
- Local storage
- Service worker cache

Or hard refresh: `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Windows/Linux)

### 4. Restart Development Server

```bash
# Kill and restart
pnpm dev
```

## Additional Changes

### Display Name

The `name` field no longer exists on `users`. To get a user's display name:

```typescript
// Get display name from private.profile
const { data } = await supabase
  .schema('private')
  .from('profile')
  .select('first_name, last_name')
  .eq('user_id', userId)
  .single()

const displayName = `${data.first_name} ${data.last_name}`
```

Or use the existing `display_name` field on `users` which is generated automatically.

## Migration Checklist

- [ ] Update all `.from('profiles')` to `.from('users')`
- [ ] Remove references to `name` field (use `display_name` instead)
- [ ] Regenerate TypeScript types (`pnpm supa:generate`)
- [ ] Clear browser cache / hard refresh
- [ ] Restart development servers
- [ ] Test all profile-related queries
- [ ] Update any documentation referencing `profiles` table

## Need Help?

If you see errors like:
- `"Could not find the table 'public.profiles'"`
- `"relation 'profiles' does not exist"`

Follow the steps above to update your code from `profiles` to `users`.
