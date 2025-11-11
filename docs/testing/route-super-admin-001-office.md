# Super-Admin Route Exploration: /office

## Route Information

**Path**: `/office`  
**Component Location**: `packages/core/features/office/`  
**Route File**: `apps/expo/app/office/_layout.tsx`  
**Authentication Required**: Super-admin (office role) - Enforced via `useRoleProtectedRoute(['office'])`  
**Protection Method**: tRPC middleware `officeProcedure` checks `user_has_role('office')`

---

## Overview

The `/office` route is the **primary super-admin dashboard** for system-wide management. It provides a drawer-based navigation interface with multiple management sections. All operations use the `officeProcedure` middleware which validates that the user has the "office" role before allowing access.

**Main Entry Point**: `/office` → Redirects to `/office/applications`

---

## Sub-Routes Discovered

### 1. Applications Management
- **Path**: `/office/applications`
- **Component**: `OfficeApplicationsScreen`
- **File**: `apps/expo/app/office/applications/index.tsx`
- **Feature**: `packages/core/features/office/applications/office-applications-screen.tsx`
- **Description**: ATS (Applicant Tracking System) dashboard with Kanban board view and filtering
- **Status**: Core functionality with partial implementation (list view coming soon)

### 2. Users Management
- **Path**: `/office/users` - List all users
- **Path**: `/office/users/create` - Create new user
- **Path**: `/office/users/[id]/edit` - Edit user profile/employment data
- **Component**: `OfficeUsersList` / `UserForm`
- **Features**:
  - List paginated users with search
  - Create users (sends invite email via Supabase Auth)
  - Edit user general profile and employment data
  - Delete users (hard delete with cascading cleanup)

### 3. Jobs Management
- **Path**: `/office/jobs` - List all jobs
- **Path**: `/office/jobs/create` - Create new job
- **Path**: `/office/jobs/[id]/edit` - Edit job details
- **Component**: `OfficeJobsList` / `JobForm`
- **Features**:
  - Comprehensive job creation/editing with 9 form sections:
    - Job Metadata (title, description, location, compensation)
    - Application Screening (location, experience requirements)
    - Auto-Rejection (score thresholds, criteria)
    - Score Threshold Settings
    - Enhanced Requirements (education, background checks, licenses)
    - Compensation & Benefits
    - Application Process Configuration
    - Location & Scheduling
    - Distribution & Visibility
  - Job status management (draft → open → closed/paused)
  - Certification and skill associations (polymorphic)
  - Delete jobs (hard delete with cascading cleanup)

### 4. Organizations Management
- **Path**: `/office/organizations` - List all organizations
- **Path**: `/office/organizations/create` - Create new organization
- **Path**: `/office/organizations/[id]/edit` - Edit organization
- **Component**: `OfficeOrganizationsList`
- **Features**:
  - Multi-tenant organization management
  - Name, slug, industry, logo URL, visibility settings
  - Location data (JSONB storage)
  - Delete organizations (cascading: teams, jobs, applications, skills)

### 5. Universities Management
- **Path**: `/office/universities` - List all universities
- **Path**: `/office/universities/create` - Create new university
- **Path**: `/office/universities/[id]/edit` - Edit university
- **Component**: `OfficeUniversitiesList`
- **Features**:
  - University catalog management (10,191 universities from 202 countries)
  - Search and filter by country
  - Pagination (100 results per page)
  - Slug uniqueness validation
  - Deletion with validation (prevents deletion if used in user education)
  - Statistics view (total count, country count, usage in education)

### 6. Certifications Management
- **Component**: `OfficeCertificationsLeft`
- **Features**: (Integrated into dashboard widget)
  - Create, read, update certifications
  - Categories: safety, trade, equipment, license, management, other
  - Renewal tracking (optional renewal periods)
  - Typical duration tracking
  - Deactivation/reactivation (soft delete)
  - Search by name and category

---

## Routing Structure

```
/office (entry point - redirects to /applications)
├── applications/
│   └── index.tsx (Kanban board, filtering, list view)
├── users/
│   ├── index.tsx (list)
│   └── [id]/
│       └── edit.tsx (edit user)
│   └── create.tsx (create new user)
├── jobs/
│   ├── index.tsx (list)
│   ├── create.tsx (create job)
│   └── [id]/
│       └── edit.tsx (edit job)
├── organizations/
│   ├── index.tsx (list)
│   ├── create.tsx (create organization)
│   └── [id]/
│       └── edit.tsx (edit organization)
└── universities/
    ├── index.tsx (list)
    ├── create.tsx (create university)
    └── [id]/
        └── edit.tsx (edit university)
```

