# ATS Implementation Roadmap

## Overview

This document maps all GitHub issues to the ATS implementation phases and tracks overall progress.

**Last Updated:** October 11, 2025

## Implementation Status

### Current State: 76% Complete
- ✅ **Phase 1 Complete:** Database Schema & Storage (100%)
- ✅ **Phase 2 Complete:** Backend API & Validation (100%)
- ✅ **Phase 3 Complete:** Frontend - Candidate Application Flow (100%)
- ✅ **Phase 4A Complete:** Core Recruiter UI (100%)
- 🚧 **Phase 4B In Progress:** Backend Integration & Data Wiring (50%)
- ⏳ **Phase 4C Pending:** Advanced Admin Features
- ⏳ **Phase 5 Pending:** Analytics & Compliance
- ⏳ **Phase 6 Pending:** Advanced Integrations

---

## Phase Mapping

### MVP Phase (Foundation)

#### ✅ Complete
- **#75: Design ATS Schema** - [CLOSED]
  - Docs: `/docs/features/ats-schema.md`, `/docs/roadmap/ats-schema-design.md`
  - Status: Schema design complete and implemented
  
- **#76: Implement Migrations & Models** - [COMPLETE]
  - Migrations: `075_enhance_applications_table.sql`, `076_create_application_attachments_storage.sql`, `077_create_application_scoring_function.sql`, `078_create_auto_rejection_function.sql`
  - tRPC Router: Complete with 11 endpoints
  - Schemas: Complete validation schemas
  - Status: All migrations deployed and tested

- **#77: Seed Demo Data** - [IN PROGRESS]
  - Current: Basic seed data exists
  - Needed: ATS-specific demo data (pipelines, applications, candidates)
  - Priority: HIGH (needed for Phase 4 testing)
  
- **#79: Job Distribution (Internal)** - [COMPLETE]
  - Jobs appear in Scaffald feed
  - Search and filter implemented
  - Status: Functional

#### ✅ Complete - Phase 4A: Core Recruiter UI
- **#81: Pipeline Stages (Kanban UI)** - [✅ 100% COMPLETE]
  - ✅ Kanban board UI with 6 status columns (New, Screen, Interview, Offer, Hired, Rejected)
  - ✅ Application cards with candidate photo, name, job, score, date
  - ✅ Color-coded score badges (green 80+, blue 60+, red <60)
  - ✅ Click to open detail modal
  - ✅ Horizontal scrolling for all columns
  - ✅ Empty state messaging
  - ✅ Filters component (job, status)
  - ⏳ Backend integration for real data (Phase 4B)
  - ⏳ Real-time updates (Phase 4B)
  - **Location:** `packages/core/features/office/applications/`
  - **Files:** `ApplicationsKanbanBoard.tsx`, `office-applications-screen.tsx`, `ApplicationsFilters.tsx`
  - **Commit:** `7fb0850` - feat(office): implement ATS recruiter interface with Kanban board
  
- **#83: Candidate Profile View (ATS Context)** - [✅ 100% COMPLETE]
  - ✅ Full-screen Sheet modal with tabs
  - ✅ Profile tab with contact info, skills, certifications, work experience
  - ✅ Application tab with screening answers, attachments, timeline
  - ✅ Skills with proficiency badges (Expert, Advanced, Intermediate, Beginner)
  - ✅ Certifications with state and issue dates
  - ✅ Work experience timeline with duration
  - ✅ Quick action buttons (Advance, Reject, Send Message)
  - ⏳ Scaffald profile integration (Phase 4B)
  - ⏳ Activity history (Phase 4C)
  - **Location:** `packages/core/features/office/applications/components/`
  - **Files:** `CandidateDetailModal.tsx`, `CandidateProfileTab.tsx`, `ApplicationDetailsTab.tsx`
  - **Commit:** `7fb0850` - feat(office): implement ATS recruiter interface with Kanban board

#### 🚧 In Progress - Phase 4B: Backend Integration
- **#77: Seed Demo Data** - [🚧 50% COMPLETE]
  - ✅ Migration 092 creates `applications_view` for simplified queries
  - ✅ Seed 11 creates 3 sample applications
  - ✅ Mock data with 3 realistic applications (440 lines)
  - ⏳ Expand to 17+ applications for realistic testing
  - ⏳ More variety in scores, statuses, and jobs
  - **Files:** `packages/supabase/migrations/092_create_applications_view.sql`
  - **Files:** `packages/supabase/seeds/11_seed-applications.sql`
  - **Files:** `packages/core/features/office/mock-data/ats-mock-data.ts`
  - **Commit:** `4213f6b` - feat: implement organizations CRUD in /office context

