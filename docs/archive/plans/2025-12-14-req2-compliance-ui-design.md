# REQ-2: Compliance Requirements UI Implementation Plan

## Overview

Admin interface for managing compliance requirements with list view, editor, dependency visualization, version history, and bulk operations.

## Architecture

### File Structure

```
apps/forsured-web/src/
├── pages/admin/
│   └── ComplianceRequirements.tsx    # Main admin page
├── components/Admin/Compliance/
│   ├── RequirementsList.tsx          # Data table with filtering
│   ├── RequirementEditor.tsx         # Create/edit modal form
│   ├── DependencyGraph.tsx           # Tree visualization
│   ├── VersionHistory.tsx            # Timeline + diff view
│   └── BulkOperationsModal.tsx       # Import/export dialogs
└── hooks/
    └── useComplianceRequirements.ts  # tRPC hooks wrapper
```

### Design Decisions

1. **Single page with tabs** - Keeps related functionality together
2. **Modal-based editing** - Faster workflow than separate pages
3. **Client-side filtering** - For datasets <100 items
4. **Tree view for dependencies** - Simpler than graph, can enhance later
5. **Reuse existing components** - DataTable, Modal, Button from Common/

## Components

### 1. ComplianceRequirements.tsx (Main Page)

- Tab navigation: List | Dependencies | Versions | Bulk Operations
- Header with "New Requirement" button
- Admin-only access check

### 2. RequirementsList.tsx

- Uses DataTable from Common/
- Columns: Code, Name, Type, Status, Effective Date, Actions
- Filters: Type dropdown, Status dropdown, Search input
- Row actions: Edit, View Dependencies, View History, Archive
- tRPC: `complianceRequirements.list`

### 3. RequirementEditor.tsx (Modal)

- Form fields: code, name, type, status, description, dates, is_template
- Coverage limits section with currency formatting
- tRPC: `complianceRequirements.create`, `complianceRequirements.update`
- Validation via Zod schemas

### 4. DependencyGraph.tsx

- Tree view with expandable nodes
- tRPC: `complianceDependencies.getTree`
- Click to view requirement details

### 5. VersionHistory.tsx

- Timeline list with version metadata
- Side-by-side diff comparison
- Rollback capability
- tRPC: `complianceRequirements.getVersions`, `complianceRequirements.compareVersions`

### 6. BulkOperationsModal.tsx

- Import: File upload, format selection, preview, execute
- Export: Format selection, filters, download
- tRPC: `bulkOperations.preview`, `bulkOperations.execute`, `bulkOperations.export`

## Implementation Order

1. RequirementsList.tsx + useComplianceRequirements hook (TASK-13)
2. RequirementEditor.tsx (TASK-14)
3. ComplianceRequirements.tsx (main page integrating 1 & 2)
4. DependencyGraph.tsx (TASK-15)
5. VersionHistory.tsx (TASK-16)
6. BulkOperationsModal.tsx

## Success Criteria

- All CRUD operations work correctly
- Filtering and search functional
- Dependency tree renders correctly
- Version history shows diffs
- Bulk import/export operational
- Admin-only access enforced