---

## UI Components Analysis

### Common Components

#### `OfficePageLayout` (Generic List Page Template)
- **Location**: `packages/core/features/office/components/OfficePageLayout.tsx`
- **Purpose**: Reusable layout for all list pages (users, jobs, organizations, universities)
- **Features**:
  - Search input with debouncing
  - Create button for adding new items
  - DataTable with TanStack React Table
  - Pagination support
  - Loading states
  - Empty state messaging

#### `DeleteButton` (Confirmation Dialog)
- **Location**: `packages/core/features/office/components/DeleteButton.tsx`
- **Purpose**: Confirmation UI for permanent deletions
- **Props**: `itemName`, `itemType`, `onDelete` callback

#### `OfficePageHeader`
- **Location**: `packages/core/features/office/components/OfficePageHeader.tsx`
- **Purpose**: Consistent header styling and navigation

### Specialized Components

#### `JobForm` (Advanced Multi-Section Form)
- **Location**: `packages/core/features/office/components/JobForm.tsx`
- **Mode**: Create or Edit
- **Form Sections** (9 sections):
  1. Job Metadata (title, description, organization, position level)
  2. Application Screening (location, experience, work authorization, start date)
  3. Auto-Rejection (score thresholds, criteria flags)
  4. Score Threshold Settings
  5. Enhanced Requirements (education level, background checks, drug tests, drivers license)
  6. Compensation & Benefits (pay range, benefits)
  7. Application Process (deadline, questions, documents)
  8. Location & Scheduling (address form, working hours, shifts)
  9. Distribution & Visibility (internal codes, departments, confidentiality)

#### `UserForm`
- **Location**: `packages/core/features/office/components/UserForm.tsx`
- **Sections**:
  - General Profile (first name, last name, display name, about, avatar)
  - Employment Data (preferred locations, travel willingness, work authorization, license classes, military status, availability, hourly rate)

#### `OrganizationForm`
- **Location**: `packages/core/features/office/components/OrganizationForm.tsx`
- **Features**:
  - Name and slug (with uniqueness validation)
  - Industry selection
  - Logo URL
  - Visibility (public/private)
  - Locations input (JSONB storage)

#### `OfficeCertificationsLeft`
- **Location**: `packages/core/features/office/office-certifications-left.tsx`
- **Features**:
  - Create/edit certifications
  - Auto-generate slug from name
  - Category selection
  - Renewal configuration
  - Conditional renewal period field

#### `ApplicationsKanbanBoard`
- **Location**: `packages/core/features/office/applications/components/ApplicationsKanbanBoard.tsx`
- **Purpose**: Visual ATS pipeline with status columns
- **Statuses**: new, screen, interview, offer, hired, rejected

---

## Data Flow & Permissions

### Authentication & Authorization

**Authentication Layer**:
- User must be logged in (checked in Expo Router hook)
- Layout enforces: `useRoleProtectedRoute(['office'])`

**Authorization Layer** - tRPC Middleware (`officeProcedure`):
```typescript
// packages/supabase/functions/trpc/middleware.ts
export const officeProcedure = t.procedure.use(enforceOfficeRole);

// enforceOfficeRole checks:
// - User exists
// - User has 'office' role via user_has_role('office') RPC
// - Returns FORBIDDEN error if not authorized
```

**Database Context**:
- All office router operations use `supabaseAdmin` client (bypasses RLS)
- This allows super-admins to access/modify any organization's data

### tRPC Router Structure

**Main Router**: `packages/supabase/functions/trpc/routers/office.router.ts`

**Procedures** (all use `officeProcedure`):

#### Users Operations
- `listUsers()` - Query paginated users (limit 50, with public + private data)
- `getUser(id)` - Query single user (public + private profile)
- `updateUser(id, profile, privateData)` - Mutation
- `createUser(email, first_name, last_name)` - Mutation with auto-invite email
- `deleteUser(id)` - Hard delete with cascading cleanup:
  - user_skills, user_certifications, work_experience, education
  - applications, reviews, organization_members, private profile

