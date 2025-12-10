# REQ-165: Compliance Requirements Management System

## Overview
Complete CRUD system for defining and managing insurance compliance requirements that subcontractors must meet for construction projects.

## Features Implemented

### 1. Data Model & Schema
- **Types** (`types.ts`): Complete TypeScript interfaces for requirements, templates, and associations
- **Schema Validation** (`schema.ts`): JSON schema validation with type-specific rules
- **Templates** (`templates.ts`): 6 pre-built insurance requirement templates

### 2. Core Services

#### Requirement Service (`requirementService.ts`)
- `createRequirement()`: Create new requirements with validation
- `getRequirement()`: Retrieve single requirement by ID
- `listRequirements()`: Query with filtering, sorting, pagination
- `updateRequirement()`: Version-controlled updates
- `deleteRequirement()`: Soft delete (archive)
- `cloneRequirement()`: Duplicate requirements
- `getRequirementVersions()`: Full version history

#### Project Requirement Service (`projectRequirementService.ts`)
- `associateRequirementWithProject()`: Link requirements to projects
- `getProjectRequirements()`: Get all requirements for a project
- `removeRequirementFromProject()`: Remove associations
- `updateProjectRequirement()`: Update association settings
- `canDeleteRequirement()`: Check if requirement can be deleted
- `getProjectsUsingRequirement()`: Find projects using a requirement

### 3. UI Components

#### RequirementList (`RequirementList.tsx`)
- Paginated list view with search
- Filter by type, status, template flag
- Sort by multiple fields
- Action buttons: View, Edit, Clone, Archive

#### RequirementDetail (`RequirementDetail.tsx`)
- Read-only detail view
- Coverage limits display
- Required endorsements
- Policy conditions
- Documentation requirements
- Version history with comparison

#### RequirementEditor (`RequirementEditor.tsx`)
- Form-based CRUD interface
- Real-time JSON schema validation
- Dynamic field management (add/remove endorsements, conditions, docs)
- Change summary for version tracking
- Support for create and update modes

#### TemplateSelector (`TemplateSelector.tsx`)
- Visual template picker
- Filter by insurance type
- Coverage display
- Quick creation from templates
- Custom requirement option

### 4. Templates Included
1. **General Liability $1M/$2M**: Standard GL coverage
2. **General Liability $2M/$4M**: Enhanced GL coverage
3. **Workers Compensation**: Statutory limits with EMR
4. **Auto Liability $1M CSL**: Commercial auto coverage
5. **Umbrella $5M**: Excess liability coverage
6. **Umbrella $10M**: High-limit excess coverage

### 5. Version Control System
- Automatic version incrementing on updates
- Parent-child linking between versions
- Superseded date tracking
- Change summary required for updates
- Version history view with comparison

### 6. Validation Features
- JSON schema validation for requirement definitions
- Type-specific validation rules (GL, Workers Comp, Auto, Umbrella)
- Unique name enforcement per organization
- Effective date validation (no past dates)
- Draft requirements cannot be assigned to projects

## Testing
- **30 tests total** (100% passing)
- 22 requirement service tests
- 8 project requirement tests
- TDD approach with full coverage
- Uses MockDatabase from REQ-106

## Database Schema

### compliance_requirements
- Core requirement data
- JSON requirement_definition field
- Version control fields
- Organization scoping

### project_requirements
- Junction table for project-requirement associations
- Mandatory/optional flag
- Assignment tracking (who/when)

## Usage Examples

### Create a Requirement from Template
```typescript
import { getGeneralLiabilityTemplate1M2M, createRequirement } from './lib/compliance';

const template = getGeneralLiabilityTemplate1M2M(organizationId, userId);
const requirement = await createRequirement(template);
```

### List Active Requirements
```typescript
import { listRequirements } from './lib/compliance';

const result = await listRequirements({
  filters: {
    status: RequirementStatus.ACTIVE,
    organization_id: organizationId
  },
  page: 1,
  limit: 20
});
```

### Update a Requirement (Creates New Version)
```typescript
import { updateRequirement } from './lib/compliance';

const newVersion = await updateRequirement(requirementId, {
  name: 'Updated GL Requirement',
  change_summary: 'Increased coverage limits to $5M',
  requirement_definition: {
    // updated definition
  }
});
```

### Associate with Project
```typescript
import { associateRequirementWithProject } from './lib/compliance';

await associateRequirementWithProject({
  project_id: projectId,
  requirement_id: requirementId,
  is_mandatory: true,
  assigned_by: userId
});
```

## API Design (Future Implementation)
The service layer is designed to map directly to REST endpoints:
- `POST /api/v1/compliance-requirements` → createRequirement
- `GET /api/v1/compliance-requirements/:id` → getRequirement
- `GET /api/v1/compliance-requirements` → listRequirements
- `PUT /api/v1/compliance-requirements/:id` → updateRequirement
- `DELETE /api/v1/compliance-requirements/:id` → deleteRequirement
- `POST /api/v1/compliance-requirements/:id/clone` → cloneRequirement

## Success Metrics
- ✅ Create/read/update/delete requirements
- ✅ JSON schema validates all requirements
- ✅ Templates cover 6 common insurance types
- ✅ UI allows custom requirement creation
- ✅ Version control tracks all changes
- ✅ Requirements linkable to projects
- ✅ All 30 tests passing
- ✅ Zero linting errors

## Next Steps
1. Integrate with real API endpoints
2. Add requirement dependency system (e.g., Umbrella requires GL)
3. Implement field-level version comparison
4. Add bulk operations for project assignments
5. Create admin interface for template management
