# Application System Implementation Plan

## Overview

This document outlines the complete implementation plan for enhancing the SCF-Neue application system to provide a robust, multi-step application flow with full ATS integration, auto-screening capabilities, and comprehensive candidate tracking.

### Goals

1. **Robust Data Capture** - Collect all necessary screening information and custom answers
2. **File Management** - Support resume, cover letter, portfolio, and assessment uploads
3. **Auto-Screening** - Automatically filter and score applications based on job requirements
4. **ATS Integration** - Seamlessly place applications into hiring pipeline stages
5. **Validation** - Comprehensive client and server-side validation
6. **Candidate Experience** - Intuitive multi-step process with clear progress indicators
7. **Recruiter Tools** - Admin interface for reviewing and managing applications

## Current State

### What We Have
- ✅ Basic `applications` table with status workflow
- ✅ ATS pipeline support (`pipeline_id`, `pipeline_stage_id`, `stage_entered_at`)
- ✅ `application_stage_history` table for audit trails
- ✅ Job configuration for custom questions, required attachments, assessments
- ✅ Auto-reject criteria configuration in jobs
- ✅ Basic application form collecting screening questions (display only)

### What's Missing
- ❌ Schema columns for screening answers and file attachments
- ❌ Multi-step application flow UI
- ❌ File upload functionality
- ❌ Custom question rendering and answer capture
- ❌ Auto-screening logic implementation
- ❌ Application scoring algorithm
- ❌ Automatic pipeline stage assignment
- ❌ Admin/recruiter application review interface

## Implementation Phases

### Phase 1: Database Schema & Storage (Priority: HIGH)

#### 1.1 Extend Applications Table
**Migration**: `075_enhance_applications_table.sql`

```sql
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS:
- current_location text
- willing_to_relocate boolean
- years_experience integer
- is_authorized_to_work boolean
- earliest_start_date text
- screening_answers jsonb DEFAULT '{}'::jsonb
- custom_question_answers jsonb DEFAULT '{}'::jsonb
- attachments jsonb DEFAULT '{}'::jsonb
- application_score integer CHECK (application_score >= 0 AND application_score <= 100)
- auto_rejected boolean DEFAULT false
- auto_reject_reason text
- completed_steps text[] DEFAULT ARRAY[]::text[]
- is_complete boolean DEFAULT false
```

**Indexes**:
- `applications_score_idx` on `(application_score DESC)` where `is_complete = true`
- `applications_auto_rejected_idx` on `(auto_rejected)` where `auto_rejected = true`
- `applications_location_idx` on `(current_location)`

#### 1.2 Create Application Attachments Storage
**Migration**: `076_create_application_attachments_storage.sql`

```sql
-- Create storage bucket for application attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('application-attachments', 'application-attachments', false);

-- RLS Policies:
- Users can upload their own attachments
- Organization owners can view attachments for their jobs
- Platform admins can view all attachments
```

Supported file types:
- **Resumes**: PDF, DOC, DOCX (max 5MB)
- **Cover Letters**: PDF, DOC, DOCX (max 2MB)
- **Portfolios**: PDF, ZIP (max 50MB)
- **Assessments**: PDF (max 10MB)
- **Video Interviews**: MP4, MOV (max 500MB - or use external service)

#### 1.3 Create Application Scoring Function
**Migration**: `077_create_application_scoring_function.sql`

```sql
CREATE OR REPLACE FUNCTION calculate_application_score(
  p_application_id uuid
) RETURNS integer;

-- Scoring algorithm:
- Work authorization: +20 points
- Years experience match: +25 points
- All required skills: +25 points
- All required certifications: +15 points
- Location match or willing to relocate: +10 points
- Custom questions answered completely: +5 points
```

#### 1.4 Create Auto-Rejection Function
**Migration**: `078_create_auto_rejection_function.sql`

```sql
CREATE OR REPLACE FUNCTION apply_auto_rejection(
  p_application_id uuid
) RETURNS boolean;

-- Auto-reject criteria:
- Missing work authorization (if required)
- Below minimum score threshold
- Missing all required skills (if configured)
- Missing all required certifications (if configured)
```

### Phase 2: Backend API & Validation (Priority: HIGH)

