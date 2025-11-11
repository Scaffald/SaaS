# Admin Route Exploration: /dashboard/profile/certifications

**Task ID:** f84f77ca-059e-4f1a-b740-36b777d4ce21  
**Route:** `/dashboard/profile/certifications`  
**User Type:** Admin (ewongagent@gmail.com)  
**Exploration Date:** 2025-11-02  
**Status:** Complete

## Overview

The certifications management interface is a **two-panel layout** that allows users to browse, select, and manage professional certifications with hierarchical organization (depth 0, depth 1, depth 2) and proof management capabilities.

## Page Structure

### Layout
- **Left Panel:** `ProfileCertificationsLeft` - Certification selection and hierarchy
- **Right Panel:** `ProfileCertificationsRight` - Selected certifications with proof management

## Left Panel: Certification Selection

### Components & Features

#### 1. Header
- **Heading:** "Certifications & Credentials" (H4)

#### 2. Search Interface
- **Component:** `CertificationSearch`
- **Purpose:** Search and select top-level (depth 0) certifications
- **Features:**
  - Search input with real-time results
  - Prevents duplicate selections
  - Loading states during search

#### 3. Selected Categories Display
- **Component:** Chip-based display (XStack with CertificationChip)
- **Visibility:** Only shown when `certTree.depth0.length > 0`
- **Features:**
  - Section title: "Selected Categories"
  - Removable chips for each selected top-level certification
  - Remove button with confirmation dialog
  - Cascading delete warning (if categories/certifications exist below)

#### 4. Hierarchical Certification Tree
- **Component:** ScrollView (height: 600px)
- **Structure:**
  - **Depth 0:** Top-level certification categories (displayed as section headers)
  - **Depth 1:** Sub-categories (displayed as ToggleCard components)
  - **Depth 2:** Specific certifications (displayed as checkboxes)