- **Applications Navigation & Data Flow** - [✅ COMPLETE]
  - ✅ Added Applications to Office drawer navigation
  - ✅ Created comprehensive tRPC hooks in `useApplications.ts`
  - ✅ Wired OfficeApplicationsScreen to real tRPC queries
  - ✅ Loading and error states
  - ✅ Status filters connected to API
  - **Files:** `packages/core/features/office/applications/hooks/useApplications.ts` (214 lines)
  - **Commit:** `6709a96` - feat: Add Applications navigation and wire up tRPC data flow

- **Backend Integration Tasks** - [⏳ NEXT]
  - ⏳ Connect Kanban board to real application data
  - ⏳ Wire up status change actions to tRPC
  - ⏳ Integrate notes API endpoints
  - ⏳ Integrate messages API endpoints
  - ⏳ Add real-time updates for status changes
  - ⏳ Test on web and mobile platforms
  
- **#82: Drag-and-Drop Pipeline Management** - [⏳ READY TO START - Phase 4C]
  - ✅ Kanban UI complete (prerequisite met)
  - ⏳ Add drag-and-drop with react-beautiful-dnd
  - ⏳ Implement status change actions with drag
  - ⏳ Add confirmation dialogs
  - ⏳ Bulk actions (advance/reject multiple)
  - Dependencies: #81 Kanban UI ✅ Complete

### Phase 2: Enhanced Recruiter Features

#### Communication & Collaboration (Phase 4C)
- **#84: Candidate Messaging** - [✅ 100% UI COMPLETE, Backend Pending]
  - ✅ Message thread UI with mock data
  - ✅ Visual differentiation (recruiter messages blue on right, candidate on left)
  - ✅ Unread indicators
  - ✅ Send message form with textarea
  - ✅ Message timestamp display
  - ⏳ Backend integration for real messages (Phase 4B/4C)
  - ⏳ Email fallback notifications (Phase 4C)
  - ⏳ Real-time message updates (Phase 4C)
  - **Location:** `packages/core/features/office/applications/components/`
  - **Files:** `MessagesTab.tsx` (146 lines)
  - **Commit:** `7fb0850` - feat(office): implement ATS recruiter interface with Kanban board
  
- **#85: Internal Notes & Ratings** - [✅ 100% UI COMPLETE, Backend Pending]
  - ✅ Add note form with 5-star rating selector
  - ✅ View all notes with ratings and timestamps
  - ✅ Notes history display with author information
  - ✅ Note submission UI with validation
  - ⏳ Backend integration for real notes (Phase 4B/4C)
  - ⏳ Real-time updates (Phase 4C)
  - ⏳ Note editing/deletion (Phase 4C)
  - **Location:** `packages/core/features/office/applications/components/`
  - **Files:** `NotesTab.tsx` (193 lines)
  - **Commit:** `7fb0850` - feat(office): implement ATS recruiter interface with Kanban board
  
- **#86: Multi-Recruiter Access & Activity Feed** - [PLANNED]
  - Shared pipelines within org
  - Activity history
  - Dependencies: #81 Pipeline system
  
- **#89: Stage-Specific Message Templates** - [PLANNED]
  - Canned responses for different stages
  - Template management
  - Dependencies: #84 Messaging, #81 Pipeline system

#### Scheduling
- **#87: Calendar Integration (Phase 1)** - [PLANNED]
  - Propose interview times
  - Google Calendar API integration
  - Dependencies: None, standalone feature
  
- **#88: Candidate Self-Scheduling** - [PLANNED]
  - Self-scheduling interface
  - Available time slot selection
  - Dependencies: #87 Calendar integration

### Phase 3: Analytics & Compliance

#### Analytics
- **#90: Basic Metrics Dashboard** - [PLANNED]
  - Job views, applications, hires
  - Funnel drop-off tracking
  - Dependencies: Application tracking data
  
- **#91: Source-of-Hire Tracking** - [PLANNED]
  - Track candidate sources
  - Analytics and reporting
  - Dependencies: Enhanced application data
  
- **#92: Time-to-Hire Reporting** - [PLANNED]
  - Average days calculation
  - Trend analysis
  - Dependencies: Application stage history

