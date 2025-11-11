# Super Admin Route: `/office/applications` - ATS (Applicant Tracking System)

**Status**: In Development (76% complete)  
**Route Path**: `/office/applications`  
**Feature Area**: Applicant Tracking System (ATS)  
**Component**: OfficeApplicationsScreen

## Table of Contents

1. [Route Overview](#route-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [UI Components & Features](#ui-components--features)
4. [Data Flow & tRPC Endpoints](#data-flow--trpc-endpoints)
5. [Application Pipeline & Stages](#application-pipeline--stages)
6. [Data Model](#data-model)
7. [User Interactions & Workflows](#user-interactions--workflows)
8. [Integration Points](#integration-points)
9. [Test Scenarios](#test-scenarios)

---

## Route Overview

### Purpose
The `/office/applications` route is a **super-admin-only** interface for managing job applications across all organizations. It provides a Kanban-style interface for tracking candidates through the hiring pipeline, with detailed views of candidate profiles, application materials, notes, and messaging.

### Scope
- View all applications across all jobs and organizations
- Manage application status through drag-and-drop interface
- Review candidate profiles, qualifications, and screening answers
- Add internal notes and ratings to applications
- Send messages to candidates
- View application timeline and stage history
- Calculate and display application scoring

### Current State
- Kanban board view (primary interface) - **working**
- List view - **planned, not yet implemented**
- Candidate detail modal with tabbed interface - **working**
- Status change confirmation - **working**
- Notes and messaging - **UI complete, backend integration pending**

---

## Authentication & Authorization

### Role Requirements
- **Required Role**: `super_admin`  
- **Verification**: Via `officeProcedure` middleware in tRPC endpoints

### Authorization Flow
```
Request → officeProcedure middleware
  ↓
Check user has super_admin role
  ↓
Allow access to admin data
  ↓
Bypass Row-Level Security (RLS)
```

### Permission Checks
All tRPC endpoints used by this route are protected with `officeProcedure`:
- `applications.getUserApplications` - Fetches applications with filtering
- Implicit: User must be authenticated and have admin privileges

### Data Access
- **Super Admin Privileges**: Can view/modify ANY application regardless of organization
- **Uses Admin Client**: `ctx.supabaseAdmin` to bypass RLS policies
- **Cross-Organization**: Applications fetched from all organizations

---

## UI Components & Features

### Component Hierarchy

```
OfficeApplicationsScreen (Main Container)
├── Header Section
│   ├── Title + Application Count
│   ├── View Mode Toggle (Kanban/List buttons)
│   └── Spinner (loading state)
├── ApplicationsFilters (Filter Bar)
│   ├── Job Filter (Select dropdown)
│   ├── Status Filter (Select dropdown)
│   └── Clear Filters Button
├── ApplicationsKanbanBoard (Main Content)
│   ├── DndContext (Drag-and-drop provider)
│   ├── ScrollView (Horizontal scrolling)
│   └── StatusColumn (x6 - one per status)
│       ├── Column Header (Status label + count)
│       ├── StatusColumn List
│       └── ApplicationCard (draggable cards)
│           ├── Avatar (candidate photo)
│           ├── Candidate Name + Title
│           ├── Application Score (with color-coding)
│           └── Applied Date + Job Title
├── CandidateDetailModal (Full-screen detail view)
│   ├── Candidate Header (photo, title, location)
│   ├── Application Score Badge (large, highlighted)
│   ├── Quick Action Buttons (Advance to Interview, Reject, Send Message)
│   ├── Application Metadata (Applied date, Job, Experience)
│   └── Tabs Interface
│       ├── Profile Tab → CandidateProfileTab
│       ├── Application Tab → ApplicationDetailsTab
│       ├── Notes Tab → NotesTab
│       └── Messages Tab → MessagesTab
├── ApplicationStatusChangeModal (Confirmation dialog)
│   ├── Confirmation Message
│   ├── Reason/Notes Input (required for rejections)
│   └── Action Buttons (Cancel, Confirm)
└── Error State (if data fetch fails)
```

### Detailed Component Descriptions

#### OfficeApplicationsScreen
**File**: `office-applications-screen.tsx`

**Purpose**: Root container component that orchestrates the entire applications interface.

**Key Features**:
- Manages application state fetching via `useApplications()` hook
- Transforms raw database records to UI-compatible `MockApplication` format
- Handles view mode toggle between Kanban and List views
- Manages filter state (jobId, status, minScore)
- Displays loading/error states
- Client-side score filtering

**State Management**:
```typescript
const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
const [filters, setFilters] = useState<{
  jobId: string | null
  status: ApplicationStatus | null
  minScore: number
}>
```

**Data Transformation**:
Maps database application status values to UI status values:
- `pending` → `new`
- `reviewing` → `screen`
- `interview` → `interview`
- `offer` → `offer`
- `hired` → `hired`
- `rejected` or `withdrawn` → `rejected`

#### ApplicationsKanbanBoard
**File**: `ApplicationsKanbanBoard.tsx`

**Purpose**: Implements drag-and-drop Kanban board for visual status management.

**Key Features**:
- 6 columns representing application statuses: `new`, `screen`, `interview`, `offer`, `hired`, `rejected`
- Horizontal scroll for desktop, natural scroll for mobile
- Drag-and-drop enabled with `@dnd-kit` library
- Color-coded status columns (blue, yellow, red, green)
- Real-time application count per column
- Drag overlay to show card being dragged
- Modal integration for candidate details

**Drag-and-Drop Configuration**:
```typescript
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // 8px movement required
    },
  })
)
```

**Status Definitions**:
```typescript
const STATUSES: ApplicationStatus[] = ['new', 'screen', 'interview', 'offer', 'hired', 'rejected']

const STATUS_LABELS = {
  new: 'New Applications',
  screen: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
}

const STATUS_COLORS = {
  new: '$blue9',
  screen: '$yellow9',
  interview: '$red9',
  offer: '$green9',
  hired: '$green11',
  rejected: '$red9',
}
```

**Interactions**:
- Click card → Opens CandidateDetailModal
- Drag card → Validates transition, may open confirmation modal
- Column displays "No applications" message when empty

#### ApplicationCard
**File**: `ApplicationsKanbanBoard.tsx` (sub-component)

**Purpose**: Individual application card in the Kanban board.

**Data Displayed**:
- Candidate avatar with fallback initial
- Candidate name
- Job title (abbreviated)
- Application score with color-coding:
  - Green (≥80): High score
  - Blue (60-79): Medium score
  - Red (<60): Low score
- Applied date in "Mon DD" format

**Styling**:
- Hover effect: background color change
- Press effect: subtle scale animation
- Dragging state: visual indicator in DragOverlay

#### ApplicationsFilters
**File**: `ApplicationsFilters.tsx`

**Purpose**: Filter controls for narrowing down applications.

**Filter Options**:
1. **Job Filter** - Dropdown to filter by job
   - "All Jobs" (default)
   - Lists all available jobs (currently empty - needs API integration)
   - Filter parameter: `jobId`

2. **Status Filter** - Dropdown to filter by application status
   - "All Statuses" (default)
   - Options: new, screen, interview, offer, hired, rejected
   - Filter parameter: `status`

3. **Score Filter** - Currently implemented as client-side only
   - Filter parameter: `minScore` (minimum application score)
   - Note: Not exposed in UI, could be added

4. **Clear Filters** - Button appears when any filter is active
   - Resets all filters to default

**Note**: Job list currently empty (`jobs={[]}` passed from parent) - requires API integration.

#### CandidateDetailModal
**File**: `CandidateDetailModal.tsx`

**Purpose**: Full-screen modal showing comprehensive candidate and application information.

**Header Section**:
- Candidate avatar (large, circular)
- Candidate title
- Candidate location
- Application score badge (very large, highlighted)

**Quick Actions**:
- "Advance to Interview" button (green theme)
- "Reject" button (red theme)
- "Send Message" button (blue)
- Actions trigger status changes with confirmation

**Metadata Section**:
- Applied date (full date format)
- Job title
- Years of experience

**Tabs Interface**:

1. **Profile Tab** (CandidateProfileTab)
   - Contact Information
     - Email
     - Phone
     - Location
   - Skills (with proficiency levels)
     - Displays skills as cards with proficiency badges
     - Proficiency colors: expert (green), advanced (blue), intermediate (yellow), beginner (gray)
   - Certifications
     - Name, state, issue date
   - Work Experience
     - Job title, company, duration, description
     - Reverse chronological order

2. **Application Tab** (ApplicationDetailsTab)
   - Screening Answers
     - Current location
     - Willing to relocate (Yes/No)
     - Years of experience
     - Authorized to work (Yes/No)
     - Earliest start date
   - Custom Questions (if any)
     - Question text
     - Candidate answer
   - Attachments
     - Resume (with filename, size, download button)
     - Cover Letter (with filename, size, download button)
     - Portfolio (with filename, size, download button)
   - Application Timeline
     - Stage history with timestamps
     - Shows who changed the status and when
     - Displays reason for status change

3. **Notes Tab** (NotesTab)
   - Add Note Section
     - Star rating (1-5 stars) - interactive
     - Note textarea
     - Submit button (disabled if no text)
   - Existing Notes List
     - Author name
     - Date/time in long format
     - Star rating display
     - Note content
     - "No notes yet" message if empty

4. **Messages Tab** (MessagesTab)
   - Message Thread
     - Messages from recruiter (blue background, right-aligned)
     - Messages from candidate (default background, left-aligned)
     - Sender name + timestamp
     - "Unread" indicator for unread messages from candidate
     - "No messages yet" message if empty
   - Send Message Section
     - Message textarea
     - Send button
     - Icon: Send icon from lucide-icons

#### ApplicationStatusChangeModal
**File**: `ApplicationStatusChangeModal.tsx`

**Purpose**: Confirmation dialog for critical status changes (rejection and hire).

**Triggered For**:
- Moving application to "rejected" status
- Moving application to "hired" status

**Dialog Content**:
- Title: "Reject Application" or "Mark as Hired?"
- Confirmation message with candidate name and status change details
- Reason/Notes textarea
  - Label: "Reason for rejection" (required) or "Notes (optional)"
  - Red asterisk indicator for required field
  - Placeholder text differs by transition type
  - Height: 120px (4 lines)

**Validation**:
- For rejections: Reason is REQUIRED
- Confirmation button disabled if:
  - Request is loading
  - Rejection without reason
- "Confirm" button color changes based on transition:
  - Red for rejections
  - Green for hires

**Error Handling**:
- Displays validation message: "Rejection reason is required"
- Cancel button allows discarding change
- Modal closes on cancel

---

## Data Flow & tRPC Endpoints

### Application Fetch Flow

```
OfficeApplicationsScreen component
  ↓
useApplications() hook
  ↓
api.applications.getUserApplications tRPC query
  ↓
Backend (applications.router.ts)
  ├─ Verify user is authenticated
  ├─ Query private.applications table
  │  └─ Filter by status (optional)
  │  └─ Order by created_at DESC
  │  └─ Apply limit/offset pagination
  ├─ Fetch related jobs data from public.jobs
  ├─ Fetch user profile data
  ├─ Combine results
  └─ Return to frontend
  ↓
Transform to MockApplication format
  ↓
Client-side filter by minScore
  ↓
Group by status (Kanban board)
```

### tRPC Endpoints

#### 1. **GET /applications/getUserApplications**
**File**: `packages/supabase/functions/trpc/routers/applications.router.ts`

**Purpose**: Fetch paginated list of user's applications with filters

**Input Schema**:
```typescript
{
  status?: "pending" | "reviewing" | "interview" | "offer" | "hired" | "rejected" | "withdrawn"
  limit?: number (default: 20, max: 100)
  offset?: number (default: 0)
}
```

**Output Schema**:
```typescript
Array<{
  id: string (UUID)
  job_id: string (UUID)
  user_id: string (UUID)
  status: string
  resume_url: string | null
  cover_letter_url: string | null
  answers: object | null
  is_shortlisted: boolean
  archived_at: timestamp | null
  rejected_at: timestamp | null
  reject_reasons: string[]
  reject_meta: object
  stage_changed_at: timestamp
  created_at: timestamp
  // Plus additional fields from relationships:
  candidate_name: string
  candidate_id: string
  profile_about: string
  profile_avatar_path: string
  current_location: string
  willing_to_relocate: boolean
  years_experience: number
  is_authorized_to_work: boolean
  earliest_start_date: string
  custom_question_answers: Array<{ question: string, answer: string }>
  attachments: object
  application_score: number
  auto_rejected: boolean
  job_title: string
  job_location: string
  user: { id, slug, username, about, avatar_path }
  job: { id, slug, title, employment_type, remote_option, location, status, organization_id }
}>
```

**Database Query**:
- Source: `private.applications` (via v_applications_with_user_profiles view - recommended)
- Joins: jobs, users (public profiles)
- Filters: user_id (current user), optional status
- Ordering: created_at DESC
- Pagination: limit/offset

**Authorization**: 
- User must be authenticated
- Currently restricted to user's own applications only
- **TODO**: Need to verify super_admin access for office route

#### 2. **POST /applications/update**
**File**: `packages/supabase/functions/trpc/routers/applications.router.ts`

**Purpose**: Update application status and other fields

**Input Schema**:
```typescript
{
  application_id: string (UUID) - REQUIRED
  status?: "pending" | "reviewing" | "interview" | "offer" | "hired" | "rejected" | "withdrawn"
  current_location?: string
  willing_to_relocate?: boolean
  years_experience?: number
  is_authorized_to_work?: boolean
  earliest_start_date?: string
  custom_question_answers?: Array<{ question: string, answer: string }>
  attachments?: object
}
```

**Output Schema**:
```typescript
{
  id: string
  // All fields from applications table
}
```

**Business Logic**:
- Verifies ownership (user owns the application) - **ISSUE**: Blocks super_admin access
- Updates specified fields
- Sets updated_at timestamp
- Returns updated record

**Authorization Issue**:
- Current code checks `application.user_id !== user.id`
- Prevents super_admin from updating applications
- **BLOCKER**: Need to modify to allow officeProcedure

#### 3. **Planned: Additional Endpoints Needed**

**For status change with reason**:
- Current `update` endpoint doesn't include reason field
- Need to either:
  - Add reason/notes field to applications table
  - Create separate endpoint for status changes
  - Create notes in separate table with status change context

**For notes creation**:
- Need endpoint to create application notes
- Schema: application_id, author_id, content, rating

**For messaging**:
- Need endpoint to send messages
- Schema: application_id, author_id, body

---

## Application Pipeline & Stages

### Status Values

Database stores applications with these status values:
```
new → screen → interview → offer → hired
      ↓         ↓            ↓
   rejected   rejected    rejected

AND

→ withdrawn (terminal state)
```

### Stage Definitions

| Stage | UI Label | Color | Meaning | Actions Available |
|-------|----------|-------|---------|------------------|
| `new` | New Applications | Blue | Just applied, not reviewed yet | Move to screen, Reject |
| `screen` | Screening | Yellow | Passed initial review, ready for screening call | Move to interview, Reject |
| `interview` | Interview | Red | Phone screen done, scheduling in-person | Move to offer, Reject |
| `offer` | Offer | Green | Interview complete, offer extended | Move to hire, Reject |
| `hired` | Hired | Green (darker) | Accepted offer, hired | Terminal (no further actions) |
| `rejected` | Rejected | Red | Application rejected | Terminal (no further actions) |

### Valid Transitions

```
new → [screen, rejected]
screen → [interview, rejected]
interview → [offer, rejected]
offer → [hired, rejected]
hired → [terminal]
rejected → [terminal]
withdrawn → [terminal]
```

**Validation Logic**: Implemented in `useApplicationStatusChange.ts` hook:
```typescript
const validTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  new: ["screen", "rejected"],
  screen: ["interview", "rejected"],
  interview: ["offer", "rejected"],
  offer: ["hired", "rejected"],
  hired: [],
  rejected: [],
}
```

**Invalid Transitions**: Any transition not in the valid list will error:
- e.g., `new` → `offer` (skipping steps) - invalid
- e.g., `hired` → `rejected` (reversing) - invalid
- e.g., `rejected` → `screen` (from terminal state) - invalid

### Stage History Tracking

Each application maintains a stage history:
```typescript
stageHistory: Array<{
  fromStage: ApplicationStatus | null  // null for initial state
  toStage: ApplicationStatus
  changedBy: string (username/display_name)
  changedAt: timestamp
  reason?: string  // Optional context for transition
}>
```

**Initial Entry**:
- Created automatically when application submitted
- fromStage: null, toStage: "new"
- changedBy: "System"

**Subsequent Entries**:
- Added each time status changes
- Records who made the change and timestamp
- Reason field stores context (rejection reason, hire notes, etc.)

---

## Data Model

### MockApplication Interface

```typescript
interface MockApplication {
  id: string (UUID)
  
  // Candidate Info
  candidate: {
    id: string (UUID)
    name: string
    email: string
    phone: string
    location: string
    photo: string (URL)
    title: string (job title)
    yearsExperience: number
    skills: Array<{
      name: string
      proficiency: "beginner" | "intermediate" | "advanced" | "expert"
    }>
    certifications: Array<{
      name: string
      state?: string
      issueDate?: string (ISO date)
    }>
    experience: Array<{
      title: string
      company: string
      duration: string
      description: string
    }>
  }
  
  // Job Info
  job: {
    id: string (UUID)
    title: string
    company: string
    location: string
    payRange: string
  }
  
  // Application Status
  status: ApplicationStatus ("new" | "screen" | "interview" | "offer" | "hired" | "rejected")
  appliedAt: string (ISO timestamp)
  updatedAt: string (ISO timestamp)
  
  // Scoring & Auto-Rejection
  score: number (0-100)
  autoRejected: boolean
  
  // Screening Answers
  screeningAnswers: {
    currentLocation: string
    willingToRelocate: boolean
    yearsExperience: number
    isAuthorizedToWork: boolean
    earliestStartDate: string
  }
  
  // Custom Questions
  customAnswers: Array<{
    question: string
    answer: string
  }>
  
  // File Attachments
  attachments: {
    resume?: {
      filename: string
      size: number (bytes)
      uploadedAt: string (ISO timestamp)
    }
    coverLetter?: {
      filename: string
      size: number
      uploadedAt: string
    }
    portfolio?: {
      filename: string
      size: number
      uploadedAt: string
    }
  }
  
  // Collaboration
  notes: Array<{
    id: string (UUID)
    author: string (name)
    authorId: string (UUID)
    content: string
    rating: number (1-5)
    createdAt: string (ISO timestamp)
  }>
  
  messages: Array<{
    id: string (UUID)
    sender: "recruiter" | "candidate"
    senderName: string
    content: string
    sentAt: string (ISO timestamp)
    isRead: boolean
  }>
  
  // History
  stageHistory: Array<{
    fromStage: ApplicationStatus | null
    toStage: ApplicationStatus
    changedBy: string (name)
    changedAt: string (ISO timestamp)
    reason?: string
  }>
}
```

### Database Application Table

**Schema Location**: `private.applications` (in `001_schema.sql`)

```sql
CREATE TABLE private.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,           -- FK to jobs(id)
  user_id UUID NOT NULL,          -- FK to users(id) - candidate
  status TEXT NOT NULL DEFAULT 'new' 
    CHECK (status IN ('new', 'screen', 'interview', 'offer', 'hired', 'rejected', 'withdrawn')),
  resume_url TEXT,                -- URL to stored resume
  cover_letter_url TEXT,          -- URL to stored cover letter
  answers JSONB,                  -- Screening answers + custom answers
  is_shortlisted BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,        -- When archived (soft delete)
  rejected_at TIMESTAMPTZ,        -- When rejected
  reject_reasons TEXT[],          -- Array of rejection reason strings
  reject_meta JSONB,              -- Additional rejection context
  stage_changed_at TIMESTAMPTZ,   -- When status last changed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, user_id)        -- One application per user per job
);
```

**Note**: The current schema is simplified. The data model shown above is the **target schema** for full ATS functionality.

### Screen-Specific Data Structures

**FilterState**:
```typescript
{
  jobId: string | null           // UUID of selected job, or null for all
  status: ApplicationStatus | null // Selected status, or null for all
  minScore: number               // Minimum application score (0-100)
}
```

**ViewMode**:
```typescript
type ViewMode = 'kanban' | 'list'
// Only 'kanban' is currently implemented
// 'list' view is marked as "coming soon"
```

**ModalState (CandidateDetail)**:
```typescript
{
  selectedApplication: MockApplication | null
  open: boolean
  activeTab: 'profile' | 'application' | 'notes' | 'messages'
}
```

**StatusChangeState**:
```typescript
{
  isChanging: boolean                    // API request in flight
  error: Error | null                    // Last error
  pendingChange: {                       // Waiting for user confirmation
    applicationId: string
    fromStatus: ApplicationStatus
    toStatus: ApplicationStatus
    reason?: string
  } | null
}
```

---

## User Interactions & Workflows

### Workflow 1: View All Applications (Kanban Board)

**Flow**:
1. Navigate to `/office/applications`
2. Page loads and calls `getUserApplications` query
3. Loading spinner displays while fetching
4. Kanban board renders with 6 columns (one per status)
5. Applications appear as draggable cards in respective columns
6. Counts displayed at top of each column

**Success Criteria**:
- All applications visible
- Correct status grouping
- Cards are clickable and draggable
- Column counts accurate

### Workflow 2: Filter Applications

**Flow**:
1. User selects filter criteria (Job or Status)
2. Filter change triggers state update
3. Applications list re-filtered (client-side for score, server-side for status)
4. Kanban board updates to show filtered results
5. Clear Filters button appears if any filter active
6. Clicking Clear Filters resets to default state

**Available Filters**:
- Job: None available currently (empty list)
- Status: new, screen, interview, offer, hired, rejected
- Score: minScore parameter (hidden, not in UI)

### Workflow 3: View Candidate Details

**Flow**:
1. User clicks on application card
2. CandidateDetailModal opens with candidate details
3. Tabs display different information:
   - Profile: Skills, certifications, experience
   - Application: Screening answers, custom questions, attachments, timeline
   - Notes: Existing notes, add new note form
   - Messages: Message thread, send message form
4. User reviews information
5. User clicks X/outside modal to close

**Tab Interactions**:
- Click tab label to switch
- Profile tab is default
- Tab shows count badges (e.g., "Notes (3)")

### Workflow 4: Change Application Status via Drag-and-Drop

**Flow**:
1. User clicks and holds on application card (8px activation distance)
2. Card becomes draggable, drag overlay shows card
3. User drags card to different column
4. Over target column, drop zone highlighted
5. User releases mouse
6. **For non-critical moves** (e.g., new→screen):
   - Status updated immediately
   - Modal may show brief confirmation
7. **For critical moves** (rejection or hire):
   - Modal appears: ApplicationStatusChangeModal
   - User enters required reason
   - User clicks Confirm or Cancel
   - If Confirm: Status updated, modal closes, board refreshes

**Validation**:
- Invalid transitions blocked
- Error message displays if attempted
- Example: Trying to move from "hired" to "rejected" shows error

### Workflow 5: Quick Actions - Advance to Interview

**Flow**:
1. User has candidate detail modal open
2. User clicks "Advance to Interview" button (green)
3. If current status allows→interview transition:
   - Status changed immediately (non-critical)
   - Modal stays open
   - Application moves to interview column
4. If invalid transition:
   - Error message displays
   - Status unchanged

### Workflow 6: Quick Actions - Reject Application

**Flow**:
1. User has candidate detail modal open
2. User clicks "Reject" button (red)
3. ApplicationStatusChangeModal appears
4. Modal shows "Reject Application?" with candidate name
5. User enters rejection reason (REQUIRED)
6. Validation prevents submit if reason empty
7. User clicks "Reject Application" button
8. Request sent to backend
9. If success: Modal closes, application moves to rejected column
10. If error: Error message displays, reason preserved

**Validation**:
- Reason text is required for rejection
- Confirm button disabled if empty
- Error message: "Rejection reason is required"
- Status: Button shows "Processing..." while loading

### Workflow 7: Send Message to Candidate

**Flow**:
1. User has candidate detail modal open
2. User clicks "Send Message" button
3. Modal switches to Messages tab (or opens if not already)
4. User types message in textarea
5. User clicks "Send Message" button with Send icon
6. Message sent to candidate (backend integration pending)
7. Message appears in thread as "recruiter" message
8. Unread indicator cleared

**Note**: Currently UI is complete but backend integration is pending.

### Workflow 8: Add Note to Application

**Flow**:
1. User has candidate detail modal open
2. User clicks Notes tab
3. User optionally selects star rating (1-5 stars)
4. User types note in textarea
5. User clicks "Add Note" button
6. Note submitted (backend integration pending)
7. Note appears in existing notes list with:
   - Author name
   - Timestamp
   - Star rating
   - Note content
8. Input fields reset

**Note**: Currently UI is complete but backend integration is pending.

### Workflow 9: View Application Timeline

**Flow**:
1. User has candidate detail modal open
2. User clicks Application tab
3. User scrolls to "Application Timeline" section
4. Timeline shows chronological history:
   - Initial application (from System)
   - Each status change with timestamp and changer
   - Optional reason for each change
5. Displayed in reverse chronological order (newest first)

### Workflow 10: Download Attachments

**Flow**:
1. User has candidate detail modal open
2. User clicks Application tab
3. User scrolls to "Attachments" section
4. User sees resume, cover letter, portfolio (if available)
5. Each shows filename and size
6. User clicks Download button on attachment
7. Signed URL generated
8. File downloaded (backend storage: Supabase Storage)

**Note**: Download functionality is UI stub - needs backend integration.

---

## Integration Points

### 1. Jobs Integration

**Current State**: Filter component prepared but non-functional
```typescript
<ApplicationsFilters filters={filters} onFiltersChange={setFilters} jobs={[]} />
// jobs parameter is empty array
```

**Needed**:
- Query `office.listJobs` or applications for unique job IDs
- Pass job list to filters component
- Implement client-side or server-side filtering

**Data Needed**:
```typescript
jobs: Array<{
  id: string (UUID)
  title: string
  company: string
}>
```

### 2. Candidate Profile Integration

**Current State**: Candidate data comes from application record
- Profile data flattened in application query result
- Some fields missing (email, phone) - marked as empty strings
- Skills, certifications, experience not populated

**Data Sources**:
- `public.users` - profile data
- `private.profile` - PII data
- `user_skills` - skills relationship
- `user_certifications` - certifications relationship
- `work_experience` - experience relationship

**Enhancement Needed**:
- Modify `getUserApplications` query to include full candidate data
- Join with user profile, skills, certifications, experience
- Transform to MockApplication format

### 3. Application Scoring

**Current State**:
- Score displayed on cards and in modal
- Comes from `application_score` field in query result
- Calculated by database trigger (mentioned but not shown)

**Score Calculation**:
- Database function: `calculate_application_score`
- Can be triggered manually via `applications.calculateScore` endpoint
- Based on:
  - Matching required skills
  - Screening answer quality
  - Custom question answers
  - Auto-rejection rules

**Testing Hook**:
```typescript
const { calculateScore, isLoading } = useCalculateScore()
// Call: calculateScore({ id: applicationId })
```

### 4. Notes & Messaging

**Current State**:
- UI components complete (NotesTab, MessagesTab)
- Backend endpoints not yet created
- Mock data included in MockApplication

**Needed Endpoints**:
```
POST /applications/addNote
{
  application_id: string
  content: string
  rating: number (1-5)
}

POST /applications/sendMessage
{
  application_id: string
  content: string
}

GET /applications/{id}/notes
GET /applications/{id}/messages
```

**Database Tables**:
- `application_notes` (to be created)
- `application_messages` (already exists in private schema)

### 5. Organization & Team Context

**Current State**:
- Super admin can see all applications
- No organization/team filtering

**Potential Enhancements**:
- Filter by organization
- Filter by team
- Filter by hiring manager
- Show organization context in UI

### 6. RLS Policy Updates Required

**Current Issue**: 
- `applications.update` endpoint checks `user_id !== user.id`
- Blocks super_admin from updating applications
- Uses `supabase` client which respects RLS

**Fix Options**:
1. Create separate `adminUpdateApplication` endpoint using `supabaseAdmin`
2. Modify existing endpoint to check for officeProcedure
3. Create database function with SECURITY DEFINER to bypass RLS

### 7. File Storage Integration

**Current State**:
- `getUploadUrl` endpoint exists for resumption
- `confirmUpload` endpoint exists
- Attachments stored in Supabase Storage bucket: `application-attachments`

**Path Structure**:
```
{user_id}/{job_id}/{application_id}/{attachment_type}/{filename}
```

**Attachment Types**:
- resume
- cover_letter
- portfolio
- assessment
- video_interview

**Signed URLs**:
- Valid for 5 minutes
- Generated on demand
- Token-based access control

---

## Test Scenarios

### Authentication & Authorization Tests

#### Test 1: Super Admin Only Access
- **Setup**: Regular user tries to access `/office/applications`
- **Expected**: Access denied, redirect to login or 403
- **Verify**: officeProcedure blocks non-admin users

#### Test 2: Super Admin Access Granted
- **Setup**: Super admin user navigates to `/office/applications`
- **Expected**: Route loads successfully
- **Verify**: Can see all applications across all organizations

#### Test 3: Cross-Organization Visibility
- **Setup**: Applications exist for multiple organizations
- **Expected**: Super admin can see applications from all orgs
- **Verify**: No organization filter limiting visibility

### Data Loading Tests

#### Test 4: Load Applications Successfully
- **Setup**: 5+ applications exist in database
- **Expected**: All applications load and display
- **Verify**: Loading spinner shows, then applications render

#### Test 5: Empty Applications State
- **Setup**: No applications in database
- **Expected**: "No applications" message or empty columns
- **Verify**: Each column shows "No applications" card

#### Test 6: Pagination/Limit Handling
- **Setup**: 50+ applications exist
- **Expected**: Only first 20 loaded (default limit)
- **Verify**: Verify limit parameter in query

#### Test 7: Error Handling
- **Setup**: Database connection fails or API error
- **Expected**: Error message displays with retry option
- **Verify**: Error state rendered instead of blank screen

### Filtering Tests

#### Test 8: Filter by Status
- **Setup**: Applications in multiple statuses
- **Action**: Select status filter "interview"
- **Expected**: Only interview applications shown
- **Verify**: Other columns become empty

#### Test 9: Filter by Job (After Integration)
- **Setup**: Applications for 3 different jobs
- **Action**: Select job filter
- **Expected**: Only applications for that job shown
- **Verify**: Column counts reduce appropriately

#### Test 10: Clear Filters
- **Setup**: Multiple filters active
- **Action**: Click "Clear Filters"
- **Expected**: All applications visible again
- **Verify**: Filter state reset, all columns populate

#### Test 11: Min Score Filter
- **Setup**: Applications with scores 45, 62, 78, 85, 92
- **Action**: Set minScore to 70 (client-side via code)
- **Expected**: Only 78, 85, 92 visible
- **Verify**: Lower scores filtered out

### Kanban Board Tests

#### Test 12: Correct Status Grouping
- **Setup**: Applications with mixed statuses
- **Expected**: Applications in correct columns
- **Verify**: Each app in same status column as database shows

#### Test 13: Column Counts Accurate
- **Setup**: 2 new, 3 screening, 1 interview, 0 offer, 0 hired, 1 rejected
- **Expected**: Column headers show: new(2), screen(3), interview(1), etc.
- **Verify**: Counts match actual cards

#### Test 14: Drag and Drop Activation
- **Setup**: Application card visible
- **Action**: Hover over card, move mouse <8px
- **Expected**: Card should not be draggable yet
- **Action**: Move mouse >8px
- **Expected**: Card becomes draggable (cursor change)
- **Verify**: Activation constraint working

#### Test 15: Drag Valid Transition (new→screen)
- **Setup**: Application in "new" column
- **Action**: Drag to "screen" column
- **Expected**: Application moves to screen column
- **Verify**: Status updated in database

#### Test 16: Drag Invalid Transition (new→offer)
- **Setup**: Application in "new" column
- **Action**: Attempt to drag to "offer" column (skip screening/interview)
- **Expected**: Drag prevented or error shown after drop
- **Verify**: Invalid transition blocked

#### Test 17: Drag Terminal State (hired)
- **Setup**: Application in "hired" column
- **Action**: Attempt to drag to any other column
- **Expected**: Drag prevented, terminal state
- **Verify**: No transitions possible from hired

#### Test 18: Horizontal Scroll on Desktop
- **Setup**: Desktop view with 6 columns visible
- **Expected**: Able to scroll horizontally
- **Verify**: ScrollView horizontal scroll working

### Candidate Detail Modal Tests

#### Test 19: Modal Opens on Card Click
- **Setup**: Application card visible
- **Action**: Click on card
- **Expected**: CandidateDetailModal opens
- **Verify**: Modal shows candidate details

#### Test 20: Modal Closes on X Button
- **Setup**: Modal open
- **Action**: Click X button
- **Expected**: Modal closes
- **Verify**: Back to Kanban view

#### Test 21: Modal Closes on Outside Click
- **Setup**: Modal open
- **Action**: Click outside modal area
- **Expected**: Modal closes
- **Verify**: Overlay dismissed

#### Test 22: Score Badge Display
- **Setup**: Modal open with application score=87
- **Expected**: Large score badge shows "87"
- **Expected**: Color is green (≥80)
- **Verify**: Correct color coding

#### Test 23: Score Color Coding
- **Test Cases**:
  - Score 95: Green (≥80)
  - Score 72: Blue (60-79)
  - Score 45: Red (<60)
- **Verify**: Color matches threshold

#### Test 24: Tab Navigation
- **Setup**: Modal open on Profile tab
- **Action**: Click each tab (Profile, Application, Notes, Messages)
- **Expected**: Content switches for each tab
- **Verify**: All tabs render content

#### Test 25: Profile Tab Content
- **Expected Content**:
  - Contact info (Email, Phone, Location)
  - Skills with proficiency badges
  - Certifications with dates
  - Work experience in reverse chronological order
- **Verify**: All sections present and populated

#### Test 26: Application Tab Content
- **Expected Content**:
  - Screening Questions (5 fields)
  - Custom Questions (if any)
  - Attachments (Resume, Cover Letter, Portfolio)
  - Application Timeline
- **Verify**: All sections present

#### Test 27: Notes Tab Functionality
- **Setup**: Modal on Notes tab
- **Action**: Enter 3-star rating and note text
- **Action**: Click "Add Note"
- **Expected**: Note appears in list below
- **Expected**: Form clears
- **Verify**: Note with rating visible

#### Test 28: Notes Count Badge
- **Setup**: Application with 3 existing notes
- **Expected**: Tab shows "Notes (3)"
- **Verify**: Count accurate

#### Test 29: Messages Tab Functionality
- **Setup**: Modal on Messages tab
- **Action**: Type message and click Send
- **Expected**: Message appears in thread
- **Expected**: Marked as "recruiter" message
- **Verify**: Message sent to backend

#### Test 30: Unread Message Indicator
- **Setup**: Message from candidate marked unread
- **Expected**: "Unread" label visible
- **Verify**: Visual indicator present

### Status Change Tests

#### Test 31: Non-Critical Status Change (new→screen)
- **Setup**: Application in "new" status
- **Action**: Drag to "screen" or use quick action
- **Expected**: Change happens immediately
- **Expected**: No confirmation modal
- **Expected**: Application moves to new column
- **Verify**: Status updated without interruption

#### Test 32: Critical Change Modal - Rejection
- **Setup**: Application in any status except terminal
- **Action**: Drag to "rejected" column
- **Expected**: ApplicationStatusChangeModal appears
- **Expected**: Title: "Reject Application"
- **Expected**: Reason field shown with red asterisk (required)
- **Expected**: "Reject Application" button (red)
- **Verify**: Modal rendered correctly

#### Test 33: Rejection Reason Validation
- **Setup**: Rejection modal open
- **Action**: Leave reason empty, click Confirm
- **Expected**: Confirm button disabled
- **Expected**: Error message: "Rejection reason is required"
- **Verify**: Validation prevents empty rejection

#### Test 34: Rejection Reason Provided
- **Setup**: Rejection modal open
- **Action**: Enter reason text
- **Action**: Click "Reject Application"
- **Expected**: Request sent to backend
- **Expected**: Modal closes
- **Expected**: Application moves to rejected column
- **Verify**: Rejection recorded with reason

#### Test 35: Critical Change Modal - Hire
- **Setup**: Application in "offer" status
- **Action**: Drag to "hired" column
- **Expected**: ApplicationStatusChangeModal appears
- **Expected**: Title: "Mark as Hired?"
- **Expected**: Notes field shown (optional, no asterisk)
- **Expected**: "Confirm Hire" button (green)
- **Verify**: Modal shows hire configuration

#### Test 36: Hire Without Notes
- **Setup**: Hire modal open
- **Action**: Leave notes empty
- **Action**: Click "Confirm Hire"
- **Expected**: Request sent (notes optional)
- **Expected**: Application moves to hired column
- **Verify**: Hire recorded without notes

#### Test 37: Hire With Notes
- **Setup**: Hire modal open
- **Action**: Enter hire notes
- **Action**: Click "Confirm Hire"
- **Expected**: Notes recorded with status change
- **Verify**: Hire notes saved

#### Test 38: Cancel Status Change
- **Setup**: Status change modal open
- **Action**: Click "Cancel"
- **Expected**: Modal closes
- **Expected**: Status unchanged
- **Verify**: Application stays in original column

#### Test 39: Loading State During Update
- **Setup**: Status change modal open
- **Action**: Click Confirm
- **Expected**: Button shows "Processing..."
- **Expected**: Buttons disabled
- **Expected**: Cannot cancel during request
- **Verify**: Loading state visible

#### Test 40: Error During Status Update
- **Setup**: Status change attempted
- **Setup**: Backend returns error
- **Expected**: Error message displayed
- **Expected**: Modal remains open
- **Expected**: Can retry
- **Verify**: Error handling graceful

### Quick Action Button Tests

#### Test 41: "Advance to Interview" Button
- **Setup**: Modal open with application in "screening" status
- **Expected**: Button visible and enabled
- **Action**: Click button
- **Expected**: Status changes to interview
- **Expected**: Modal stays open
- **Verify**: Interview transition works

#### Test 42: "Reject" Button
- **Setup**: Modal open with application in any active status
- **Expected**: Button visible and enabled
- **Action**: Click button
- **Expected**: Rejection modal appears
- **Verify**: Quick reject action works

#### Test 43: "Send Message" Button
- **Setup**: Modal open
- **Expected**: Button visible and enabled
- **Action**: Click button
- **Expected**: Switches to Messages tab (or opens modal)
- **Verify**: Message interface accessible

#### Test 44: Quick Actions Disabled for Terminal States
- **Setup**: Application in "hired" status
- **Expected**: "Advance to Interview" button disabled/hidden
- **Expected**: "Reject" button disabled/hidden
- **Verify**: Terminal states immutable via quick actions

### Performance & Edge Cases

#### Test 45: Large Application List
- **Setup**: 1000+ applications in database
- **Expected**: Page loads without hanging
- **Expected**: Pagination limits initial load
- **Verify**: Performance acceptable

#### Test 46: No Applications
- **Setup**: Database empty or filtered to 0 results
- **Expected**: Each column shows "No applications"
- **Verify**: Empty state handled gracefully

#### Test 47: Concurrent Status Updates
- **Setup**: Two browser windows open same application
- **Setup**: Change status in one window
- **Expected**: Other window reflects change (or shows stale data)
- **Verify**: Concurrency handled

#### Test 48: Rapid Drag Operations
- **Setup**: Drag multiple applications quickly
- **Expected**: All moves processed correctly
- **Verify**: Race conditions prevented

#### Test 49: Very Long Candidate Names
- **Setup**: Candidate name >100 characters
- **Expected**: Text truncated or wrapped appropriately
- **Verify**: UI doesn't break

#### Test 50: Missing Data Fields
- **Setup**: Application missing optional fields (email, phone, etc.)
- **Expected**: UI displays gracefully with empty/default values
- **Verify**: No crashes on missing data

---

## Implementation Notes

### Known Issues & TODOs

1. **Jobs Filter Empty**
   - Filter component prepared but no jobs list passed
   - Need to integrate job listing in filters

2. **Backend Integration Pending**
   - Notes creation endpoint needed
   - Messaging endpoints needed
   - Status change reason storage needed

3. **RLS Policy Conflict**
   - `applications.update` checks user ownership
   - Blocks super_admin updates
   - Needs separate admin endpoint or policy bypass

4. **Mock Data Only**
   - Current UI uses mock data structure
   - Real data from database needs validation
   - May have schema mismatches

5. **List View Not Implemented**
   - "List" button in header exists
   - Placeholder message shown
   - Full list view component needed

6. **No Real-time Updates**
   - Changes don't automatically update other users' views
   - Consider WebSocket subscriptions for live updates

7. **Score Calculation**
   - Score display working
   - Backend calculation function exists but untested
   - Scoring algorithm needs documentation

### Testing Approach

**Recommended Test Order**:
1. Auth & authorization tests (1-3)
2. Data loading tests (4-7)
3. Filtering tests (8-11)
4. Kanban board tests (12-18)
5. Modal tests (19-30)
6. Status change tests (31-44)
7. Performance tests (45-50)

**Test Data Needed**:
- 20-50 applications across multiple statuses
- Multiple jobs
- Multiple organizations
- Mix of complete and partial candidate data
- Attachments in storage

**Automation**:
- Use Playwright for E2E tests
- Mock tRPC responses for unit tests
- Database fixtures for integration tests

---

## References

- **Source Code**: `/packages/core/features/office/applications/`
- **Database Schema**: `/packages/supabase/migrations/001_schema.sql` (lines 31-41, 313-328)
- **tRPC Router**: `/packages/supabase/functions/trpc/routers/applications.router.ts`
- **Parent Route**: `/office/` (office-organizations-list.tsx)
- **Mock Data**: `/packages/core/features/office/mock-data/ats-mock-data.ts`

---

**Last Updated**: 2025-11-03  
**Completeness**: 76% (core features working, backend integration needed)