#### 2.1 Create Application Schemas
**File**: `packages/schemas/src/applications/application.schema.ts`

```typescript
// applicationCreateSchema - for initial submission
// applicationUpdateSchema - for step-by-step updates
// screeningAnswersSchema - validation for screening questions
// customQuestionAnswerSchema - validation for custom questions
// attachmentUploadSchema - validation for file uploads
```

#### 2.2 Extend tRPC Applications Router
**File**: `packages/supabase/functions/trpc/routers/applications.router.ts`

New endpoints:
- `submitApplication` - Complete application submission with validation
- `updateApplicationStep` - Save progress for specific step
- `uploadAttachment` - Handle file upload with validation
- `calculateScore` - Trigger score calculation
- `applyAutoScreening` - Run auto-screening logic
- `getApplicationStatus` - Get current application status
- `getUserApplications` - Get user's applications with full details
- `getJobApplications` - Get all applications for a job (admin only)

#### 2.3 Create Application Validation Service
**File**: `packages/supabase/functions/_shared/application-validation.ts`

Services:
- `validateScreeningAnswers()` - Validate required screening fields
- `validateCustomAnswers()` - Validate custom question responses
- `validateAttachments()` - Validate file types, sizes, required attachments
- `validateApplicationComplete()` - Ensure all required steps completed
- `checkDuplicateApplication()` - Prevent duplicate submissions

#### 2.4 Create Application Scoring Service
**File**: `packages/supabase/functions/_shared/application-scoring.ts`

Services:
- `calculateApplicationScore()` - Implement scoring algorithm
- `evaluateSkillsMatch()` - Compare user skills to job requirements
- `evaluateCertificationsMatch()` - Compare certifications
- `evaluateExperienceMatch()` - Compare years of experience
- `evaluateLocationMatch()` - Compare location and relocation willingness

#### 2.5 Create Pipeline Integration Service
**File**: `packages/supabase/functions/_shared/pipeline-integration.ts`

Services:
- `assignToInitialStage()` - Place in first pipeline stage
- `createStageHistoryEntry()` - Log initial stage assignment
- `sendApplicationNotifications()` - Notify hiring team
- `triggerWebhooks()` - Fire webhook events for external integrations

### Phase 3: Frontend Components (Priority: HIGH)

#### 3.1 Create Application Form Components
**Directory**: `packages/core/features/applications/components/`

Components to create:
1. **ApplicationWizard.tsx** - Main wizard container with step navigation
2. **ProgressIndicator.tsx** - Visual progress through steps
3. **ScreeningStep.tsx** - Location, relocation, experience, authorization, start date
4. **CustomQuestionsStep.tsx** - Render job-specific custom questions
5. **AttachmentsStep.tsx** - File upload interface with drag-and-drop
6. **AssessmentStep.tsx** - If required by job
7. **VideoInterviewStep.tsx** - If required by job
8. **ReviewStep.tsx** - Review all answers before submission
9. **SuccessStep.tsx** - Confirmation and next steps

#### 3.2 Create File Upload Components
**Directory**: `packages/ui/src/components/file-upload/`

Components:
- **FileDropzone.tsx** - Drag-and-drop file upload
- **FilePreview.tsx** - Preview uploaded files
- **UploadProgress.tsx** - Show upload progress
- **FileValidation.tsx** - Client-side validation feedback

#### 3.3 Create Application State Management
**File**: `packages/core/features/applications/hooks/useApplicationForm.ts`

Hooks:
- `useApplicationForm()` - Manage application form state
- `useApplicationStep()` - Handle step navigation and validation
- `useFileUpload()` - Handle file upload logic
- `useApplicationSubmit()` - Handle final submission

#### 3.4 Update Job Detail Modal
**File**: `packages/core/features/discover/components/InternalJobDetailModal.tsx`

Changes:
- Replace simple "Apply" button with "Start Application" button
- Open full-screen application wizard
- Pass job details to wizard
- Handle application submission callback

### Phase 4: Admin/Recruiter Interface (Priority: MEDIUM)

#### 4.1 Create Application Review Components
**Directory**: `packages/core/features/office/components/applications/`

