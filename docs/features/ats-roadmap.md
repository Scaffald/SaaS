# ATS Implementation Roadmap

## Overview

This document maps all GitHub issues to the ATS implementation phases and tracks overall progress.

**Last Updated:** October 11, 2025

## Implementation Status

### Current State: 72% Complete
- ✅ **Phase 1 Complete:** Database Schema & Storage (100%)
- ✅ **Phase 2 Complete:** Backend API & Validation (100%)
- ✅ **Phase 3 Complete:** Frontend - Candidate Application Flow (100%)
- 🚧 **Phase 4 In Progress:** Admin/Recruiter Interface (40%)
- ⏳ **Phase 5 Pending:** Advanced Features
- ⏳ **Phase 6 Pending:** Integrations
- ⏳ **Phase 7 Pending:** Compliance & Analytics

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

#### 🚧 In Progress - Admin Interface
- **#81: Pipeline Stages (Kanban UI)** - [✅ 80% COMPLETE]
  - ✅ Kanban board UI with 6 status columns
  - ✅ Application cards with candidate info
  - ✅ Color-coded status badges
  - ✅ Click to open detail modal
  - ✅ Horizontal scrolling
  - ⏳ Backend integration for status updates
  - ⏳ Real-time updates
  - **Location:** `packages/core/features/office/applications/`
  - **Files:** `ApplicationsKanbanBoard.tsx`, `office-applications-screen.tsx`
  
- **#82: Drag-and-Drop Pipeline Management** - [⏳ READY TO START]
  - ✅ Kanban UI complete (prerequisite met)
  - ⏳ Add drag-and-drop with react-beautiful-dnd
  - ⏳ Implement status change actions
  - ⏳ Add confirmation dialogs
  - ⏳ Bulk actions (advance/reject multiple)
  - Dependencies: #81 Kanban UI ✅ Complete
  
- **#83: Candidate Profile View (ATS Context)** - [✅ 70% COMPLETE]
  - ✅ Profile display in detail modal
  - ✅ Contact information card
  - ✅ Skills with proficiency badges
  - ✅ Certifications with issue dates
  - ✅ Work experience timeline
  - ⏳ Scaffald profile integration
  - ⏳ Activity history
  - **Location:** `packages/core/features/office/applications/components/`
  - **Files:** `CandidateDetailModal.tsx`, `CandidateProfileTab.tsx`

### Phase 2: Enhanced Recruiter Features

#### Communication & Collaboration
- **#84: Candidate Messaging** - [✅ 60% COMPLETE]
  - ✅ Message thread UI
  - ✅ Visual differentiation (recruiter/candidate)
  - ✅ Unread indicators
  - ✅ Send message form
  - ⏳ Backend integration for real messages
  - ⏳ Email fallback notifications
  - **Location:** `packages/core/features/office/applications/components/`
  - **Files:** `MessagesTab.tsx`
  
- **#85: Internal Notes & Ratings** - [✅ 70% COMPLETE]
  - ✅ Add note form with 5-star rating
  - ✅ View all notes with ratings and timestamps
  - ✅ Notes history display
  - ⏳ Backend integration for real notes
  - ⏳ Real-time updates
  - **Location:** `packages/core/features/office/applications/components/`
  - **Files:** `NotesTab.tsx`
  
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

#### Phase 4A: Core Admin Interface (Week 1)
**Using Option A (Simple Status System)**

1. **Seed ATS Demo Data** (#77) - 2 hours
   - Create realistic demo applications
   - Various status stages
   - Multiple candidates per job
   
2. **Candidate Profile View** (#83) - 1 day
   - Display full candidate profile
   - Application metadata sidebar
   - Quick actions (contact, advance, reject)
   
3. **Basic Pipeline Kanban UI** (#81) - 2 days
   - Kanban board using status field
   - Columns: New, Screen, Interview, Offer, Hired
   - Card view with candidate summary
   
4. **Simple Stage Management** (#82) - 1 day
   - Click to move between stages
   - Status update confirmation
   - Basic bulk actions

#### Phase 4B: Enhanced Features (Week 2)
5. **Internal Notes & Ratings** (#85) - 1 day
   - Simple notes interface
   - Star rating system
   - Notes history

6. **Basic Messaging** (#84) - 2 days
   - Simple message thread
   - Email notification fallback
   - Message templates (basic)

#### Phase 4C: Full Pipeline System (Week 3-4)
7. **Implement Pipeline Tables** - 2 days
   - Create migration 079: pipelines and pipeline_stages
   - Migrate existing applications to default pipeline
   - Admin UI for pipeline management

8. **Enhanced Kanban with Custom Stages** - 1 day
   - Drag-and-drop with react-beautiful-dnd
   - Custom stage support
   - Stage history tracking

---

## Success Metrics

### Phase 4 Completion Criteria
- [x] Employers can view all applications for their jobs - ✅ Kanban board
- [x] Employers can see candidate profiles with application context - ✅ Detail modal
- [ ] Employers can move candidates through hiring stages - 🚧 UI ready, backend needed
- [x] Employers can leave private notes on candidates - ✅ UI complete, backend needed
- [x] Employers can communicate with candidates - ✅ UI complete, backend needed
- [ ] All features tested on web and mobile - ⏳ Pending
- [ ] Demo data seeded for testing - 🚧 3 samples ready, need 17+ more

### Overall ATS MVP Criteria
- [x] Candidates can apply for jobs (✅ Complete)
- [x] Employers can post jobs (✅ Complete)
- [x] Employers can view and review applications (✅ UI Complete)
- [ ] Employers can manage application lifecycle (🚧 Backend integration needed)
- [ ] System tracks application lifecycle (✅ Backend Complete)
- [ ] Analytics available for hiring funnel (⏳ Pending)

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