#### Jobs Operations
- `listJobs(organization_id, status, limit, offset)` - Query with filters
- `getJob(id)` - Query single job with certifications and skills
- `createJob(jobCreateSchema)` - Mutation
- `updateJob(jobUpdateSchema)` - Mutation
- `publishJob(id)` - Status: draft → open + sets posted_at
- `closeJob(id)` - Status → closed
- `deleteJob(id)` - Hard delete with cascading (certifications, skills, applications)

#### Organizations Operations
- `getOrganizations()` - Simple list for dropdowns
- `listOrganizations(limit, offset, search)` - Full paginated list
- `getOrganization(id)` - Query single organization
- `createOrganization(name, slug, industry_id, logo_url, visibility, address)` - Mutation with slug uniqueness check
- `updateOrganization(id, ...)` - Mutation with slug uniqueness check (excluding current)
- `deleteOrganization(id)` - Hard delete with cascading

#### Certifications Operations
- `searchCertifications(query, category, include_inactive, limit, offset)` - Query
- `getCertifications()` - Simple active list
- `getCertification(id)` - Single certification
- `createCertification(name, slug, issuing_organization, category, ...)` - Mutation
- `updateCertification(id, ...)` - Mutation
- `deactivateCertification(id)` - Soft delete (is_active = false)
- `reactivateCertification(id)` - Soft delete reversal

#### Skills Operations
- `getSkills()` - Returns empty array (deprecated - needs update for polymorphic skills)

#### User Profile Operations (Admin View)
- `getUserGeneral(userId)` - Query user general profile
- `updateUserGeneral(userId, data)` - Mutation
- `getUserEmployment(userId)` - Query user employment data
- `updateUserEmployment(userId, data)` - Mutation

#### Universities Sub-Router
**Location**: `packages/supabase/functions/trpc/routers/office/universities.router.ts`

- `getUniversities(page, pageSize, search, country, sortBy, sortOrder)` - Query
- `getUniversity(id)` - Query single
- `getCountries()` - Group/count by country
- `createUniversity(name, slug, country, alpha_two_code, domains, web_pages, ...)` - Mutation
- `updateUniversity(id, ...)` - Mutation
- `deleteUniversity(id)` - Hard delete with validation (checks user_education references)
- `getStatistics()` - Aggregate stats
- `searchUniversities(query, country, limit)` - protectedProcedure (available to all authenticated users for education forms)

### RLS & Database Access

**Schema Separation**:
- `public` schema: users (basic profile), jobs, organizations, applications, certifications
- `private` schema: private user profile data (contact info, preferences)
- `data` schema: universities catalog, O*NET occupations, CSI skills

**Admin Access Pattern**:
All office procedures use `ctx.supabaseAdmin` which:
- Bypasses RLS policies
- Allows cross-organization access
- Enables data modification without row-level restrictions

---

## Data Model Overview

### Key Tables Accessed

#### users (public schema)
```
id, username, display_name, avatar_path, 
first_name, last_name, about, created_at, updated_at
```

#### profile (private schema)
```
user_id, birth_date, location, employment_status, job_search_status,
years_of_experience, current_title, current_employer,
preferred_work_locations, open_to_travel, travel_distance_miles,
us_resident, us_passport, drivers_license_classes, military_status,
availability, hourly_rate, street_address, city, state, zip_code, 
country, latitude, longitude
```

#### jobs
```
id, title, description, status (draft|open|paused|closed),
organization_id, employment_type, remote_option, location,
pay_range_min_cents, pay_range_max_cents, pay_range_type,
posted_at, created_by_user_id, created_at, updated_at,
[+10 custom fields for screening, auto-rejection, requirements, etc.]
```

#### organizations
```
id, name, slug, industry_id, logo_url, visibility (public|private),
owner_user_id, address (JSONB), locations (JSONB),
created_at, updated_at
```

#### universities (data schema)
```
id, name, slug, country, alpha_two_code, state_province,
domains (array), web_pages (array), metadata (JSONB),
created_at, updated_at
```

#### certifications
```
id, name, slug, category, issuing_organization, description,
typical_duration_days, requires_renewal, renewal_period_months,
is_active, metadata (JSONB), created_at, updated_at
```

#### applications
```
id, job_id, user_id, status, application_score, auto_rejected,
applied_at, updated_at, [screening answers, custom questions, attachments]
```

---

## Feature Completeness