Components:
1. **ApplicationsList.tsx** - Table view of all applications for a job
2. **ApplicationFilters.tsx** - Filter by status, score, date, etc.
3. **ApplicationCard.tsx** - Card view of individual application
4. **ApplicationDetail.tsx** - Full application view with all details
5. **ApplicationActions.tsx** - Move to stage, reject, etc.
6. **ApplicationTimeline.tsx** - Show stage history
7. **ApplicationNotes.tsx** - Add internal notes
8. **BulkActions.tsx** - Bulk reject, bulk move to stage

#### 4.2 Create Application Dashboard
**File**: `packages/core/features/office/office-applications-screen.tsx`

Features:
- Overview statistics (total, pending, reviewing, etc.)
- Recent applications list
- Quick actions
- Filter and search
- Export to CSV

#### 4.3 Create Stage Management Interface
**File**: `packages/core/features/office/components/applications/StageBoard.tsx`

Features:
- Kanban-style board with pipeline stages
- Drag-and-drop to move between stages
- Auto-update stage history
- Quick actions per application

### Phase 5: Validation & Error Handling (Priority: HIGH)

#### 5.1 Client-Side Validation
**File**: `packages/core/features/applications/utils/validation.ts`

Validations:
- Real-time field validation as user types
- Step completion validation before navigation
- File type and size validation before upload
- Custom question validation based on type
- Duplicate application check before starting

#### 5.2 Server-Side Validation
**File**: `packages/supabase/functions/_shared/application-validation.ts`

Validations:
- Validate all data against schemas
- Verify job still accepting applications
- Check for duplicate applications
- Validate file uploads against allowed types/sizes
- Ensure all required fields present

#### 5.3 Error Handling
**Files**: Throughout application flow

Features:
- Graceful error messages
- Retry logic for failed uploads
- Save draft on errors
- Resume from last completed step
- Validation error highlighting

### Phase 6: Testing & Quality Assurance (Priority: MEDIUM)

#### 6.1 Unit Tests
**Directory**: `packages/core/features/applications/__tests__/`

Tests:
- Application form component tests
- Validation logic tests
- Scoring algorithm tests
- File upload tests
- State management tests

#### 6.2 Integration Tests
**Directory**: `packages/supabase/functions/__tests__/applications/`

Tests:
- Full application submission flow
- Auto-screening logic
- Pipeline integration
- File upload and retrieval
- Permission checks

#### 6.3 E2E Tests
**Directory**: `e2e/applications/`

Scenarios:
- Complete application as candidate
- Review application as recruiter
- Auto-rejection flow
- Move application through stages
- File upload and download

### Phase 7: Documentation & Deployment (Priority: LOW)

#### 7.1 User Documentation
**File**: `docs/features/application-user-guide.md`

Content:
- How to apply for jobs
- Step-by-step walkthrough
- File requirements
- Troubleshooting common issues

#### 7.2 Admin Documentation
**File**: `docs/features/application-admin-guide.md`

Content:
- How to review applications
- Understanding scoring
- Managing pipeline stages
- Bulk actions guide
- Export options

#### 7.3 Developer Documentation
**File**: `docs/features/application-developer-guide.md`

Content:
- Architecture overview
- API endpoints reference
- Customizing scoring algorithm
- Adding custom validation rules
- Extending the application flow

## Detailed Implementation Checklist

### Database & Storage
- [x] Create migration 075: Enhance applications table with new columns
- [x] Create migration 076: Set up application-attachments storage bucket
- [x] Create migration 077: Implement application scoring function
- [x] Create migration 078: Implement auto-rejection function
- [x] Add RLS policies for application attachments
- [x] Create indexes for performance optimization
- [x] Test migrations on local Supabase instance
- [ ] Generate updated TypeScript types

### Backend Services
- [x] Create application schemas in `packages/schemas/src/applications/`
- [x] Create application.schema.ts with all validation schemas
- [x] Create applications.router.ts in tRPC
- [x] Implement submitApplication endpoint
- [x] Implement updateApplicationStep endpoint
- [x] Implement uploadAttachment endpoint (getUploadUrl + confirmUpload)
- [x] Implement calculateScore endpoint
- [x] Implement getUserApplications endpoint
- [x] Implement getById endpoint
- [x] Implement withdraw endpoint
- [x] Implement update endpoint
- [x] Export applications router from main tRPC router
- [x] Add comprehensive error handling
- [ ] Implement getJobApplications endpoint (admin) - Phase 4
- [ ] Create application-validation.ts service (optional - logic in router)
- [ ] Create application-scoring.ts service (handled by database function)
- [ ] Create pipeline-integration.ts service (Phase 4)
- [ ] Add logging for debugging