#### Compliance
- **#93: Document Uploads (Certs & IDs)** - [PARTIALLY COMPLETE]
  - Storage system: ✅ Complete (migration 076)
  - Upload interface: ✅ Complete (AttachmentsStep)
  - Needed: Admin verification interface
  
- **#94: GDPR/CCPA Delete Requests** - [PLANNED]
  - Data deletion request interface
  - Automated deletion process
  - Dependencies: Legal review
  
- **#95: EEO/OFCCP Reporting** - [PLANNED]
  - Optional compliance reporting
  - Report generation
  - Dependencies: Legal review, data collection

### Phase 4: Advanced Integrations

- **#96: Payroll/HRIS Integration** - [PLANNED]
  - ADP, Paychex, Gusto integration
  - Automated sync for hired candidates
  - Dependencies: HRIS partnerships
  
- **#97: Background Check API Integration** - [PLANNED]
  - Checkr, Sterling providers
  - Automated check initiation
  - Dependencies: API partnerships
  
- **#98: Union-Aware Hiring** - [PLANNED]
  - Union vs non-union flagging
  - Different workflows
  - Dependencies: Legal review
  
- **#99: Project-Based Hiring Mode** - [PLANNED]
  - Short-term/seasonal workflows
  - Bulk hiring capabilities
  - Dependencies: Core ATS complete

- **#80: Google for Jobs Integration** - [PLANNED]
  - Schema.org markup
  - Job feed export
  - Dependencies: SEO strategy

---

## Critical Path Analysis

### Immediate Blockers

#### 🚨 ISSUE: Pipeline System Not Implemented
**Problem:** GitHub issues #81, #82, and most of Phase 2 assume a pipeline system with:
- `pipelines` table
- `pipeline_stages` table  
- `job_pipelines` mapping
- Custom stage management

**Current Reality:**
- We only have `applications.status` field
- No pipeline tables exist yet
- Migration strategy unclear

