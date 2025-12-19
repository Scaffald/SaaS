# Test Migration Plan: FRS-Prototype to UNI-Construct

**Date**: 2025-12-15
**Status**: In Progress
**Author**: Claude Code

## Overview

Migration of tests from `FRS-Prototype` to `UNI-Construct/apps/forsured-web` that were not included in the original code migration.

## Summary

| Category | Count | Source | Destination |
|----------|-------|--------|-------------|
| Test Helpers | 2 | `FRS-Prototype/tests/helpers/` | `apps/forsured-web/tests/helpers/` |
| Test Fixtures | 1 | `FRS-Prototype/tests/fixtures/` | `apps/forsured-web/tests/fixtures/` |
| Integration Tests | 7 | `FRS-Prototype/tests/integration/` | `apps/forsured-web/tests/integration/` |
| Performance Tests | 1 | `FRS-Prototype/tests/performance/` | `apps/forsured-web/tests/performance/` |
| UI Component Tests | 16 | `FRS-Prototype/packages/*/src/__tests__/` | `packages/ui/src/__tests__/` |
| **Total** | **27** | | |

## Import Path Mappings

### Package Imports

| FRS-Prototype | UNI-Construct |
|---------------|---------------|
| `@frs/core` | `@unicornlove/ui` |
| `@frs/forms` | `@unicornlove/ui` |
| `@frs/layout` | `@unicornlove/ui` |
| `@frs/data-display` | `@unicornlove/ui` |
| `@frs/tasks` | `@unicornlove/tasks` |
| `@frs/compliance` | `@unicornlove/compliance` |
| `@frs/insurance` | `@unicornlove/insurance` |

### App Path Aliases

| FRS-Prototype | UNI-Construct |
|---------------|---------------|
| `@/lib/*` | `@/lib/*` (maps to `./src/lib/*`) |
| `@/utils/*` | `@/utils/*` (maps to `./src/utils/*`) |
| `@/types` | `@/types` (maps to `./src/types`) |

### UI Component Paths (for packages/ui tests)

| FRS Component | UNI-Construct Path |
|---------------|-------------------|
| Button | `../components/buttons/Button` |
| Heading (Typography) | `../components/typography/Heading` |
| Avatar | `../components/avatars/AvatarGroup` |
| Badge | `../components/cards/CardBadges` |
| Icon | `@tamagui/lucide-icons` |
| Select | `../components/select/ResponsiveSelect` |
| Checkbox | `../components/inputs/Checkbox` |
| ToggleSwitch | `../components/inputs/ToggleSwitch` |
| Card | `tamagui` (re-exported) |
| DataTable | `../components/table/` |
| Modal | `../components/modal/ResponsiveModal` |
| Sheet/Drawer | `../components/sheets/Sheet` |
| Tabs | `@tamagui/tabs` |

## Directory Structure

```
UNI-Construct/
├── apps/forsured-web/
│   └── tests/
│       ├── e2e/                    # Already exists
│       ├── integration/            # NEW
│       │   ├── auditLoggingAndDashboard.test.ts
│       │   ├── performanceSecurityDataIntegrity.test.ts
│       │   ├── complianceGapsToTasks.test.ts
│       │   ├── crossSchemaRelationships.test.ts
│       │   ├── documentUploadToCompliance.test.ts
│       │   ├── rbacAndTaskAssignment.test.ts
│       │   └── security-penetration.test.ts
│       ├── performance/            # NEW
│       │   └── query-benchmarks.test.ts
│       ├── helpers/                # NEW
│       │   ├── rbacHelper.ts
│       │   └── testDatabase.ts
│       └── fixtures/               # NEW
│           └── sample-coi.pdf
│
└── packages/ui/
    └── src/
        └── __tests__/              # NEW
            ├── Button.test.tsx
            ├── Heading.test.tsx
            ├── Badge.test.tsx
            ├── Icon.test.tsx
            ├── Avatar.test.tsx
            ├── Select.test.tsx
            ├── TextInput.test.tsx
            ├── Checkbox.test.tsx
            ├── ToggleSwitch.test.tsx
            ├── Card.test.tsx
            ├── ExpandableRow.test.tsx
            ├── List.test.tsx
            ├── DataTable.test.tsx
            ├── Modal.test.tsx
            ├── Drawer.test.tsx
            └── Tabs.test.tsx
```

## Execution Phases

### Phase 1: Create Directory Structure
- Create `apps/forsured-web/tests/integration/`
- Create `apps/forsured-web/tests/performance/`
- Create `apps/forsured-web/tests/helpers/`
- Create `apps/forsured-web/tests/fixtures/`
- Create `packages/ui/src/__tests__/`

### Phase 2: Migrate Test Helpers
- Copy and adapt `rbacHelper.ts`
- Copy and adapt `testDatabase.ts`

### Phase 3: Migrate Test Fixtures
- Copy `sample-coi.pdf`

### Phase 4: Migrate Integration Tests (7 files)
- Adapt imports for each file
- Update service references

### Phase 5: Migrate Performance Tests (1 file)
- Adapt imports

### Phase 6: Migrate UI Component Tests (16 files)
- Adapt component imports to packages/ui structure
- Update Tamagui mocking as needed

### Phase 7: Update Configuration
- Update `apps/forsured-web/vitest.config.ts`
- Add test scripts to `apps/forsured-web/package.json`
- Update `packages/ui/package.json` if needed

### Phase 8: Verification
- Run all migrated tests
- Fix any failing tests
- Validate mock validations pass

## Configuration Updates

### vitest.config.ts additions

```typescript
include: [
  'src/**/*.{test,spec}.{ts,tsx}',
  'tests/integration/**/*.test.ts',
  'tests/performance/**/*.test.ts',
],
```

### package.json script additions

```json
{
  "scripts": {
    "test:integration": "vitest run tests/integration",
    "test:performance": "vitest run tests/performance",
    "test:all": "vitest run"
  }
}
```

## Notes

- Integration tests use ForSured-specific domain concepts (RBAC roles, task assignment)
- UI component tests require Tamagui mocking similar to FRS-Prototype
- Some components have different names/structures in UNI-Construct (Typography → Heading)
- List and ExpandableRow components may need alternative approaches