### Frontend - Application Flow
- [ ] Create ApplicationWizard.tsx component
- [ ] Create ProgressIndicator.tsx component
- [ ] Create ScreeningStep.tsx component
- [ ] Create CustomQuestionsStep.tsx component
- [ ] Create AttachmentsStep.tsx component
- [ ] Create AssessmentStep.tsx (conditional)
- [ ] Create VideoInterviewStep.tsx (conditional)
- [ ] Create ReviewStep.tsx component
- [ ] Create SuccessStep.tsx component
- [ ] Create useApplicationForm hook
- [ ] Create useApplicationStep hook
- [ ] Create useFileUpload hook
- [ ] Create useApplicationSubmit hook
- [ ] Update InternalJobDetailModal to launch wizard
- [ ] Add mobile-responsive styling
- [ ] Add accessibility features (ARIA labels, keyboard navigation)

### Frontend - File Uploads
- [ ] Create FileDropzone component in packages/ui
- [ ] Create FilePreview component
- [ ] Create UploadProgress component
- [ ] Create FileValidation component
- [ ] Implement drag-and-drop functionality
- [ ] Add file type validation
- [ ] Add file size validation
- [ ] Add upload progress tracking
- [ ] Add error handling for failed uploads
- [ ] Add retry logic for uploads
- [ ] Support multiple file uploads

### Frontend - Admin Interface
- [ ] Create ApplicationsList component
- [ ] Create ApplicationFilters component
- [ ] Create ApplicationCard component
- [ ] Create ApplicationDetail component
- [ ] Create ApplicationActions component
- [ ] Create ApplicationTimeline component
- [ ] Create ApplicationNotes component
- [ ] Create BulkActions component
- [ ] Create office-applications-screen.tsx
- [ ] Create StageBoard component (Kanban view)
- [ ] Implement drag-and-drop for stage changes
- [ ] Add export to CSV functionality
- [ ] Add pagination for large lists
- [ ] Add real-time updates (optional)

### Validation & Error Handling
- [ ] Implement client-side field validation
- [ ] Implement step validation before navigation
- [ ] Implement file validation before upload
- [ ] Implement custom question validation
- [ ] Implement duplicate application check
- [ ] Add server-side schema validation
- [ ] Add duplicate application prevention
- [ ] Add job status validation
- [ ] Add comprehensive error messages
- [ ] Add error logging
- [ ] Implement draft save on errors
- [ ] Implement resume from last step

### Testing
- [ ] Write unit tests for application components
- [ ] Write unit tests for validation logic
- [ ] Write unit tests for scoring algorithm
- [ ] Write unit tests for file upload
- [ ] Write integration tests for submission flow
- [ ] Write integration tests for auto-screening
- [ ] Write integration tests for pipeline integration
- [ ] Write integration tests for file operations
- [ ] Write E2E tests for candidate application flow
- [ ] Write E2E tests for admin review flow
- [ ] Test on iOS devices
- [ ] Test on Android devices
- [ ] Test on web browsers (Chrome, Firefox, Safari)
- [ ] Perform accessibility testing
- [ ] Perform performance testing

### Documentation
- [ ] Write user guide for candidates
- [ ] Write admin guide for recruiters
- [ ] Write developer documentation
- [ ] Document API endpoints
- [ ] Document database schema
- [ ] Document scoring algorithm
- [ ] Create troubleshooting guide
- [ ] Add inline code documentation
- [ ] Create architecture diagrams
- [ ] Record demo videos (optional)

### Deployment
- [ ] Run all tests locally
- [ ] Deploy migrations to staging
- [ ] Test full flow on staging
- [ ] Deploy backend changes to staging
- [ ] Deploy frontend changes to staging
- [ ] User acceptance testing on staging
- [ ] Deploy to production (migrations first)
- [ ] Deploy backend to production
- [ ] Deploy frontend to production
- [ ] Monitor for errors post-deployment
- [ ] Gather user feedback
- [ ] Iterate based on feedback

