# Debugging Office Role Access

## Issue: Office Links Not Showing

The office navigation link appears in the **header flyout menu** (not the drawer), and is controlled by the `hasOfficeRole` check in `DrawerLayout.tsx`.

## How It Works

1. **Header Flyout Menu**: `DrawerLayout.tsx` line 163 shows `<OfficeFlyout />` when `hasOfficeRole` is true
2. **Role Check**: `useUserRoles()` hook calls `api.auth.getUserRoles.useQuery()`
3. **Database Query**: `auth.router.ts` queries `core.role_assignments` joined with `core.roles`
4. **Role Name**: The system looks for a role named `"office"` with `scope = "platform"`

## Check User's Roles

Run this SQL query in Supabase SQL Editor to check if clay@unicorn.love has the office role:

```sql
SELECT 
  u.email,
  r.name as role_name,
  r.scope as role_scope,
  ra.created_at as assigned_at
FROM auth.users u
LEFT JOIN core.role_assignments ra ON ra.user_id = u.id
LEFT JOIN core.roles r ON r.id = ra.role_id
WHERE u.email = 'clay@unicorn.love'
ORDER BY r.name;
```

## Assign Office Role

If the user doesn't have the office role, run this SQL:

```sql
-- Assign office role to clay@unicorn.love
INSERT INTO core.role_assignments (role_id, user_id)
SELECT r.id, u.id 
FROM core.roles r, auth.users u 
WHERE r.name = 'office' 
  AND r.scope = 'platform' 
  AND u.email = 'clay@unicorn.love'
ON CONFLICT DO NOTHING;
```

## Verify Office Role Exists

First, make sure the "office" role exists in the database:

```sql
SELECT id, name, scope, description
FROM core.roles
WHERE name = 'office' AND scope = 'platform';
```

If it doesn't exist, create it:

```sql
INSERT INTO core.roles (name, scope, description)
VALUES ('office', 'platform', 'Office staff with administrative access')
ON CONFLICT (name, scope) DO NOTHING;
```

## Debug in Browser Console

Add this to check roles in the browser console:

```javascript
// In browser console after logging in
// Check what roles are being returned
// The useUserRoles hook should log roles if there's an error
```

## Common Issues

1. **Role doesn't exist**: The "office" role might not be created in the database
2. **Wrong scope**: Role might exist but with wrong scope (should be "platform")
3. **User not assigned**: User might not have the role assignment
4. **Schema mismatch**: Query might be looking in wrong schema (should be `core` not `public`)

## Frontend Debugging

The `useUserRoles` hook logs warnings if there's an error. Check browser console for:
- `[useUserRoles] Failed to load roles` - indicates query failure
- Check Network tab for `getUserRoles` tRPC call response

