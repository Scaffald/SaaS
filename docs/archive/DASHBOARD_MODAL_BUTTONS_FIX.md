# Dashboard Modal Buttons Fix

**Issue**: Contact Broker, Upload Document, and Request Quote buttons are missing from the subcontractor dashboard.

**Date**: 2025-12-19

## Root Cause

The dashboard modal buttons depend on tasks having a `quick_actions` array field that specifies which actions should be available for each task. However, the database schema for `forsured.tasks` table is missing:

1. **`quick_actions` field** - Array of action identifiers
2. **`metadata` JSONB column** - Flexible storage for task-specific data (broker contact info, severity levels, limits, etc.)
3. **Additional required fields** - task_type, origin_role, priority, due_date, etc.

## Components Involved

### 1. Dashboard Component
**File**: `apps/forsured-web/src/components/Dashboard/EnhancedSubcontractorDashboard.tsx`

- Has modal state handlers: `setContactBrokerModalOpen`, `setUploadModalOpen`, `setQuoteModalOpen`
- Has action handlers: `handleContactBroker`, `handleUploadDocument`, `handleRequestQuote`
- Renders three modals: Contact Broker Modal (lines 378-446), Upload Document Modal (lines 448-553), Request Quote Modal (lines 555-633)
- All modals are properly wired with state and handlers ✓

### 2. Tasks Panel Component
**File**: `apps/forsured-web/src/components/Subcontractor/SubcontractorTasksPanel.tsx`

- Renders quick action buttons based on `task.quick_actions` array (lines 449-512)
- Maps quick action identifiers to button clicks:
  - `'upload_document'` → Upload button (lines 451-464)
  - `'view_requirements'` → Requirements button (lines 465-478)
  - `'contact_broker'` → Broker button (lines 479-492)
  - `'request_quote'` → Quote button (lines 493-512)
- Buttons only appear if `task.quick_actions` array contains the action identifier

### 3. Task Type Definition
**File**: `apps/forsured-web/src/types.ts`

```typescript
export interface Task {
  // ... other fields
  quick_actions?: string[];  // Line 347
  metadata?: unknown | SubcontractorTaskMetadata;  // Line 328
  // ... more fields
}
```

## Solution

### Migration 1: Add Missing Columns
**File**: `packages/supabase/migrations/210_add_tasks_metadata.sql`

Adds the following columns to `forsured.tasks`:

- `metadata JSONB` - Stores flexible task data (broker contact, severity, limits)
- `quick_actions TEXT[]` - Array of action identifiers
- `task_type TEXT` - Task classification (coi_upload, endorsement_correction, etc.)
- `origin_role TEXT` - Who created the task (manager, broker)
- `source_type TEXT` - How task was created (org_requirement, project_requirement, manual)
- `priority TEXT` - Task priority (low, medium, high, urgent)
- `due_date TIMESTAMP` - When task is due
- `due_date_source TEXT` - How due date was determined
- `policy_id UUID` - Reference to policy
- `policy_number TEXT` - Policy number
- `document_link TEXT` - Link to related document
- `created_by_user_id UUID` - User who created task

### Migration 2: Seed Sample Data
**File**: `packages/supabase/migrations/211_seed_tasks_with_quick_actions.sql`

Creates sample tasks with populated quick_actions:

1. **COI Upload Task**
   - quick_actions: `['upload_document', 'contact_broker', 'view_requirements']`
   - Shows all three action buttons

2. **Limit Inadequacy Task**
   - quick_actions: `['request_quote', 'contact_broker', 'view_requirements']`
   - Shows Request Quote button
   - Metadata includes current_limit, required_limit, gap_amount

3. **Endorsement Correction Task**
   - quick_actions: `['upload_document', 'contact_broker', 'view_requirements']`
   - Shows Upload Document button
   - Metadata includes missing_endorsement, required_endorsement_form

4. **Auto Symbol Compliance Task**
   - quick_actions: `['upload_document', 'contact_broker', 'view_requirements']`
   - Metadata includes current_symbol, required_symbol

5. **Submitted Task**
   - quick_actions: `[]` (empty - no actions needed)
   - Status: in_progress (submitted for review)

## Quick Actions Mapping

| Action Identifier | Button Text | Opens Modal | Requirements |
|------------------|-------------|-------------|--------------|
| `contact_broker` | "Broker" | Contact Broker Modal | `metadata.broker_contact` with name, email, phone |
| `upload_document` | "Upload" | Upload Document Modal | File input, task context |
| `request_quote` | "Request Quote" | Request Quote Modal | `metadata.current_limit`, `metadata.required_limit`, `metadata.gap_amount` |
| `view_requirements` | "Requirements" | Insurance Requirements Modal | Task details |

## Current Blocker: Supabase Storage Migration Issue