## Technical Architecture

### Data Flow

```
1. Candidate starts application
   ↓
2. Multi-step wizard collects data
   ↓
3. Each step saves progress (draft mode)
   ↓
4. File uploads to storage bucket
   ↓
5. Final submission triggers validation
   ↓
6. Calculate application score
   ↓
7. Apply auto-screening rules
   ↓
8. If passed: Assign to pipeline stage
   ↓
9. Create stage history entry
   ↓
10. Notify hiring team
    ↓
11. Return success to candidate
```

### Component Hierarchy

```
InternalJobDetailModal
  └── ApplicationWizard
      ├── ProgressIndicator
      ├── ScreeningStep
      │   ├── LocationInput
      │   ├── RelocationToggle
      │   ├── ExperienceInput
      │   ├── AuthorizationToggle
      │   └── StartDateSelect
      ├── CustomQuestionsStep
      │   ├── ShortTextQuestion
      │   ├── LongTextQuestion
      │   ├── SingleChoiceQuestion
      │   ├── MultipleChoiceQuestion
      │   └── YesNoQuestion
      ├── AttachmentsStep
      │   ├── FileDropzone
      │   ├── FilePreview
      │   └── UploadProgress
      ├── AssessmentStep (conditional)
      ├── VideoInterviewStep (conditional)
      ├── ReviewStep
      └── SuccessStep
```

### API Endpoints

```typescript
applications.submitApplication({
  jobId: string
  screeningAnswers: ScreeningAnswers
  customAnswers: CustomAnswers[]
  attachments: AttachmentMetadata[]
})

applications.updateApplicationStep({
  applicationId: string
  step: string
  data: object
})

applications.uploadAttachment({
  applicationId: string
  type: 'resume' | 'cover_letter' | 'portfolio'
  file: File
})

applications.calculateScore({
  applicationId: string
})

applications.applyAutoScreening({
  applicationId: string
})

applications.getUserApplications({
  userId: string
  status?: string
})

applications.getJobApplications({
  jobId: string
  filters?: ApplicationFilters
})
```

### Database Schema

```sql
applications {
  id: uuid
  job_id: uuid -> jobs(id)
  user_id: uuid -> users(id)
  status: text
  
  -- NEW: Screening answers
  current_location: text
  willing_to_relocate: boolean
  years_experience: integer
  is_authorized_to_work: boolean
  earliest_start_date: text
  
  -- NEW: Question answers
  screening_answers: jsonb
  custom_question_answers: jsonb
  
  -- NEW: Attachments
  attachments: jsonb {
    resume: { path, filename, size, uploaded_at }
    cover_letter: { path, filename, size, uploaded_at }
    portfolio: { path, filename, size, uploaded_at }
  }
  
  -- NEW: Scoring & screening
  application_score: integer (0-100)
  auto_rejected: boolean
  auto_reject_reason: text
  
  -- NEW: Progress tracking
  completed_steps: text[]
  is_complete: boolean
  
  -- Pipeline integration
  pipeline_id: uuid -> pipelines(id)
  pipeline_stage_id: uuid -> pipeline_stages(id)
  stage_entered_at: timestamptz
  
  -- Existing fields
  cover_letter: text
  resume_path: text
  notes: jsonb
  metadata: jsonb
  applied_at: timestamptz
  updated_at: timestamptz
}
```

## Scoring Algorithm

### Point Distribution (Total: 100 points)

1. **Work Authorization** (20 points)
   - Has authorization: 20 points
   - No authorization: 0 points

2. **Years of Experience** (25 points)
   - Exceeds requirement by 3+ years: 25 points
   - Meets requirement exactly: 20 points
   - 1-2 years below requirement: 15 points
   - 3+ years below requirement: 5 points

3. **Required Skills Match** (25 points)
   - Has all required skills: 25 points
   - Missing 1-2 skills: 15 points
   - Missing 3+ skills: 5 points

4. **Required Certifications** (15 points)
   - Has all required certs: 15 points
   - Missing 1 cert: 10 points
   - Missing 2+ certs: 5 points