### Fully Implemented
- [x] User management (list, create, edit, delete)
- [x] Job management (list, create, edit, delete, publish, close)
- [x] Organization management (list, create, edit, delete)
- [x] University management (full CRUD with stats)
- [x] Certification management (full CRUD with activation control)
- [x] Applications viewing (Kanban board with filtering)
- [x] Slug uniqueness validation
- [x] Cascading deletes for data integrity
- [x] Multi-section forms with validation
- [x] Search and filtering on list pages
- [x] Pagination support

### Partial Implementation
- [ ] Applications management (Kanban view done, list view TODO)
- [ ] Job skills (polymorphic skills need implementation per TODO comments)
- [ ] Skills endpoint (deprecated, needs O*NET/CSI integration)
- [ ] Job custom questions (form section exists, integration TBD)

### Known TODOs
1. **Job Skills**: `// TODO: Skill insertion needs to be updated for polymorphic skills` (lines 333-340, 395-407 in office.router.ts)
2. **Skills Endpoint**: `// TODO: Update to query from polymorphic skill sources (CSI, O*NET)` (lines 1106-1113)
3. **Applications List View**: "List view coming soon..." (office-applications-screen.tsx line 171)
4. **Attachments & Messages**: Not included in current applications query

---

## Testing Recommendations

### Route-Level Tests

#### Authentication & Authorization
- [ ] **Test**: Unauthenticated user accessing `/office` → redirects to login
- [ ] **Test**: Authenticated user without 'office' role accessing `/office/users` → FORBIDDEN error
- [ ] **Test**: Super-admin user can access all office routes successfully
- [ ] **Test**: useRoleProtectedRoute hook shows loading state before confirming authorization

#### List Pages
- [ ] **Test**: All list pages (users, jobs, organizations, universities) render data table correctly
- [ ] **Test**: Search/filter functionality filters results in real-time
- [ ] **Test**: Create button navigates to appropriate create page
- [ ] **Test**: Edit button in Actions column opens edit page with pre-filled data
- [ ] **Test**: Delete button shows confirmation dialog
- [ ] **Test**: Pagination works with offset/limit
- [ ] **Test**: Empty state displays when no data exists

#### Create/Edit Forms
- [ ] **Test**: JobForm with 9 sections submits correctly
- [ ] **Test**: Slug auto-generation from name (certifications, universities)
- [ ] **Test**: Slug uniqueness validation prevents duplicates (organizations, universities)
- [ ] **Test**: Conditional fields display correctly (e.g., renewal period only when requires_renewal=true)
- [ ] **Test**: Form validation shows errors for required fields
- [ ] **Test**: Address form integration works (location picker)
- [ ] **Test**: All select/dropdown fields populate correctly

#### Delete Operations
- [ ] **Test**: Delete user cascades to delete all related records
- [ ] **Test**: Delete job cascades to delete job_certifications, job_skills, applications
- [ ] **Test**: Delete organization cascades to teams, jobs, members
- [ ] **Test**: Delete university fails if used in user education (validation)
- [ ] **Test**: Confirmation dialog prevents accidental deletes

#### Specific Features
- [ ] **Test**: User creation sends invite email via Supabase Auth
- [ ] **Test**: Job status transitions (draft → open, open → closed)
- [ ] **Test**: Application scoring and auto-rejection logic
- [ ] **Test**: University search by country/name
- [ ] **Test**: Certification renewal configuration
- [ ] **Test**: Organization multi-location support

### tRPC Endpoint Tests
- [ ] All office.* endpoints require 'office' role
- [ ] listUsers/listJobs/etc. return correct paginated data
- [ ] getUser/getJob/etc. return full details with relationships
- [ ] Create mutations return created record
- [ ] Update mutations apply changes correctly
- [ ] Delete mutations clean up relationships
- [ ] Slug uniqueness checks work correctly
- [ ] Search RPC functions work (universities, certifications)

### Component Tests
- [ ] OfficePageLayout renders with all props correctly
- [ ] DataTable pagination works across all list pages
- [ ] JobForm mode='create' vs mode='edit' behaves differently
- [ ] ApplicationsKanbanBoard displays cards in correct columns
- [ ] Drawer navigation includes all office routes
- [ ] Error states handle tRPC errors gracefully
- [ ] Loading states show spinners during mutations

### Integration Tests
- [ ] Create user → see in user list
- [ ] Create job → publish job → status changes to 'open'
- [ ] Create organization → add jobs → delete organization cascades
- [ ] Edit user profile → changes reflect in list
- [ ] Search across different data types works

---

## Authentication Context

