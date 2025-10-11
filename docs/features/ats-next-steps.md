# ATS Implementation: Next Steps (UI-First Approach)

**Date:** October 11, 2025  
**Current Status:** 40% Complete (Phases 1-3 Done)  
**Strategy:** Build UI with mock data first, wire backend later

---

## 🎯 Executive Summary

**What's Complete:**
- ✅ Database schema with 13 new columns, 6 indexes, scoring/rejection functions
- ✅ Backend API with 11 tRPC endpoints and comprehensive validation
- ✅ Candidate application flow with 8 frontend components
- ✅ File upload system for resumes, cover letters, portfolios

**What's Next - NEW APPROACH:**
- 🎨 Build complete recruiter UI with mock data (1-2 weeks)
- ✅ Iterate and validate UX with stakeholders
- 🔌 Wire up backend after UI is approved

**Why This Approach:**
- Fast iteration without backend dependencies
- Validate workflow before committing to schema
- Get visual feedback early
- Easier to change and demo

**See:** [ATS Implementation Revised](./ats-implementation-revised.md) for detailed UI-first plan

---

## 🚨 Critical Issue: Pipeline System Design

### The Problem

GitHub issues (#81, #82, #86, #89) assume a full pipeline system with:
```sql
pipelines
  - id, organization_id, name, description
pipeline_stages
  - id, pipeline_id, name, stage_order, color
job_pipelines
  - job_id, pipeline_id
applications
  - pipeline_id, pipeline_stage_id, stage_entered_at
```

**Current Reality:**
- We only have `applications.status` field
- Status values: 'new', 'screen', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'
- No pipeline tables exist yet
- Simpler, but less flexible

### The Options

#### Option A: Use Simple Status System (RECOMMENDED)
**Timeline:** 5-7 days for Phase 4A  
**Pros:**
- Start immediately - no new migrations needed
- MVP-ready in one week
- Validates core workflow before over-engineering
- Easier to test and debug
- Can upgrade to full pipeline system later

**Cons:**
- No custom stages per organization
- Less flexible than GitHub issues envision
- Need migration path to full system later

**Implementation:**
```
Week 1: Core Admin Interface
├── Day 1: Seed demo data (#77)
├── Day 2: Candidate profile view (#83)
├── Day 3-4: Kanban UI with status columns (#81)
└── Day 5: Click-to-move stage management (#82)

Week 2: Enhanced Features
├── Day 1: Internal notes & ratings (#85)
└── Day 2-3: Basic messaging (#84)
```

#### Option B: Implement Full Pipeline System First
**Timeline:** 2-3 days for migrations + 5-7 days for Phase 4  
**Pros:**
- Complete solution matching GitHub issues
- Custom pipelines per organization
- Custom stages per pipeline
- Full stage history tracking
- No future migration needed

**Cons:**
- 2-3 days additional work upfront
- More complex to test
- May over-engineer before validating needs
- Higher risk of scope creep

**Implementation:**
```
Week 1: Pipeline System
├── Day 1-2: Create migration 079 (pipelines, pipeline_stages, job_pipelines)
├── Day 2-3: Migrate existing applications.status to pipeline system
├── Day 3: Pipeline management UI for admins
└── Day 4-5: Testing and validation

Week 2-3: Admin Interface (same as Option A but with pipeline features)
```

---

## 📋 Recommended Implementation: Option A (Fast MVP)

### Phase 4A: Core Admin Interface (Week 1)

#### Day 1: Seed ATS Demo Data (#77)
**File:** `packages/supabase/seeds/006_ats_demo_data.sql`

```sql
-- Create 20-30 demo applications across various stages
-- Multiple candidates per job
-- Realistic names, locations, experience levels
-- Cover all status values
```

**Deliverables:**
- [ ] Demo applications seeded
- [ ] Various status stages represented
- [ ] Realistic candidate profiles
- [ ] Test data covers edge cases

---

#### Day 2: Candidate Profile View (#83)
**Location:** `packages/core/features/office/components/applications/`

**Files to Create:**
```
CandidateProfileModal.tsx     - Full-screen candidate profile
ApplicationMetadataSidebar.tsx - Application context sidebar
QuickActionsBar.tsx           - Contact, advance, reject buttons
```

**Features:**
- Display full candidate Scaffald profile
  - Name, location, experience
  - Skills with proficiency
  - Certifications
  - Work history
  - Education
- Application metadata sidebar
  - Applied date
  - Current status
  - Application score
  - Screening answers
  - Custom question answers
  - Attachments (view/download)
- Quick actions
  - Send message
  - Advance to next stage
  - Reject application
  - Add note

**Deliverables:**
- [ ] Candidate profile modal component
- [ ] Application metadata display
- [ ] Quick actions implemented
- [ ] Mobile-responsive design
- [ ] Tested on web and mobile

---

#### Day 3-4: Pipeline Kanban UI (#81)
**Location:** `packages/core/features/office/components/applications/`

**Files to Create:**
```
ApplicationsKanbanBoard.tsx   - Main Kanban board
StatusColumn.tsx              - Individual status column
ApplicationCard.tsx           - Candidate card in column
ApplicationFilters.tsx        - Filter by job, date, score
```

**Features:**
- Kanban board with status-based columns:
  - New Applications
  - Screening
  - Interview
  - Offer
  - Hired
  - Rejected
- Application cards showing:
  - Candidate name and photo
  - Applied date
  - Application score
  - Key qualifications
  - Quick actions
- Filters:
  - By job posting
  - By date range
  - By score range
  - By location
- Summary stats:
  - Total per column
  - Conversion rates
  - Average time in stage

**Tech Stack:**
- Tamagui for UI components
- React Query for data fetching
- Optimistic updates for better UX

**Deliverables:**
- [ ] Kanban board component
- [ ] Status columns implemented
- [ ] Application cards designed
- [ ] Filters functional
- [ ] Summary stats displayed
- [ ] Mobile-responsive layout
- [ ] Performance optimized for 100+ applications

---

#### Day 5: Stage Management (#82)
**Location:** Extend Kanban board components

**Features:**
- Click card to open candidate profile
- "Advance to Next Stage" button
  - New → Screen
  - Screen → Interview
  - Interview → Offer
  - Offer → Hired
- "Reject Application" button
  - Confirm with reason
  - Optional message to candidate
- Bulk actions:
  - Select multiple applications
  - Bulk advance
  - Bulk reject
  - Bulk tag
- Status update confirmation
- Undo recent action (5-minute window)

**Backend:**
- Use existing `applications.update` endpoint
- Update `status` field
- Create audit trail in notes

**Deliverables:**
- [ ] Click-to-advance functionality
- [ ] Reject with reason dialog
- [ ] Bulk selection UI
- [ ] Bulk action buttons
- [ ] Confirmation dialogs
- [ ] Undo functionality
- [ ] Status update animations

---

### Phase 4B: Enhanced Features (Week 2)

#### Day 6: Internal Notes & Ratings (#85)
**Location:** `packages/core/features/office/components/applications/`

**Files to Create:**
```
ApplicationNotes.tsx          - Notes list and form
NoteItem.tsx                  - Individual note display
RatingWidget.tsx              - Star rating component
```

**Features:**
- Private notes on candidates
  - Rich text editor (simple)
  - Author name and timestamp
  - Edit/delete own notes
- Star rating system (1-5 stars)
  - Visual star display
  - Hover states
  - Average rating calculation
- Notes filtering
  - By author
  - By date
  - By rating
- Export notes for review

**Backend:**
- Store notes in `applications.notes` jsonb field
- Structure:
  ```json
  {
    "notes": [
      {
        "id": "uuid",
        "author_id": "uuid",
        "author_name": "John Doe",
        "content": "Great candidate...",
        "rating": 4,
        "created_at": "2025-10-11T..."
      }
    ]
  }
  ```

**Deliverables:**
- [ ] Notes list component
- [ ] Add note form
- [ ] Rating widget
- [ ] Edit/delete functionality
- [ ] Notes filtering
- [ ] Backend schema updated

---

#### Day 7-8: Basic Messaging (#84)
**Location:** `packages/core/features/office/components/applications/`

**Files to Create:**
```
MessageThread.tsx             - Message thread display
MessageComposer.tsx           - Send message form
MessageTemplateSelector.tsx   - Quick message templates
```

**Features:**
- Simple message thread
  - Display conversation history
  - Employer and candidate messages
  - Read/unread status
- Send message form
  - Subject line
  - Message body
  - Attach files (optional)
- Email fallback
  - If candidate not active, send email
  - Email includes link to view in app
- Basic message templates
  - "Thanks for applying"
  - "We'd like to schedule an interview"
  - "Unfortunately..."
  - Custom templates

**Backend:**
- Create new tRPC endpoint: `applications.sendMessage`
- Store in `applications.notes` jsonb or create separate table
- Email service integration
- Push notification when message received

**Deliverables:**
- [ ] Message thread component
- [ ] Message composer
- [ ] Template selector
- [ ] Email fallback system
- [ ] Push notifications
- [ ] Backend endpoint
- [ ] Mobile-optimized

---

## 📊 Success Metrics

### Phase 4A Completion Criteria
- [ ] Employers can view all applications for their jobs
- [ ] Employers can see candidate profiles with full context
- [ ] Employers can move candidates through hiring stages
- [ ] Employers can reject candidates with reasons
- [ ] Employers can perform bulk actions
- [ ] All features work on web and mobile
- [ ] Demo data available for testing
- [ ] Performance: <500ms page load for 100 applications

### Phase 4B Completion Criteria
- [ ] Employers can leave private notes on candidates
- [ ] Employers can rate candidates with stars
- [ ] Employers can search/filter notes
- [ ] Employers can message candidates
- [ ] Candidates receive email notifications
- [ ] Message templates available
- [ ] All features tested and documented

---

## 🔄 Future Migration Path (Phase 4C)

**When to Upgrade to Full Pipeline System:**
- After gathering user feedback on Phase 4A/B
- When 3+ organizations request custom stages
- When analytics show status system limitations
- Estimated timeline: 1-2 weeks

**Migration Steps:**
1. Create migration 079 (pipeline tables)
2. Create default pipeline for each organization
3. Map existing status values to pipeline stages
4. Migrate `applications.status` to `applications.pipeline_stage_id`
5. Update Kanban UI to support custom pipelines
6. Add pipeline management admin interface
7. Enable drag-and-drop between stages

---

## 📚 Required Reading Before Starting

1. **[Application System Implementation Plan](./application-system-implementation-plan.md)**
   - Review Phase 4 section
   - Understand component hierarchy
   - Review API endpoints

2. **[Application System Progress](./application-system-progress.md)**
   - See what's already complete
   - Review existing components
   - Understand file structure

3. **[ATS Roadmap](./ats-roadmap.md)**
   - Full GitHub issue mapping
   - Critical path analysis
   - Decision points

4. **[ATS Schema Design](../roadmap/ats-schema-design.md)**
   - Understand future pipeline system
   - Review RLS patterns
   - See full feature set

---

## 🚀 Getting Started

### Step 1: Review and Decide
- [ ] Review this document
- [ ] Decide: Option A (fast) or Option B (complete)
- [ ] Confirm Phase 4A timeline and scope

### Step 2: Setup Environment
```bash
# Ensure migrations are applied
pnpm supa status
pnpm supa:generate

# Ensure dev servers running
pnpm dev        # Expo on :8081
pnpm web        # Web on :3000

# Run quality checks
pnpm check
pnpm build
```

### Step 3: Start Implementation
- [ ] Create seed file for demo data
- [ ] Run seeds: `pnpm supa reset`
- [ ] Start with CandidateProfileModal component
- [ ] Test iteratively as you build

---

## ❓ Questions to Answer

Before starting Phase 4, clarify:

1. **Pipeline System Decision**
   - Option A (status-based) or Option B (full pipeline)?
   - When to migrate to full system?

2. **Scope Confirmation**
   - Start with Phase 4A only?
   - Include Phase 4B in initial build?

3. **Design Assets**
   - Need mockups for Kanban board?
   - Need designs for candidate profile?

4. **Priority Features**
   - Which are must-have for MVP?
   - Which can wait for Phase 4B/C?

5. **Testing Strategy**
   - Manual testing only?
   - Need automated tests?
   - E2E test scenarios?

---

## 📞 Next Action

**Immediate:** Review this document and decide on Option A vs Option B

**Then:** Confirm scope and timeline for Phase 4A

**Finally:** Begin implementation with seed data creation

---

*Ready to build the recruiter interface that completes the ATS MVP!* 🎉

