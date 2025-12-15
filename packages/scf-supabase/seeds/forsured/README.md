# ForSured Test Seeds

Deterministic test data for ForSured application testing.

## Quick Start

```bash
# Seed ForSured test data (requires Supabase running)
pnpm supa:seed:forsured

# Or using SQL directly
pnpm supa db seed --file seeds/forsured/seed-forsured.sql
```

## Test Users

All test users have the password: `ForsuredTest123!`

| User Type | Email | UUID |
|-----------|-------|------|
| GC (Fresh) | gc-fresh@forsured-test.com | 50000000-0000-0000-0000-000000000001 |
| GC (Onboarding) | gc-onboarding@forsured-test.com | 50000000-0000-0000-0000-000000000002 |
| GC (Active) | gc-active@forsured-test.com | 50000000-0000-0000-0000-000000000003 |
| GC (MultiProject) | gc-multiproject@forsured-test.com | 50000000-0000-0000-0000-000000000004 |
| Contractor (Fresh) | contractor-fresh@forsured-test.com | 50000000-0000-0000-0000-000000000011 |
| Contractor (Active) | contractor-active@forsured-test.com | 50000000-0000-0000-0000-000000000012 |
| Contractor (NonCompliant) | contractor-noncompliant@forsured-test.com | 50000000-0000-0000-0000-000000000013 |
| Broker (Fresh) | broker-fresh@forsured-test.com | 50000000-0000-0000-0000-000000000021 |
| Broker (Active) | broker-active@forsured-test.com | 50000000-0000-0000-0000-000000000022 |
| Admin | admin@forsured-test.com | 50000000-0000-0000-0000-000000000031 |
| Super Admin | superadmin@forsured-test.com | 50000000-0000-0000-0000-000000000032 |

## Test Organizations

| Organization | Type | UUID |
|--------------|------|------|
| Acme Construction Group | GC | 60000000-0000-0000-0000-000000000001 |
| BuildRight Contractors | GC | 60000000-0000-0000-0000-000000000002 |
| Pacific Coast Builders | GC | 60000000-0000-0000-0000-000000000003 |
| Elite Electrical Services | Contractor | 60000000-0000-0000-0000-000000000011 |
| Budget Plumbing Co | Contractor | 60000000-0000-0000-0000-000000000012 |
| Phoenix HVAC Solutions | Contractor | 60000000-0000-0000-0000-000000000013 |
| Pinnacle Insurance Brokers | Broker | 60000000-0000-0000-0000-000000000021 |

## Test Projects

| Project | Organization | Status | UUID |
|---------|--------------|--------|------|
| Downtown Office Tower - Phase 1 | Acme Construction | Active | 70000000-0000-0000-0000-000000000001 |
| Riverside Medical Center Expansion | Acme Construction | Active | 70000000-0000-0000-0000-000000000002 |
| West Coast Distribution Hub | Pacific Coast | Active | 70000000-0000-0000-0000-000000000003 |
| Industrial Park Renovation | Acme Construction | Non-Compliant | 70000000-0000-0000-0000-000000000011 |
| Tech Campus Building B | BuildRight | Warning | 70000000-0000-0000-0000-000000000012 |
| Municipal Water Treatment Facility | Acme Construction | Completed | 70000000-0000-0000-0000-000000000021 |

## Using Test IDs in Code

```typescript
import {
  FORSURED_USER_IDS,
  FORSURED_ORG_IDS,
  FORSURED_PROJECT_IDS,
  FORSURED_TEST_CREDENTIALS
} from '@scf/supabase/seeds/forsured';

// Use in tests
const ctx = {
  userId: FORSURED_USER_IDS.GC_ACTIVE,
  organizationId: FORSURED_ORG_IDS.GC_ORG_PRIMARY,
};

// Get test credentials
const { email, password } = FORSURED_TEST_CREDENTIALS.users.gcActive;
```

## Files

| File | Description |
|------|-------------|
| `test-ids.ts` | Fixed UUID constants for all test entities |
| `001_seed-users.sql` | Auth users (GC, Contractor, Broker, Admin) |
| `002_seed-organizations.sql` | Organizations and role assignments |
| `003_seed-projects.sql` | Projects, subcontractors, requirements |
| `004_seed-policies.sql` | Documents, policies, endorsements, compliance scores |
| `005_seed-tasks.sql` | Tasks, comments, status history |
| `seed-forsured.sql` | SQL orchestrator (runs all in order) |
| `seed-forsured.ts` | TypeScript programmatic seeder |
| `index.ts` | Module exports for test usage |

## UUID Conventions

- `50000000-*` - Test users
- `60000000-*` - Test organizations
- `70000000-*` - Test projects
- `71000000-*` - Test subcontractors
- `72000000-*` - Test documents
- `73000000-*` - Test policies
- `74000000-*` - Test requirements
- `75000000-*` - Test tasks
- `76000000-*` - Test compliance scores

## Compliance Status Examples

The seed data includes examples of all compliance states:

- **Compliant (100%)**: Johnson Electrical - all coverage meets requirements
- **Compliant (95%)**: Williams Plumbing - minor missing endorsement
- **Warning (75%)**: Brown Concrete - GL expiring in 15 days
- **Warning (60%)**: Anderson Steel - missing waiver of subrogation
- **Critical (40%)**: Wilson Demolition - expired GL, insufficient coverage
- **Critical (20%)**: Davis Painting - no documentation on file

## Prerequisites

1. Supabase must be running: `pnpm supa start`
2. Core migrations applied: `pnpm supa db reset`
3. Core seeds should be run first for industries: `pnpm supa:seed`