### Route Protection Flow
```
User navigates to /office
    ↓
OfficeLayout.tsx mounted
    ↓
useRoleProtectedRoute(['office']) hook
    ↓
Check if user authenticated
    ↓
Check if user has 'office' role (via auth context or API call)
    ↓
Return isLoading, isAuthorized
    ↓
If isLoading: show Spinner
If !isAuthorized: redirect (hook handles)
If isAuthorized: render DrawerLayout with screens
    ↓
Each screen component renders and calls tRPC endpoints
    ↓
officeProcedure middleware validates role again
    ↓
supabaseAdmin context bypasses RLS, returns data
```

### User Roles
The system uses a `roles` table with `user_has_role(user_id, role_name, org_id)` RPC function:
- **'office'** role = super-admin access (organization_id = NULL means global)
- Other roles in system: likely 'employer', 'recruiter', 'user', etc.

---

## Database Constraints & Validations

### Uniqueness Constraints
- **organizations.slug** - Must be unique across all organizations
- **universities.slug** - Must be unique across all universities
- **certifications.slug** (implicit) - Assumed unique
- **users email** - Unique in Supabase Auth

### Referential Integrity
- `jobs.organization_id` → organizations.id (CASCADE)
- `jobs.created_by_user_id` → users.id
- `applications.job_id` → jobs.id (CASCADE)
- `applications.user_id` → users.id (CASCADE)
- `user_education.university_id` → universities.id
- `job_certifications.certification_id` → certifications.id

### Cascading Deletes
- Delete organization → delete teams, jobs, organization_members
- Delete job → delete applications, job_certifications, job_skills
- Delete user → delete user_skills, user_certifications, work_experience, education, applications, reviews, organization_members, private profile

---

## Performance Considerations

### Query Optimization
- **listUsers**: Limited to 50 records, joins private schema
- **listJobs**: Paginated with offset/limit, includes organization and user relations
- **listOrganizations**: Joins industry table, paginated
- **getUniversities**: 100 records per page, supports filtering and sorting
- **Search functions**: Use trigram similarity (search_universities RPC)

### Pagination
- Default: 50 items per page
- Configurable via `limit` parameter (max varies by endpoint)
- Uses offset/limit pattern for stability

### Potential Bottlenecks
1. **listUsers with private schema join** - Might slow with large user bases
2. **jobForm with heavy mutation** - 9 form sections with complex data
3. **ApplicationsKanbanBoard** - Rendering many cards could cause performance issues
4. **Universities filter/search** - 10K+ records filtered client or server-side

---

## Error Handling

### tRPC Error Codes Used
- **UNAUTHORIZED** - User not authenticated
- **FORBIDDEN** - User lacks 'office' role
- **NOT_FOUND** - Resource doesn't exist
- **BAD_REQUEST** - Invalid input (e.g., slug conflicts, validation failures)
- **CONFLICT** - Slug already exists
- **INTERNAL_SERVER_ERROR** - Database operation failed

### UI Error Handling
- Toast notifications for success/error messages
- Loading states with Spinner component
- Conditional rendering based on isLoading, isError
- Error message display in cards/modals

---

## Related Routes & Dependencies

### Cross-Route Dependencies
- Office routes depend on:
  - Authentication system (`useRoleProtectedRoute`)
  - Organizations (for job context)
  - Users (for edit/creation)
  - Applications (job context)
  - Universities (user education context)
  
### Routes that Reference Office
- Worker profile routes reference universities catalog
- Recruiter/employer routes might reference organizations
- Career intelligence features reference certifications

---

## Summary

The `/office` super-admin route is a **comprehensive management interface** with:
- **5 main management modules**: Users, Jobs, Organizations, Universities, Certifications
- **1 ATS module**: Applications management with Kanban board
- **Modern form patterns**: Multi-section forms, conditional fields, validation
- **Proper authorization**: tRPC middleware checks, role-based access
- **Data integrity**: Cascading deletes, uniqueness constraints, referential integrity
- **User-friendly**: Search, filtering, pagination, loading states, error handling

**Key architectural patterns**:
- Drawer-based navigation (Expo Router)
- tRPC + Zod for type-safe APIs
- React Hook Form + Zod for client-side validation
- Tamagui + DataTable for UI
- Supabase Admin client for unrestricted access
- Toast notifications for feedback

**Completeness**: ~85% - Most core features implemented, some edges cases and enhancements pending (polymorphic skills, applications list view).