**Error**: `duplicate key value violates unique constraint "migrations_name_key"`

The Supabase storage service has a duplicate migration error preventing the database from starting. This is a known issue with Supabase storage migrations when volumes are reused.

### Workaround Options

#### Option 1: Manual SQL Execution (Recommended for Testing)

1. Stop Supabase completely:
   ```bash
   pnpm env-local pnpx supabase --workdir packages/supabase stop
   ```

2. Remove Docker volumes:
   ```bash
   docker volume rm supabase_db_construction-data supabase_storage_construction-data
   ```

3. Start PostgreSQL directly (without storage service):
   ```bash
   docker run -d --name supabase_db \
     -p 54322:5432 \
     -e POSTGRES_PASSWORD=postgres \
     supabase/postgres:15.8.1.20
   ```

4. Apply migrations manually:
   ```bash
   psql -h localhost -p 54322 -U postgres -d postgres -f packages/supabase/migrations/210_add_tasks_metadata.sql
   psql -h localhost -p 54322 -U postgres -d postgres -f packages/supabase/migrations/211_seed_tasks_with_quick_actions.sql
   ```

5. Test the dashboard UI

#### Option 2: Supabase Cloud (Production Testing)

1. Create a Supabase project on supabase.com
2. Run migrations through Supabase Studio
3. Update `.env` with cloud connection strings
4. Test the dashboard

#### Option 3: Fix Storage Migration Issue

1. Identify duplicate migration in storage service
2. Remove duplicate from migrations tracking table
3. Restart Supabase

## Testing Checklist

Once migrations are applied:

1. **Start the app**:
   ```bash
   pnpm dev:forsured
   ```

2. **Navigate to Subcontractor Dashboard**:
   - Login as a subcontractor user
   - Go to dashboard page

3. **Verify Quick Action Buttons Appear**:
   - Each task card should show action buttons at the bottom
   - COI Upload task: Should show "Upload", "Broker", "Requirements" buttons
   - Limit Inadequacy task: Should show "Request Quote", "Broker", "Requirements" buttons
   - Submitted task: Should show no action buttons

4. **Test Contact Broker Modal**:
   - Click "Broker" button on any task
   - Modal should open showing:
     - Broker name: "Jane Broker"
     - Email: jane@insuranceco.com (clickable mailto link)
     - Phone: 555-0123 (clickable tel link)
     - Task title and project name
   - Close button should work

5. **Test Upload Document Modal**:
   - Click "Upload" button on COI Upload task
   - Modal should open showing:
     - Task title and description
     - File upload dropzone
     - "Click to upload or drag and drop" message
     - Accept: PDF, DOC, DOCX, PNG, JPG
   - Select a file
   - File name should appear in green confirmation box
   - Click "Upload Document" button
   - Should show success alert
   - Modal should close

6. **Test Request Quote Modal**:
   - Click "Request Quote" button on Limit Inadequacy task
   - Modal should open showing:
     - Task title
     - Current Limit: $1.0M
     - Required Limit: $2.0M
     - Gap Amount: $1.0M
     - Text area for additional information
   - Enter a message
   - Click "Submit Request" button
   - Should show success alert
   - Modal should close

## Next Steps

1. **Resolve Supabase storage migration issue** - This is blocking normal development workflow
2. **Apply migrations** - Once Supabase is running, migrations will auto-apply
3. **Test all three modals** - Verify buttons appear and modals work correctly
4. **Add Playwright tests** - Automated tests for modal functionality (see SETUP-LOGIN-TESTS.md for patterns)

## Files Created/Modified

### Created:
- `packages/supabase/migrations/210_add_tasks_metadata.sql` - Schema changes
- `packages/supabase/migrations/211_seed_tasks_with_quick_actions.sql` - Sample data
- `docs/DASHBOARD_MODAL_BUTTONS_FIX.md` - This document

### No Changes Needed:
- `apps/forsured-web/src/components/Dashboard/EnhancedSubcontractorDashboard.tsx` - Already correct
- `apps/forsured-web/src/components/Subcontractor/SubcontractorTasksPanel.tsx` - Already correct
- `apps/forsured-web/src/types.ts` - Already has correct type definitions

## Summary

The UI components are already correctly implemented. The issue is purely a data/schema problem:

1. ✅ **Modal components** - All three modals exist and are properly wired
2. ✅ **Action handlers** - All handlers are correctly implemented
3. ✅ **Button rendering logic** - SubcontractorTasksPanel checks `quick_actions` array
4. ❌ **Database schema** - Missing `quick_actions` and `metadata` columns
5. ❌ **Sample data** - No tasks with `quick_actions` populated

Once the migrations are applied and Supabase is running, the buttons will appear and the modals will work correctly.