5. **Location Match** (10 points)
   - Lives in job location: 10 points
   - Willing to relocate: 7 points
   - Remote-capable location: 5 points
   - No match and not willing to relocate: 0 points

6. **Custom Questions Completion** (5 points)
   - All required questions answered: 5 points
   - Some questions unanswered: 2 points
   - Many questions unanswered: 0 points

### Auto-Rejection Rules

Applications are automatically rejected if:
1. Missing work authorization (when required)
2. Score below job's minimum threshold (if set)
3. Missing all required skills (when configured)
4. Missing all required certifications (when configured)
5. Not willing to relocate (when job requires it)

## File Storage Structure

```
application-attachments/
  └── {organization_id}/
      └── {job_id}/
          └── {application_id}/
              ├── resume/
              │   └── {filename}
              ├── cover_letter/
              │   └── {filename}
              ├── portfolio/
              │   └── {filename}
              ├── assessment/
              │   └── {filename}
              └── video_interview/
                  └── {filename}
```

## Error Handling Strategy

### Client-Side Errors
- **Validation errors**: Show inline with field highlighting
- **Upload errors**: Show retry button with error message
- **Network errors**: Show toast notification with retry
- **Step navigation errors**: Prevent navigation and show message

### Server-Side Errors
- **Validation errors**: Return 400 with field-specific errors
- **Permission errors**: Return 403 with clear message
- **Duplicate application**: Return 409 with existing application info
- **File upload errors**: Return 413 for size, 415 for type
- **Internal errors**: Return 500, log for investigation

### Recovery Strategies
- Auto-save draft every 30 seconds
- Resume from last completed step on return
- Retry failed uploads automatically (3 attempts)
- Show clear error messages with next steps
- Provide support contact for persistent issues

## Performance Considerations

### Optimization Strategies
1. **Lazy load** form steps (only load current step)
2. **Debounce** auto-save (save after 1 second of inactivity)
3. **Compress** uploaded files client-side when possible
4. **Cache** job details to avoid repeated fetches
5. **Paginate** application lists in admin interface
6. **Index** commonly queried fields in database
7. **Use CDN** for static assets and common files

### Monitoring
- Track application completion rates
- Monitor average completion time
- Track file upload success/failure rates
- Monitor auto-rejection rates
- Track scoring distribution
- Monitor API response times
- Track error rates by type

## Security Considerations

### Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Validate all inputs server-side
- Sanitize file uploads
- Implement rate limiting on submissions
- Use signed URLs for file access
- Set short expiration on upload URLs

### Access Control
- RLS policies on applications table
- Storage policies on attachments bucket
- Verify user owns application before update
- Verify recruiter has access to job
- Log all access to sensitive data
- Audit trail for all application changes

## Success Metrics

### Candidate Metrics
- Application completion rate (target: >80%)
- Average time to complete (target: <15 minutes)
- Application withdrawal rate (target: <5%)
- User satisfaction score (target: >4/5)

### Recruiter Metrics
- Time to review application (target: <5 minutes)
- Auto-rejection accuracy (target: >90%)
- Pipeline progression rate (target: >60% move past first stage)
- Time to hire (target: reduce by 20%)

### System Metrics
- File upload success rate (target: >99%)
- API response time (target: <500ms p95)
- Error rate (target: <1%)
- System uptime (target: >99.9%)

## Future Enhancements

### Phase 8 (Future)
- AI-powered resume parsing
- Video interview recording and playback
- Integration with background check services
- Automated reference checking
- Candidate chatbot for FAQs
- Mobile app for application submission
- Email/SMS notifications at each stage
- Calendar integration for interview scheduling
- Collaborative hiring (team comments/ratings)
- Advanced analytics dashboard

---

## Getting Started

To begin implementation:

1. **Review and approve** this plan
2. **Set up local environment** with latest migrations
3. **Start with Phase 1** (Database Schema & Storage)
4. **Test each phase** thoroughly before moving to next
5. **Update this document** as implementation progresses
6. **Track progress** using the checklist above

## Questions or Modifications?

If any aspects of this plan need clarification or modification, please update this document or create issues for discussion.

---

**Document Version**: 1.0  
**Created**: October 7, 2025  
**Last Updated**: October 7, 2025  
**Status**: Ready for Implementation