#### 5. Depth 1 Categories (ToggleCard)
- **Component:** `ToggleCard`
- **Features:**
  - Category title and description
  - Expandable/collapsible
  - **Auto-save on first expand** (saves to database)
  - Collapse only hides UI (doesn't delete from DB)
  - Shows depth 2 certifications when expanded

#### 6. Depth 2 Certifications (CertificationCheckbox)
- **Component:** `CertificationCheckbox`
- **Features:**
  - Checkbox to add/remove specific certification
  - **Proof indicator:**
    - Shows "has proof" badge if credential_url or certificate_file_path exists
  - **Add Proof button:** Only visible for checked certifications
  - Clicking triggers `onSelectCertificationForProof` callback
  - Disabled state during mutations

#### 7. Empty State
- **Component:** `ProfileEmptyState`
- **Icon:** Award icon
- **Message:** "Search and select certification categories above to get started."
- **Visibility:** When `certTree.depth0.length === 0`

### User Interactions - Left Panel

| Interaction | Component | Behavior | API Call |
|------------|-----------|----------|----------|
| Search certification | CertificationSearch | Queries top-level certs | `getTopLevelCertifications` |
| Select from search | Click result | Adds to depth 0 | `addTopLevelCertification` |
| Remove top-level chip | X button | Cascade delete confirmation | `removeTopLevelCertification` |
| Expand category | ToggleCard toggle | Auto-saves on first expand | `addCategoryCertification` |
| Collapse category | ToggleCard toggle | UI only (no delete) | None |
| Check certification | Checkbox | Adds to user profile | `toggleSpecificCertification` |
| Uncheck certification | Checkbox | Removes from profile | `toggleSpecificCertification` |

## Right Panel: Proof Management

### Components & Features

#### 1. Header
- **Heading:** "Your Certifications" (H4)

#### 2. Empty State
- **Visibility:** When no depth 2 certifications are checked
- **Icon:** Award icon (48px)
- **Text:** "Check certifications on the left to add them here"

#### 3. Certification Cards (depth 2 only)
- **Component:** ScrollView (height: 700px) with Card components
- **Features:**
  - Collapsible cards with chevron indicators
  - Header shows certification title
  - **Proof status indicator:** "✓ Proof added" (green) if proof exists
  - **Action buttons:**
    - **View:** Opens proof in new tab (if exists)
    - **Remove:** Deletes certification with confirmation

#### 4. Expanded Card Content
- **File Upload Section:**
  - Button to select file (triggers file input)
  - Accepted formats: `.pdf`, `.jpg`, `.jpeg`, `.png`
  - Shows selected file name in button
  - Upload button appears after file selection
  - Displays current file name if exists
  
- **URL Section:**
  - Input field for credential URL
  - Placeholder: "https://..."
  - Save button (disabled if empty)
  - Displays current URL if exists

### User Interactions - Right Panel

| Interaction | Component | Behavior | API Call |
|------------|-----------|----------|----------|
| Click card header | Card | Expand/collapse | None (UI state) |
| Select file | Upload button | Opens file picker | None |
| Upload file | Upload button | Converts to base64, saves | `updateCertificationProof` |
| Enter URL | Input field | Updates state | None |
| Save URL | Save button | Saves to database | `updateCertificationProof` |
| View proof | View button | Opens in new tab | None (uses storage URL) |
| Remove cert | Remove button | Confirmation + delete | `toggleSpecificCertification` |

## Data Model

### Certification (Catalog)
```typescript
{
  id: string
  slug: string
  title: string
  description: string | null
  depth: number (0, 1, or 2)
  sort_order: number
  parent_id: string | null
}
```

### UserCertification
```typescript
{
  id: string
  certification_id: string
  credential_url: string | null
  certificate_file_path: string | null
  catalog: Certification
}
```

### CertificationTree
```typescript
{
  depth0: UserCertification[]
  depth1ByParent: Record<string, UserCertification[]>
  depth2ByParent: Record<string, UserCertification[]>
}
```

## API Endpoints (tRPC)

### Queries
1. `profile.certifications.getUserCertificationTree`
   - Returns user's complete certification tree
   - Used by both panels

2. `profile.certifications.getTopLevelCertifications`
   - Params: `{ search: string }`
   - Returns depth 0 certifications for search
   - Enabled when `search.length > 0`

3. `profile.certifications.getCertificationChildren`
   - Params: `{ parent_id: string }`
   - Returns child certifications for a parent
   - Used for depth 1 and depth 2 loading

### Mutations
1. `profile.certifications.addTopLevelCertification`
   - Params: `{ certification_id: string }`
   - Adds a depth 0 certification

2. `profile.certifications.removeTopLevelCertification`
   - Params: `{ top_level_id: string, confirmed: boolean }`
   - Removes depth 0 with cascade handling
   - Returns `{ needsConfirmation, message }` if has children

3. `profile.certifications.addCategoryCertification`
   - Params: `{ category_id: string, parent_id: string }`
   - Adds a depth 1 category

4. `profile.certifications.toggleSpecificCertification`
   - Params: `{ certification_id: string, parent_id: string, checked: boolean }`
   - Adds/removes depth 2 certification

5. `profile.certifications.updateCertificationProof`
   - Params: File upload:
     ```typescript
     {
       user_certification_id: string
       proof_type: 'file'
       certificate_file: string (base64)
       file_name: string
       content_type: string
     }
     ```
   - Params: URL upload:
     ```typescript
     {
       user_certification_id: string
       proof_type: 'url'
       credential_url: string
     }
     ```

## UI States & Loading

### Loading States
1. **Initial tree load:**
   - Displays centered spinner
   - Text: "Loading certifications..."
   - Minimum height: 300px

2. **Search loading:**
   - `isLoadingSearch` prop passed to CertificationSearch
   - Component handles loading UI

3. **Mutation loading:**
   - Buttons disabled during mutations
   - Prevents double-clicks
   - Applied to: remove, upload, save operations

### Expanded States
- **Left panel:** Set<string> of expanded category IDs
  - Auto-expands categories with checked depth 2 certs
  - Persists during session
  
- **Right panel:** Set<string> of expanded card IDs
  - User-controlled expansion
  - Persists during session

### Form States
- **Selected files:** `Record<string, File | null>`
- **URL inputs:** `Record<string, string>`
- Both keyed by user certification ID

## Confirmation Dialogs

### 1. Remove Top-Level Certification
```
{result.message}

Are you sure you want to remove this certification and all related items?
```
- Triggered when top-level has children
- Two-step process: first check, then confirmed delete

### 2. Remove Depth 2 Certification (Right Panel)
```
Remove {cert.catalog.title}?
```
- Simple confirmation before deletion

## Auto-Behaviors

1. **Auto-expand categories:**
   - Categories with checked depth 2 certs auto-expand on load
   - useEffect watches `certTree.depth2ByParent`

2. **Auto-expand on first check:**
   - When checking first depth 2 cert, parent category expands
   - Improves UX by showing the newly checked item

3. **Progressive saving:**
   - Depth 1 categories save on first expand (not on selection)
   - Depth 2 certifications save immediately on check

## File Upload Details

### Process
1. User clicks "Choose File" button
2. File input created programmatically
3. Accepts: `.pdf`, `.jpg`, `.jpeg`, `.png`
4. File selected → button shows filename → "Upload" button appears
5. On upload:
   - Convert file to base64 using FileReader
   - Send to API with metadata
   - Clear selected file state on success

### Storage
- Files stored in Supabase Storage
- Path: `certifications/{user_id}/{filename}`
- Retrieved via `getStorageUrl('certifications', path)`

## Cross-Panel Communication

The panels communicate via:
1. **Shared query:** Both use `getUserCertificationTree`
2. **Refetch on mutations:** All mutations trigger tree refetch
3. **Optional callback:** `onSelectCertificationForProof` (not currently used)

## Responsive Design

- **Left panel ScrollView:** 600px height
- **Right panel ScrollView:** 700px height
- Cards use flex layout for responsive sizing
- Chips wrap on small screens (flexWrap="wrap")

## Accessibility Features

- **Icons with labels:** All icon buttons have text labels
- **Keyboard navigation:** Forms and inputs are keyboard accessible
- **ARIA attributes:** Buttons have aria-label where appropriate
- **Visual feedback:** Disabled states, hover states, pressed states

## Test Coverage Recommendations

### Critical Paths
1. ✅ **Search and add top-level certification**
2. ✅ **Expand category (first time - saves to DB)**
3. ✅ **Check/uncheck depth 2 certification**
4. ✅ **Upload certificate file**
5. ✅ **Add credential URL**
6. ✅ **View proof (file and URL)**
7. ✅ **Remove certification from right panel**
8. ✅ **Remove top-level with cascade confirmation**

### Edge Cases
1. **Empty states:** No certifications selected
2. **Loading states:** During search, mutations
3. **Error states:** Failed uploads, API errors
4. **Confirmation dialogs:** Cancel vs. confirm
5. **Duplicate prevention:** Can't add same cert twice
6. **File validation:** File type restrictions
7. **URL validation:** Valid URL format
8. **Concurrent operations:** Multiple mutations

### Integration Tests
1. **Full workflow:** Search → Select → Expand → Check → Add proof
2. **Cascade delete:** Remove top-level with children
3. **State synchronization:** Left panel changes reflect in right panel
4. **Auto-expand behavior:** Categories expand when children checked
5. **Proof management:** Switch between file and URL proof

## Known Issues / Bugs

**None identified during exploration** ✅

## Admin-Specific Features

The certifications interface appears to be **identical for both admin and regular users**. The admin user (ewongagent@gmail.com) sees the same UI and functionality as regular users. The interface is focused on personal certification management rather than administrative functions.

## Next Steps

1. ✅ Create comprehensive Playwright test suite
2. ✅ Test file upload with various formats
3. ✅ Test cascade delete confirmations
4. ✅ Test auto-expand behaviors
5. ✅ Test proof management workflows
6. ✅ Verify accessibility with screen readers
7. ✅ Test mobile responsive layouts

---

**Exploration Method:** Static code analysis of route components  
**Source Files:**
- `/packages/core/features/profile/profile-certifications-left.tsx`
- `/packages/core/features/profile/profile-certifications-right.tsx`
- UI components in `/packages/ui/src/components/certifications/`
