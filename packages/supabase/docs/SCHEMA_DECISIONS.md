# Schema Design Decisions

**Date:** October 12, 2025  
**Status:** Active Reference Document

---

## Overview

This document records critical schema design decisions made during migration consolidation. It serves as a reference for understanding why certain fields exist (or don't exist) and provides guidance for updating application code.

---

## 📋 Schema Changes Made

### ✅ Fields Added to `private.profile`

| Field Name | Type | Default | Purpose |
|------------|------|---------|---------|
| `preferred_work_locations` | TEXT[] | `[]` | Cities/states where user wants to work |
| `authorized_countries` | TEXT[] | `[]` | Countries where user has work authorization |
| `drivers_license_classes` | TEXT[] | `[]` | Driver's license types (CDL, Class A, B, etc.) |
| `military_status` | TEXT[] | `[]` | Military service status (veteran, active, reserves, etc.) |
| `travel_distance_miles` | INTEGER | `25` | Maximum travel distance for work |
| `career_level` | TEXT | NULL | Career level (Junior, Mid, Senior, Lead, etc.) |

### ✅ Fields Modified

| Field Name | Old Default | New Default | Reason |
|------------|-------------|-------------|--------|
| `open_to_travel` | `false` | `true` | Most users are willing to travel; opt-out is more common |

### ✅ Fields Converted

| Old Field | New Field | Change Type |
|-----------|-----------|-------------|
| `drivers_license_class` TEXT | `drivers_license_classes` TEXT[] | Singular → Plural array (users can have multiple licenses) |

---

## ❌ Fields Explicitly Skipped

### Employment Address Fields
**Skipped:** `employment_street`, `employment_city`, `employment_state`, `employment_zip`, `employment_country`

**Reason:** The existing `address` JSONB column can store all address data with more flexibility:

```json
{
  "type": "employment",
  "street": "123 Main St",
  "city": "San Francisco",
  "state": "CA",
  "zip": "94102",
  "country": "US"
}
```

**Action Required:** Use `address` JSONB for all address storage.

---

### Duplicate Travel Field
**Skipped:** `willing_to_travel` boolean

**Reason:** We already have `open_to_travel` boolean with the same purpose.

**Decision:** Keep `open_to_travel` as the canonical field, changed default to `true`.

**Action Required:** Always use `open_to_travel`, never `willing_to_travel`.

---

### Duplicate Experience Field  
**Skipped:** `total_years_experience` smallint

**Reason:** We already have `public.users.years_of_experience` integer with the same purpose.

**Decision:** Keep `users.years_of_experience` as the canonical field (public, not PII).

**Action Required:** Always use `users.years_of_experience`, never `total_years_experience`.

---

## 🔄 Field Renaming

### authorized_countries (formerly residency_countries)
**Old Name:** `residency_countries`  
**New Name:** `authorized_countries`

**Reason:** More accurate terminology. "Authorized" clearly means work authorization, while "residency" could be confused with where someone lives.

**Action Required:** Use `authorized_countries` everywhere. If migrating old code, find/replace:
```
residency_countries → authorized_countries
```

---

## 🔍 Find/Replace Guide for Application Code

### 1. Driver's License (Singular → Plural Array)

```typescript
// ❌ OLD - Single license
const license = profile.drivers_license_class; // 'D'

// ✅ NEW - Multiple licenses array
const licenses = profile.drivers_license_classes; // ['D', 'CDL-A']
```

**Find/Replace:**
- `drivers_license_class` → `drivers_license_classes`
- Update any code expecting a single string to handle arrays
- Update forms to allow multiple license selections

---

### 2. Work Authorization Countries

```typescript
// ❌ OLD
const countries = profile.residency_countries;

// ✅ NEW  
const countries = profile.authorized_countries;
```

**Find/Replace:**
- `residency_countries` → `authorized_countries`

---

### 3. Travel Willingness

```typescript
// ❌ OLD - Multiple fields
const willing = profile.willing_to_travel;
const open = profile.open_to_travel;

// ✅ NEW - Single canonical field
const isWillingToTravel = profile.open_to_travel; // Now defaults to true
```

**Find/Replace:**
- `willing_to_travel` → `open_to_travel`
- Update any code that referenced `willing_to_travel`

---

### 4. Years of Experience

```typescript
// ❌ OLD - Private schema
const years = privateProfile.total_years_experience;

// ✅ NEW - Public users table
const years = user.years_of_experience;
```

**Find/Replace:**
- `private.profile.total_years_experience` → `public.users.years_of_experience`
- Move any queries from private.profile to public.users

---

### 5. Employment Address

```typescript
// ❌ OLD - Separate fields
const address = {
  street: profile.employment_street,
  city: profile.employment_city,
  state: profile.employment_state,
  zip: profile.employment_zip,
  country: profile.employment_country
};

// ✅ NEW - Use JSONB address field
const address = profile.address; // { type: 'employment', street: '...', ... }
```

**Action:** Refactor address handling to use JSONB structure.

---

## 📊 Data Type Reference

### Array Fields in private.profile
All array fields default to empty array `[]`:
- `contact_prefs` TEXT[]
- `phone_os` TEXT[]
- `availability` TEXT[]
- `certifications` TEXT[]
- `preferred_work_locations` TEXT[] ← NEW
- `authorized_countries` TEXT[] ← NEW
- `drivers_license_classes` TEXT[] ← NEW (converted)
- `military_status` TEXT[] ← NEW

### JSONB Fields
- `address` - Flexible address storage (home, work, employment, etc.)
- `notification_preferences` (in private.preferences)
- `ui_preferences` (in private.preferences)
- `riasec_scores` (in private.preferences)
- `skills_summary` (in public.users)

---

## 🎯 Migration Impact

### Affected tRPC Routers
These routers were already updated during table reference migration:
- ✅ `profile/general.router.ts` - Uses private.profile
- ✅ `profile/employment.router.ts` - Uses private.profile  
- ✅ `profile/completion.router.ts` - Fixed to use new fields
- ✅ `prerequisites.router.ts` - Uses private.profile

### Affected UI Components
Areas that may need updates:
- Profile forms (add new fields)
- Prerequisites flow (travel distance, work locations)
- Job matching (authorized countries, travel willingness)
- Profile completion progress (new fields count)

---

## 🧪 Testing Checklist

After updating application code:

- [ ] Test profile form with new array fields
- [ ] Verify drivers_license_classes accepts multiple values
- [ ] Test work location preferences UI
- [ ] Verify authorized_countries in job matching
- [ ] Check profile completion calculation includes new fields
- [ ] Test travel distance radius queries
- [ ] Verify career_level dropdown/selection
- [ ] Confirm open_to_travel defaults to true for new users

---

## 📝 Related Documentation

- [TABLE_MIGRATION_TODO.md](./TABLE_MIGRATION_TODO.md) - Migration completion status
- [MIGRATION_AUDIT.md](./MIGRATION_AUDIT.md) - Full migration analysis
- [PRIVATE_SCHEMA_MIGRATION.md](./PRIVATE_SCHEMA_MIGRATION.md) - Private schema design
- [PROFILES_TO_USERS_MIGRATION.md](./PROFILES_TO_USERS_MIGRATION.md) - Table rename history

---

## 💡 Best Practices

### Working with Array Fields
```typescript
// ✅ Good - Safe array operations
const licenses = profile.drivers_license_classes || [];
const hasCommercial = licenses.includes('CDL-A');

// ❌ Bad - Assumes array exists
const hasCommercial = profile.drivers_license_classes.includes('CDL-A');
```

### Working with JSONB Address
```typescript
// ✅ Good - Type-safe access
interface Address {
  type?: 'home' | 'work' | 'employment';
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

const addr: Address = profile.address || {};
const city = addr.city;

// ❌ Bad - Unsafe access
const city = profile.address.city; // Could throw if null
```

---

## 🔐 Security Considerations

All fields added to `private.profile` are considered **PII (Personally Identifiable Information)**:

- ✅ Protected by RLS policies (user can only see their own data)
- ✅ Only accessible via authenticated sessions
- ✅ Service role has full access for admin operations
- ✅ Never exposed in public API responses

Fields in `public.users` are **public profile data**:
- Can be viewed by anonymous and authenticated users
- Should never contain sensitive information
- Suitable for search, discovery, and public profiles

---

## 🚀 Deployment Notes

When deploying these schema changes:

1. **Run migration:** `pnpm supa db reset` (local) or `pnpm supa migration:up` (remote)
2. **Regenerate types:** `pnpm supa:generate`
3. **Update application code** using this guide
4. **Test thoroughly** before production deploy
5. **Monitor** for any references to deprecated fields

---

## 📅 Change Log

| Date | Change | Author |
|------|--------|---------|
| 2025-10-12 | Initial document creation | System |
| 2025-10-12 | Added 6 new columns to private.profile | System |
| 2025-10-12 | Converted drivers_license_class to array | System |
| 2025-10-12 | Renamed residency_countries → authorized_countries | System |
| 2025-10-12 | Changed open_to_travel default to true | System |
| 2025-10-12 | Documented skipped fields (employment_*, willing_to_travel, total_years_experience) | System |