**Impact:**
- Cannot implement Kanban UI (#81)
- Cannot implement drag-and-drop (#82)
- Cannot implement stage-specific features (#86, #89)

**Resolution Options:**

**Option A: Use Current Simple Status System (FASTER)**
- Build Kanban UI using existing `applications.status` field
- Default stages: new, screen, interview, offer, hired, rejected, withdrawn
- No custom pipelines initially
- Pros: Can start immediately, MVP-ready
- Cons: Less flexible, limited customization

**Option B: Implement Full Pipeline System (COMPLETE)**
- Create migrations for pipelines/pipeline_stages tables
- Follow `/docs/features/ats-schema.md` design
- Add custom stage management
- Pros: Complete solution, matches GitHub issues
- Cons: 2-3 days additional work

### Recommended Next Steps

#### ✅ Phase 4A: Core Admin Interface - COMPLETE
**Using Option A (Simple Status System)**

1. ✅ **Seed ATS Demo Data** (#77) - Initial work done
   - ✅ Created realistic demo applications (3 samples)
   - ✅ Various status stages
   - ✅ Mock data system with 440 lines
   - ⏳ Expand to 17+ applications
   
2. ✅ **Candidate Profile View** (#83) - COMPLETE
   - ✅ Display full candidate profile in modal
   - ✅ Application metadata in tabs
   - ✅ Quick actions (contact, advance, reject)
   
3. ✅ **Basic Pipeline Kanban UI** (#81) - COMPLETE
   - ✅ Kanban board using status field
   - ✅ Columns: New, Screen, Interview, Offer, Hired, Rejected
   - ✅ Card view with candidate summary and scores
   
4. ✅ **Internal Notes & Ratings** (#85) - UI COMPLETE
   - ✅ Notes interface with 5-star rating
   - ✅ Notes history
   - ⏳ Backend integration

5. ✅ **Basic Messaging** (#84) - UI COMPLETE
   - ✅ Message thread UI
   - ✅ Send message form
   - ⏳ Backend integration
   - ⏳ Email notification fallback

#### 🚧 Phase 4B: Backend Integration (Current - 2 weeks)
**Wire up existing UI to real data and APIs**

1. **Connect Real Application Data** (Week 1) - IN PROGRESS
   - ✅ Created tRPC hooks (`useApplications.ts`)
   - ✅ Wired OfficeApplicationsScreen to real queries
   - ⏳ Adapt Kanban board to real data structure
   - ⏳ Fix any RLS or schema issues
   
2. **Implement Status Change Actions** (Week 1)
   - ⏳ Add tRPC endpoint for status updates
   - ⏳ Wire up quick action buttons
   - ⏳ Add confirmation dialogs
   - ⏳ Status history tracking
   
3. **Integrate Notes & Messages APIs** (Week 2)
   - ⏳ Create tRPC endpoints for notes CRUD
   - ⏳ Create tRPC endpoints for messages
   - ⏳ Wire up NotesTab to real API
   - ⏳ Wire up MessagesTab to real API
   - ⏳ Add real-time subscriptions (optional)
   
4. **Testing & Bug Fixes** (Week 2)
   - ⏳ Test on web platform
   - ⏳ Test on iOS platform
   - ⏳ Test on Android platform
   - ⏳ Performance testing with 100+ applications
   - ⏳ Edge case handling

#### ⏳ Phase 4C: Advanced Features (Week 3-4)
**Enhanced functionality and polish**

1. **Drag-and-Drop Stage Management** (#82) - 3 days
   - Add react-beautiful-dnd library
   - Implement drag between columns
   - Status update confirmation
   - Optimistic UI updates

2. **Bulk Actions** - 2 days
   - Multi-select applications
   - Bulk status changes
   - Bulk rejection with reason

3. **Advanced Filters & Search** - 2 days
   - Date range filters
   - Search by candidate name
   - Filter by score range
   - Save filter presets

4. **Email Notifications** - 2 days
   - Message notification emails
   - Status change notifications
   - Application received confirmation
   - Interview reminder emails

5. **Polish & Performance** - 1 day
   - Loading optimizations
   - Error handling improvements
   - UI/UX refinements
   - Mobile responsiveness fixes

---

## Success Metrics

### Phase 4A Completion Criteria - ✅ COMPLETE
- [x] Employers can view all applications for their jobs - ✅ Kanban board
- [x] Employers can see candidate profiles with application context - ✅ Detail modal with 4 tabs
- [x] Employers can leave private notes on candidates - ✅ UI complete (backend needed)
- [x] Employers can communicate with candidates - ✅ UI complete (backend needed)
- [x] Kanban board with status columns - ✅ 6 columns with cards
- [x] Application filters (job, status) - ✅ Complete
- [x] Color-coded score badges - ✅ Green/Blue/Red based on score
- [x] Mock data for development - ✅ 3 realistic applications

### Phase 4B Completion Criteria - 🚧 IN PROGRESS
- [x] Applications navigation in Office drawer - ✅ Complete
- [x] tRPC hooks for applications - ✅ Complete (214 lines)
- [ ] Kanban board connected to real data - ⏳ Next
- [ ] Status change actions wired up - ⏳ Next
- [ ] Notes API integration - ⏳ Pending
- [ ] Messages API integration - ⏳ Pending
- [ ] All features tested on web and mobile - ⏳ Pending
- [ ] Demo data expanded (17+ applications) - ⏳ Pending

### Overall ATS MVP Criteria
- [x] Candidates can apply for jobs (✅ Phase 3 Complete)
- [x] Employers can post jobs (✅ Office Jobs Management)
- [x] Employers can view and review applications (✅ Phase 4A Complete)
- [ ] Employers can manage application lifecycle (🚧 Phase 4B In Progress)
- [x] System tracks application lifecycle (✅ Backend Complete)
- [ ] Analytics available for hiring funnel (⏳ Phase 5 Pending)

---

## Technical Debt & Decisions

### Decision: Start with Simple Status, Upgrade Later
**Rationale:**
- Get working MVP to employers faster
- Validate core workflow before complex customization
- Easier to test and debug
- Can migrate to full pipeline system in Phase 4C

**Migration Path:**
1. Build Phase 4A with status-based system
2. Gather user feedback
3. Implement full pipeline system based on actual needs
4. Migrate existing data to pipeline tables
5. Enable custom stage management

### Documentation Gaps
- Missing detailed docs for issues #80-99
- Need admin interface mockups/wireframes
- Need drag-and-drop UX specifications
- Need messaging system architecture

---

## References

- [Application System Implementation Plan](./application-system-implementation-plan.md) - Phases 1-3
- [Application System Progress](./application-system-progress.md) - Current status
- [ATS Schema Design](./ats-schema.md) - Basic schema
- [ATS Schema Design (Comprehensive)](../roadmap/ats-schema-design.md) - Full schema
- [GitHub Issues](https://github.com/Unicorn/SCF-Neue/issues?q=is%3Aissue+is%3Aopen+label%3AATS)

---

**Next Action:** Review this roadmap and decide on Option A (fast MVP) vs Option B (complete pipeline system) for Phase 4 implementation.

