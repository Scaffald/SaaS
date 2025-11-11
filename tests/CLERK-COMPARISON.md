# Playwright Auth Helper: Supabase vs Clerk

This document explains how our custom Supabase Playwright auth helper compares to Clerk's official `@clerk/playwright` package.

## Overview

| Feature | Clerk (Official) | Supabase (Custom) | Status |
|---------|------------------|-------------------|--------|
| Official package | ✅ `@clerk/playwright` | ❌ Custom helper | Different approach |
| API Similarity | Reference | ✅ Similar API | ✅ Match |
| Session tokens | Automatic | Manual via helper | ✅ Implemented |
| Storage state | Auto-managed | Manual with helper | ✅ Implemented |
| Test users | Built-in | Seeded users | ✅ Available |
| Installation | `npm install @clerk/playwright` | Included in project | ✅ Setup |
| Usage | `clerk().signInAsUser()` | `signInAsUser(page, email, password)` | ✅ Similar |

## Installation Comparison

### Clerk
```bash
npm install -D @clerk/playwright
```

### Supabase
```bash
# Already included in this project
# No additional installation needed!
```

## Usage Comparison

### Clerk Example
```typescript
import { clerk } from '@clerk/playwright'

test.describe('Protected Page', () => {
  test('can access dashboard', async ({ page }) => {
    await clerk().signInAsUser(page, {
      emailAddress: 'test@example.com',
      password: 'password123',
    })

    await page.goto('/dashboard')
    await expect(page.locator('h1')).toHaveText('Dashboard')
  })

  test('can access admin panel', async ({ page }) => {
    await clerk().signInAsAdmin(page)

    await page.goto('/admin')
    await expect(page).toHaveURL(/admin/)
  })
})
```

### Supabase (Our Implementation)
```typescript
import { signInAsUser, signInAsAdmin } from './tests/playwright-helpers/auth'

test.describe('Protected Page', () => {
  test('can access dashboard', async ({ page }) => {
    await signInAsUser(page, 'testuser1@example.com', 'TestUser123!')

    await page.goto('/dashboard')
    await expect(page.locator('h1')).toHaveText('Dashboard')
  })

  test('can access admin panel', async ({ page }) => {
    await signInAsAdmin(page)

    await page.goto('/office')
    await expect(page).toHaveURL(/office/)
  })
})
```

## Bearer Token Comparison

### Clerk
```typescript
import { clerk } from '@clerk/playwright'

test('make authenticated API call', async ({ page }) => {
  await clerk().signInAsUser(page, { emailAddress, password })
  
  const token = await clerk().getToken(page)
  
  const response = await fetch('/api/user', {
    headers: { Authorization: `Bearer ${token}` }
  })
})
```

### Supabase
```typescript
import { signInAsUser, getBearerToken } from './tests/playwright-helpers/auth'

test('make authenticated API call', async ({ page }) => {
  await signInAsUser(page, 'test@example.com', 'password')
  
  // Option 1: Get token from helper
  const token = await getBearerToken('test@example.com', 'password')
  
  // Option 2: Use convenience function
  const token = await getRegularUserToken()
  
  const response = await fetch('/api/user', {
    headers: { Authorization: `Bearer ${token}` }
  })
})
```

## Available Functions

### Clerk Functions
- `clerk().signInAsUser(page, credentials)`
- `clerk().signInAsAdmin(page)`
- `clerk().signInAsGuest(page)`
- `clerk().signOut(page)`
- `clerk().getToken(page)`

### Supabase Functions (Our Implementation)
- `signInAsUser(page, email, password)` ✅
- `signInAsTestUser(page)` ✅ (regular user)
- `signInAsAdmin(page)` ✅
- `signInAsSuperAdmin(page)` ✅
- `getAuthToken(email, password)` ✅
- `getBearerToken(email, password)` ✅
- `getRegularUserToken()` ✅ (convenience)
- `getAdminToken()` ✅ (convenience)
- `getSuperAdminToken()` ✅ (convenience)

## Key Differences

### 1. Sign Out
**Clerk:**
```typescript
await clerk().signOut(page)
```

**Supabase:**
```typescript
// Manual sign out
await page.evaluate(() => {
  localStorage.removeItem('supabase.auth.token')
})
```

### 2. Storage State
**Clerk:** Automatically manages storage state in Playwright

**Supabase:** Manual management via helper functions:
```typescript
import { createStorageState } from './tests/playwright-helpers/auth'

await createStorageState('user@example.com', 'password')
```

### 3. Test User Management
**Clerk:** Uses Clerk's test user management

**Supabase:** Uses seeded users from your database:
```typescript
import { TEST_USERS } from './tests/playwright-helpers/auth'

// Pre-configured test users
TEST_USERS.regular    // testuser1@example.com
TEST_USERS.admin      // ewongagent@gmail.com
TEST_USERS.superAdmin // zach@unicorn.love
```

## Migration from Clerk

If you're migrating from Clerk to Supabase, here's the mapping:

| Clerk Code | Supabase Code |
|------------|---------------|
| `clerk().signInAsUser(page, creds)` | `signInAsUser(page, email, password)` |
| `clerk().signInAsAdmin(page)` | `signInAsAdmin(page)` |
| `clerk().getToken(page)` | `await getBearerToken(email, password)` |
| `clerk().signOut(page)` | Manual localStorage cleanup |

## Advantages of Our Implementation

1. ✅ **No external dependency** - Built into project
2. ✅ **Uses your seed data** - Works with existing test users
3. ✅ **Full control** - Customize as needed for your app
4. ✅ **Similar API** - Easy to use if familiar with Clerk
5. ✅ **Bearer tokens** - Same pattern as Clerk for API testing

## Limitations

1. ⚠️ **Manual signOut** - No built-in signOut helper (yet)
2. ⚠️ **No guest users** - Would need to implement if needed
3. ⚠️ **Manual storage state** - Need to call helper functions
4. ⚠️ **Not officially supported** - Custom implementation vs official package

## Next Steps

To add more Clerk-like features:

1. **Add signOut helper:**
```typescript
export async function signOut(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('supabase.auth.token')
    localStorage.removeItem('supabase.auth.user')
  })
  await page.reload()
}
```

2. **Add guest user support** (if needed)

3. **Add auto storage state management** (advanced)

## Summary

Our Supabase auth helper provides **similar functionality to Clerk's official Playwright package** with a familiar API. While it requires manual setup in some areas (like storage state), it gives you full control and integrates seamlessly with your Supabase setup and seeded test users.



